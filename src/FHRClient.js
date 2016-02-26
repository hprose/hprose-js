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
 * FHRClient.js                                           *
 *                                                        *
 * hprose Flash Http Request client for JavaScript.       *
 *                                                        *
 * LastModified: Feb 25, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var FlashHttpRequest = global.FlashHttpRequest;
    var Client = global.hprose.Client;
    var Future = global.hprose.Future;
    var createObject = global.hprose.createObject;
    var defineProperties = global.hprose.defineProperties;

    function noop(){}

    function FHRClient(uri, functions, settings) {
        if (this.constructor !== FHRClient) return new FHRClient(uri, functions, settings);
        Client.call(this, uri, functions, settings);
        var _header = createObject(null);

        var self = this;

        function sendAndReceive(request, env) {
            var future = new Future();
            var callback = function(data, error) {
                if (error === null) {
                    future.resolve(data);
                }
                else {
                    future.reject(new Error(error));
                }
            };
            FlashHttpRequest.post(self.uri(), _header, request, callback, env.timeout, env.binary);
            if (env.oneway) future.resolve();
            return future;
        }
        function setHeader(name, value) {
            if (name.toLowerCase() !== 'content-type') {
                if (value) {
                    _header[name] = value;
                }
                else {
                    delete _header[name];
                }
            }
        }
        defineProperties(this, {
            setHeader: { value: setHeader },
            sendAndReceive: { value: sendAndReceive }
        });
    }

    global.hprose.FHRClient = FHRClient;

})(this);
