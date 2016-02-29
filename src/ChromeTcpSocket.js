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
 * ChromeTcpSocket.js                                     *
 *                                                        *
 * chrome tcp client for JavaScript.                      *
 *                                                        *
 * LastModified: Feb 29, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var Future = global.hprose.Future;
    var createObject = global.hprose.createObject;
    var defineProperties = global.hprose.defineProperties;

    function noop(){}

    var socketPool = {};
    var tcpInit = false;

    function receiveListener(info) {
        var socket = socketPool[info.socketId];
        socket.onreceive(info.data);
    }

    function receiveErrorListener(info) {
        var socket = socketPool[info.socketId];
        socket.onerror(info.resultCode);
        socket.destroy();
    }

    function ChromeTcpSocket() {
        if (!tcpInit) {
            tcpInit = true;
            chrome.sockets.tcp.onReceive.addListener(receiveListener);
            chrome.sockets.tcp.onReceiveError.addListener(receiveErrorListener);
        }
        this.socketId = new Future();
        this.connected = false;
        this.timeid = undefined;
        this.onclose = noop;
        this.onconnect = noop;
        this.onreceive = noop;
        this.onerror = noop;
    }

    defineProperties(ChromeTcpSocket.prototype, {
        connect: { value: function(address, port, tls, options) {
            var self = this;
            chrome.sockets.tcp.create({ persistent: options && options.persistent }, function(createInfo) {
                if (options) {
                    if ('noDelay' in options) {
                        chrome.sockets.tcp.setNoDelay(createInfo.socketId, options.noDelay, function(result) {
                            if (result < 0) {
                                self.socketId.reject(result);
                                chrome.sockets.tcp.disconnect(createInfo.socketId);
                                chrome.sockets.tcp.close(createInfo.socketId);
                                self.onclose();
                            }
                        });
                    }
                    if ('keepAlive' in options) {
                        chrome.sockets.tcp.setKeepAlive(createInfo.socketId, options.keepAlive, function(result) {
                            if (result < 0) {
                                self.socketId.reject(result);
                                chrome.sockets.tcp.disconnect(createInfo.socketId);
                                chrome.sockets.tcp.close(createInfo.socketId);
                                self.onclose();
                            }
                        });
                    }
                }
                if (tls) {
                    chrome.sockets.tcp.setPaused(createInfo.socketId, true, function() {
                        chrome.sockets.tcp.connect(createInfo.socketId, address, port, function(result) {
                            if (result < 0) {
                                self.socketId.reject(result);
                                chrome.sockets.tcp.disconnect(createInfo.socketId);
                                chrome.sockets.tcp.close(createInfo.socketId);
                                self.onclose();
                            }
                            else {
                                chrome.sockets.tcp.secure(createInfo.socketId, function(secureResult) {
                                    if (secureResult !== 0) {
                                        self.socketId.reject(result);
                                        chrome.sockets.tcp.disconnect(createInfo.socketId);
                                        chrome.sockets.tcp.close(createInfo.socketId);
                                        self.onclose();
                                    }
                                    else {
                                        chrome.sockets.tcp.setPaused(createInfo.socketId, false, function() {
                                            self.socketId.resolve(createInfo.socketId);
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
                else {
                    chrome.sockets.tcp.connect(createInfo.socketId, address, port, function(result) {
                        if (result < 0) {
                            self.socketId.reject(result);
                            chrome.sockets.tcp.disconnect(createInfo.socketId);
                            chrome.sockets.tcp.close(createInfo.socketId);
                            self.onclose();
                        }
                        else {
                            self.socketId.resolve(createInfo.socketId);
                        }
                    });
                }
            });
            this.socketId.then(function(socketId) {
                socketPool[socketId] = self;
                self.connected = true;
                self.onconnect(socketId);
            }, function(reason) {
                self.onerror(reason);
            });
        } },
        send: { value: function(data) {
            var self = this;
            var promise = new Future();
            this.socketId.then(function(socketId) {
                chrome.sockets.tcp.send(socketId, data, function(sendInfo) {
                    if (sendInfo.resultCode < 0) {
                        self.onerror(sendInfo.resultCode);
                        promise.reject(sendInfo.resultCode);
                        self.destroy();
                    }
                    else {
                        promise.resolve(sendInfo.bytesSent);
                    }
                });
            });
            return promise;
        } },
        destroy: { value: function() {
            var self = this;
            this.connected = false;
            this.socketId.then(function(socketId) {
                chrome.sockets.tcp.disconnect(socketId);
                chrome.sockets.tcp.close(socketId);
                delete socketPool[socketId];
                delete receivePool[socketId];
                self.onclose();
            });
        } },
        ref: { value: function() {
            this.socketId.then(function(socketId) {
                chrome.sockets.tcp.setPaused(socketId, false);
            });
        } },
        unref: { value: function() {
            this.socketId.then(function(socketId) {
                chrome.sockets.tcp.setPaused(socketId, true);
            });
        } },
        clearTimeout: { value: function() {
            if (this.timeid !== undefined) {
                global.clearTimeout(this.timeid);
            }
        } },
        setTimeout: { value: function(timeout, fn) {
            this.clearTimeout();
            this.timeid = global.setTimeout(fn, timeout);
        } }
    });

    global.hprose.ChromeTcpSocket = ChromeTcpSocket;

})(this);
