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
 * LastModified: Oct 17, 2014                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*jshint es3:true, unused:false, eqeqeq:true */

var JSONRPCClientFilter = (function (global) {
    'use strict'
    var s_id = 1;
    var JSONRPCClientFilter = {
        version: "2.0",
        inputFilter: function(value, context) {
            var response = JSON.parse(value);
            var stream = new HproseStringOutputStream();
            var writer = new HproseWriter(stream, true);
            if (response.error) {
                stream.write(HproseTags.TagError);
                writer.writeString(response.error.message);
            }
            else {
                stream.write(HproseTags.TagResult);
                writer.serialize(response.result);
            }
            stream.write(HproseTags.TagEnd);
            return stream.toString();
        },
        outputFilter: function(value, context) {
            var request = {};
            if (this.version === "1.1") {
                request.version = "1.1";
            }
            else if (this.version === "2.0") {
                request.jsonrpc = "2.0";
            }
            var stream = new HproseStringInputStream(value);
            var reader = new HproseReader(stream, false);
            var tag = stream.getc();
            if (tag === HproseTags.TagCall) {
                request.method = reader.readString();
                tag = stream.getc();
                if (tag === HproseTags.TagList) {
                    request.params = reader.readListWithoutTag();
                }
            }
            request.id = s_id++;
            return JSON.stringify(request);
        }
    };
    return JSONRPCClientFilter;
})(window);