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
 * LastModified: Sep 29, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var Client = global.hprose.Client;
    var Future = global.hprose.Future;
    var createObject = global.hprose.createObject;
    var defineProperties = global.hprose.defineProperties;
    var toBinaryString = global.hprose.toBinaryString;
    var toUint8Array = global.hprose.toUint8Array;
    var parseuri = global.hprose.parseuri;
    var cookieManager = global.hprose.cookieManager;

    var TimeoutError = global.TimeoutError;
    var FlashHttpRequest = global.FlashHttpRequest;

    var XMLHttpRequest = global.XMLHttpRequest;

    if (global.plus && global.plus.net && global.plus.net.XMLHttpRequest) {
        XMLHttpRequest = global.plus.net.XMLHttpRequest;
    }
    else if (global.document && global.document.addEventListener) {
        global.document.addEventListener("plusready", function() {
            XMLHttpRequest = global.plus.net.XMLHttpRequest;
        }, false);
    }

    var deviceone;
    
    try {
        deviceone = global.require("deviceone");
    }
    catch (e) {}

    var localfile = (global.location !== undefined && global.location.protocol === 'file:');
    var nativeXHR = (typeof(XMLHttpRequest) !== 'undefined');
    var corsSupport = (!localfile && nativeXHR && 'withCredentials' in new XMLHttpRequest());
    var ActiveXObject = global.ActiveXObject;

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
        else if (ActiveXObject) {
            return createMSXMLHttp();
        }
        else {
            throw new Error("XMLHttpRequest is not supported by this browser.");
        }
    }

    function noop(){}

    if (nativeXHR && typeof(Uint8Array) !== 'undefined' && !XMLHttpRequest.prototype.sendAsBinary) {
        XMLHttpRequest.prototype.sendAsBinary = function(bs) {
            var data = toUint8Array(bs);
            this.send(ArrayBuffer.isView ? data : data.buffer);
        };
    }

    function HttpClient(uri, functions, settings) {
        if (this.constructor !== HttpClient) {
            return new HttpClient(uri, functions, settings);
        }
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
                                future.resolve(toBinaryString(xhr.response));
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
            var cookie = cookieManager.getCookie(self.uri());
            if (cookie !== '') {
                _header['Cookie'] = cookie;
            }
            global.api.ajax({
                url: self.uri(),
                method: 'post',
                data: { body: request },
                timeout: env.timeout,
                dataType: 'text',
                headers: _header,
                returnAll: true,
                certificate: self.certificate
            }, function(ret, err) {
                if (ret) {
                    if (ret.statusCode === 200) {
                        cookieManager.setCookie(ret.headers, self.uri());
                        future.resolve(ret.body);
                    }
                    else {
                        future.reject(new Error(ret.statusCode+':'+ret.body));
                    }
                }
                else {
                    future.reject(new Error(err.msg));
                }
            });
            return future;
        }

        function deviceOnePost(request, env) {
            var future = new Future();
            var http = deviceone.mm('do_Http');
            http.method = "POST";
            http.timeout = env.timeout;
            http.contextType = "text/plain; charset=UTF-8";
            http.url = self.uri();
            http.body = request;
            for (var name in _header) {
                http.setRequestHeader(name, _header[name]);
            }
            var cookie = cookieManager.getCookie(self.uri());
            if (cookie !== '') {
                http.setRequestHeader('Cookie', cookie);
            }
            http.on("success", function(data) {
                var cookie = http.getResponseHeader('set-cookie');
                if (cookie) {
                    cookieManager.setCookie({'set-cookie': cookie}, self.uri());
                }
                future.resolve(data);
            });
            http.on("fail", function(result) {
                future.reject(new Error(result.status + ":" + result.data));
            });
            http.request();
            return future;
        }

        function isCrossDomain() {
            if (global.location === undefined) {
                return true;
            }
            var parser = parseuri(self.uri());
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
                         deviceone ? deviceOnePost(request, env) :
                                    xhrPost(request, env);
            if (env.oneway) { future.resolve(); }
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
        var parser = parseuri(uri);
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
            throw new Error('You should set server uri first!');
        }
        return new HttpClient(uri, functions, settings);
    }

    defineProperties(HttpClient, {
        create: { value: create }
    });

    global.HproseHttpClient = global.hprose.HttpClient = HttpClient;

})(this || [eval][0]('this'));
