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
 * XHRClient.js                                           *
 *                                                        *
 * hprose XMLHttpRequest client for JavaScript.           *
 *                                                        *
 * LastModified: Feb 25, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var Client = global.hprose.Client;
    var Future = global.hprose.Future;
    var createObject = global.hprose.createObject;
    var defineProperties = global.hprose.defineProperties;

    var nativeXHR = (typeof(XMLHttpRequest) !== 'undefined');
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

    function XHRClient(uri, functions, settings) {
        if (this.constructor !== XHRClient) return new XHRClient(uri, functions, settings);
        Client.call(this, uri, functions, settings);
        var _header = createObject(null);

        var self = this;

        function send(request, future, env) {
            var xhr = createXHR();
            xhr.open('POST', self.uri(), true);
            if ('withCredentials' in xhr &&
                global.location !== undefined &&
                global.location.protocol !== 'file:') {
                xhr.withCredentials = 'true';
            }
            for (var name in _header) {
                xhr.setRequestHeader(name, _header[name]);
            }
            xhr.responseType = 'text';
            var mimetype = "text/plain; charset=" + (env.binary ? "x-user-defined" : "utf-8");
            xhr.setRequestHeader("Content-Type", mimetype);
            xhr.overrideMimeType(mimetype);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    xhr.onreadystatechange = noop;
                    if (xhr.status) {
                        if (xhr.status === 200) {
                            future.resolve(xhr.responseText);
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
            if (xhr.upload !== undefined) {
                xhr.upload.onprogress = self.onRequestProgress || self.onprogress || noop;
            }
            xhr.onprogress = self.onResponseProgress || self.onprogress || noop;
            xhr.send(request);
            return xhr;
        }

        function sendAndReceive(request, env) {
            var future = new Future();
            var xhr = send(request, future, env);
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
            onprogress: { value: null, writable: true },
            onRequestProgress: { value: null, writable: true },
            onResponseProgress: { value: null, writable: true },
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
        return new XHRClient(uri, functions, settings);
    }

    defineProperties(XHRClient, {
        'create': { value: create }
    });

    global.hprose.XHRClient = XHRClient;

})(this);
