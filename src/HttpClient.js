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
 * LastModified: Feb 27, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var arrayLikeObjectArgumentsEnabled = true;

    try {
        String.fromCharCode.apply(String, new Uint8Array([1]));
    }
    catch (e) {
        arrayLikeObjectArgumentsEnabled = false;
    }

    var Client = global.hprose.Client;
    var Future = global.hprose.Future;
    var createObject = global.hprose.createObject;
    var defineProperties = global.hprose.defineProperties;

    var TimeoutError = global.TimeoutError;
    var FlashHttpRequest = global.FlashHttpRequest;

    var XMLHttpRequest = global.XMLHttpRequest;

    if (typeof(plus) !== "undefined" &&
        typeof(plus.net) !== "undefined" &&
        typeof(plus.net.XMLHttpRequest) !== "undefined") {
        XMLHttpRequest = plus.net.XMLHttpRequest;
    }

    var localfile = (global.location !== undefined && global.location.protocol === 'file:');
    var nativeXHR = (typeof(XMLHttpRequest) !== 'undefined');
    var corsSupport = (!localfile && nativeXHR && 'withCredentials' in new XMLHttpRequest());

    var XMLHttpNameCache = null;

    function createMSXMLHttp() {
        if (XMLHttpNameCache !== null) {
            // Use the cache name first.
            return new ActiveXObject(XMLHttpNameCache);
        }
        var MSXML = ['MSXML2.XMLHTTP',
                     'MSXML2.XMLHTTP.6.0',
                     'MSXML2.XMLHTTP.5.0',
                     'MSXML2.XMLHTTP.4.0',
                     'MSXML2.XMLHTTP.3.0',
                     'MsXML2.XMLHTTP.2.6',
                     'Microsoft.XMLHTTP',
                     'Microsoft.XMLHTTP.1.0',
                     'Microsoft.XMLHTTP.1'];
        var n = MSXML.length;
        for(var i = 0; i < n; i++) {
            try {
                var xhr = new ActiveXObject(MSXML[i]);
                // Cache the XMLHttp ActiveX object name.
                XMLHttpNameCache = MSXML[i];
                return xhr;
            }
            catch(e) {}
        }
        throw new Error('Could not find an installed XML parser');
    }

    function createXHR() {
        if (nativeXHR) {
            return new XMLHttpRequest();
        }
        else {
            return createMSXMLHttp();
        }
    }

    function noop(){}

    if (nativeXHR && typeof(Uint8Array) !== 'undefined' && !XMLHttpRequest.prototype.sendAsBinary) {
        XMLHttpRequest.prototype.sendAsBinary = function(bs) {
            var n = bs.length, data = new Uint8Array(n);
            for (var i = 0; i < n; i++) {
                data[i] = bs.charCodeAt(i) & 0xFF;
            }
            this.send(ArrayBuffer.isView ? data : data.buffer);
        };
    }

    var toBinaryString;
    if (arrayLikeObjectArgumentsEnabled) {
        toBinaryString = function(charCodes) {
            var n = charCodes.length;
            if (n < 100000) {
                return String.fromCharCode.apply(String, charCodes);
            }
            var remain = n & 0xFFFF;
            var count = n >> 16;
            var a = new Array(remain ? count + 1 : count);
            for (var i = 0; i < count; ++i) {
                a[i] = String.fromCharCode.apply(String, charCodes.subarray(i << 16, (i + 1) << 16));
            }
            if (remain) {
                a[count] = String.fromCharCode.apply(String, charCodes.subarray(count << 16, n));
            }
            return a.join('');
        };
    }
    else {
        toBinaryString = function(bytes) {
            var n = bytes.length;
            var charCodes = new Array(bytes.length);
            for (var i = 0; i < n; ++i) {
                charCodes[i] = bytes[i];
            }
            if (n < 100000) {
                return String.fromCharCode.apply(String, charCodes);
            }
            var remain = n & 0xFFFF;
            var count = n >> 16;
            var a = new Array(remain ? count + 1 : count);
            for (i = 0; i < count; ++i) {
                a[i] = String.fromCharCode.apply(String, charCodes.slice(i << 16, (i + 1) << 16));
            }
            if (remain) {
                a[count] = String.fromCharCode.apply(String, charCodes.slice(count << 16, n));
            }
            return a.join('');
        };
    }

    function HttpClient(uri, functions, settings) {
        if (this.constructor !== HttpClient) return new HttpClient(uri, functions, settings);
        Client.call(this, uri, functions, settings);
        var _header = createObject(null);

        var self = this;

        function xhrPost(request, env) {
            var future = new Future();
            var xhr = createXHR();
            xhr.open('POST', self.uri(), true);
            if (corsSupport) {
                xhr.withCredentials = 'true';
            }
            for (var name in _header) {
                xhr.setRequestHeader(name, _header[name]);
            }
            if (!env.binary) {
                xhr.setRequestHeader("Content-Type", "text/plain; charset=UTF-8");
            }
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    xhr.onreadystatechange = noop;
                    if (xhr.status) {
                        if (xhr.status === 200) {
                            if (env.binary) {
                                future.resolve(toBinaryString(new Uint8Array(xhr.response)));
                            }
                            else {
                                future.resolve(xhr.responseText);
                            }
                        }
                        else {
                            future.reject(new Error(xhr.status + ':' + xhr.statusText));
                        }
                    }
                }
            };
            xhr.onerror = function() {
                future.reject(new Error('error'));
            };
            if (env.timeout > 0) {
                future = future.timeout(env.timeout).catchError(function(e) {
                    xhr.onreadystatechange = noop;
                    xhr.onerror = noop;
                    xhr.abort();
                    throw e;
                },
                function(e) {
                    return e instanceof TimeoutError;
                });
            }
            if (env.binary) {
                xhr.responseType = "arraybuffer";
                xhr.sendAsBinary(request);
            }
            else {
                xhr.send(request);
            }
            return future;
        }

        function fhrPost(request, env) {
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
            return future;
        }

        function apiPost(request, env) {
            var future = new Future();
            api.ajax({
                url: self.uri(),
                method: 'post',
                data: { body: request },
                timeout: env.timeout,
                dataType: 'text',
                headers: _header,
                certificate: self.certificate
            }, function(ret, err) {
                if (ret) {
                    future.resolve(ret.body);
                }
                else {
                    future.reject(new Error(err.msg));
                }
            });
        }

        function isCrossDomain() {
            if (global.location === undefined) {
                return true;
            }
            var parser = document.createElement('a');
            parser.href = self.uri();
            if (parser.protocol !== global.location.protocol) {
                return true;
            }
            if (parser.host !== global.location.host) {
                return true;
            }
            return false;
        }

        function sendAndReceive(request, env) {
            var fhr = (FlashHttpRequest.flashSupport() &&
                      !localfile && !corsSupport &&
                      (env.binary || isCrossDomain()));
            var apicloud = (typeof(global.api) !== "undefined" &&
                           typeof(global.api.ajax) !== "undefined");
            var future = fhr ?      fhrPost(request, env) :
                         apicloud ? apiPost(request, env) :
                                    xhrPost(request, env);
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
            certificate: { value: null, writable: true },
            setHeader: { value: setHeader },
            sendAndReceive: { value: sendAndReceive }
        });
    }

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
