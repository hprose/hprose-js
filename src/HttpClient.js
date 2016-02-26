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
 * HttpClient.js                                          *
 *                                                        *
 * hprose http client for JavaScript.                     *
 *                                                        *
 * LastModified: Feb 25, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var FlashHttpRequest = global.FlashHttpRequest;
    var FHRClient = global.hprose.FHRClient;
    var XHRClient = global.hprose.XHRClient;
    var HttpClient = (location.protocol !== 'file:' &&
                    !FlashHttpRequest.corsSupport() &&
                    FlashHttpRequest.flashSupport()) ? FHRClient : XHRClient;

    var defineProperties = global.hprose.defineProperties;

    function checkuri(uri) {
        var parser = document.createElement('a');
        parser.href = uri;
        if (parser.protocol === 'http:' ||
            parser.protocol === 'https:') {
            return;
        }
        throw new Error('This client desn\'t support ' + parser.protocol + ' scheme.');
    }

    function create(uri, functions, settings) {
        if (typeof uri === 'string') {
            checkuri(uri);
        }
        else if (Array.isArray(uri)) {
            uri.forEach(function(uri) { checkuri(uri); });
        }
        else {
            return new Error('You should set server uri first!');
        }
        return new HttpClient(uri, functions, settings);
    }

    defineProperties(HttpClient, {
        'create': { value: create }
    });

    global.HproseHttpClient = global.hprose.HttpClient = HttpClient;

})(this);
