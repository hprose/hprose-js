/**********************************************************\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: http://www.hprose.com/                 |
|                   http://www.hprose.org/                 |
|                                                          |
\**********************************************************/

/**********************************************************\
 *                                                        *
 * JSONRPCClientFilter.js                                 *
 *                                                        *
 * jsonrpc client filter for JavaScript.                  *
 *                                                        *
 * LastModified: Nov 18, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/* global JSON */
(function (hprose) {
    'use strict';

    var Tags = hprose.Tags;
    var StringIO = hprose.StringIO;
    var Writer = hprose.Writer;
    var Reader = hprose.Reader;

    var s_id = 1;

    function JSONRPCClientFilter(version) {
        this.version = version || '2.0';
    }

    JSONRPCClientFilter.prototype.inputFilter = function inputFilter(data/*, context*/) {
        if (data.charAt(0) === '{') {
            data = '[' + data + ']';
        }
        var responses = JSON.parse(data);
        var stream = new StringIO();
        var writer = new Writer(stream, true);
        for (var i = 0, n = responses.length; i < n; ++i) {
            var response = responses[i];
            if (response.error) {
                stream.write(Tags.TagError);
                writer.writeString(response.error.message);
            }
            else {
                stream.write(Tags.TagResult);
                writer.serialize(response.result);
            }
        }
        stream.write(Tags.TagEnd);
        return stream.take();
    };

    JSONRPCClientFilter.prototype.outputFilter = function outputFilter(data/*, context*/) {
        var requests = [];
        var stream = new StringIO(data);
        var reader = new Reader(stream, false, false);
        var tag = stream.readChar();
        do {
            var request = {};
            if (tag === Tags.TagCall) {
                request.method = reader.readString();
                tag = stream.readChar();
                if (tag === Tags.TagList) {
                    request.params = reader.readListWithoutTag();
                    tag = stream.readChar();
                }
                if (tag === Tags.TagTrue) {
                    tag = stream.readChar();
                }
            }
            if (this.version === '1.1') {
                request.version = '1.1';
            }
            else if (this.version === '2.0') {
                request.jsonrpc = '2.0';
            }
            request.id = s_id++;
            requests.push(request);
        } while (tag === Tags.TagCall);
        if (requests.length > 1) {
            return JSON.stringify(requests);
        }
        return JSON.stringify(requests[0]);
    };

    hprose.JSONRPCClientFilter = JSONRPCClientFilter;

})(hprose);
