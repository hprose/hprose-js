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
 * FlashHttpRequest.js                                    *
 *                                                        *
 * POST data to HTTP Server (using Flash).                *
 *                                                        *
 * LastModified: Oct 23, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*
 * Interfaces:
 * FlashHttpRequest.post(url, header, data, callback, timeout, binary);
 */

/* public class FlashHttpRequest
 * static encapsulation environment for FlashHttpRequest
 */

/*jshint es3:true, unused:false, eqeqeq:true */
(function (global) {
    'use strict';
    if (typeof global.document === "undefined") {
        global.FlashHttpRequest = {
            flashSupport: function() { return false; }
        };
        return;
    }
    // get flash path
    var document = global.document;
    var scripts = document.getElementsByTagName('script');
    var flashpath = scripts[scripts.length - 1].getAttribute('flashpath') || '';
    scripts = null;

    // static private members
    var localfile = (global.location !== undefined && global.location.protocol === 'file:');
    var XMLHttpRequest = global.XMLHttpRequest;
    var nativeXHR = (typeof(XMLHttpRequest) !== 'undefined');
    var corsSupport = (!localfile && nativeXHR && 'withCredentials' in new XMLHttpRequest());

    var flashID = 'flashhttprequest_as3';

    var flashSupport = false;

    /*
     * to save Flash Request
     */
    var request = null;

    /*
     * to save all request callback functions
     */
    var callbackList = [];

    /*
     * to save FlashHttpRequest tasks.
     */
    var jsTaskQueue = [];
    var swfTaskQueue = [];

    /*
     * to save js & swf status.
     */
    var jsReady = false;
    var swfReady = false;

    function checkFlash() {
        if (!navigator) {
            return 0;
        }
        var flash = 'Shockwave Flash';
        var flashmime = 'application/x-shockwave-flash';
        var flashax = 'ShockwaveFlash.ShockwaveFlash';
        var plugins = navigator.plugins;
        var mimetypes = navigator.mimeTypes;
        var version = 0;
        var ie = false;
        if (plugins && plugins[flash]) {
            version = plugins[flash].description;
            if (version && !(mimetypes && mimetypes[flashmime] &&
                         !mimetypes[flashmime].enabledPlugin)) {
                version = version.replace(/^.*\s+(\S+\s+\S+$)/, '$1');
                version = parseInt(version.replace(/^(.*)\..*$/, '$1'), 10);
            }
        }
        else if (global.ActiveXObject) {
            try {
                ie = true;
                var ax = new global.ActiveXObject(flashax);
                if (ax) {
                    version = ax.GetVariable('$version');
                    if (version) {
                        version = version.split(' ')[1].split(',');
                        version = parseInt(version[0], 10);
                    }
                }
            }
            catch(e) {}
        }
        if (version < 10) {
            return 0;
        }
        else if (ie) {
            return 1;
        }
        else {
            return 2;
        }
    }

    function setFlash() {
        var flashStatus = checkFlash();
        flashSupport = flashStatus > 0;
        if (flashSupport) {
            var div = document.createElement('div');
            div.style.width = 0;
            div.style.height = 0;
            if (flashStatus === 1) {
                div.innerHTML = ['<object ',
                'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ',
                'type="application/x-shockwave-flash" ',
                'width="0" height="0" id="', flashID, '" name="', flashID, '">',
                '<param name="movie" value="', flashpath , 'FlashHttpRequest.swf?', +(new Date()), '" />',
                '<param name="allowScriptAccess" value="always" />',
                '<param name="quality" value="high" />',
                '<param name="wmode" value="opaque" />',
                '</object>'].join('');
            } else {
                div.innerHTML = '<embed id="' + flashID + '" ' +
                'src="' + flashpath + 'FlashHttpRequest.swf?' + (+(new Date())) + '" ' +
                'type="application/x-shockwave-flash" ' +
                'width="0" height="0" name="' + flashID + '" ' +
                'allowScriptAccess="always" />';
            }
            document.documentElement.appendChild(div);
        }
    }

    function setJsReady() {
        if (jsReady) { return; }
        if (!localfile && !corsSupport) { setFlash(); }
        jsReady = true;
        while (jsTaskQueue.length > 0) {
            var task = jsTaskQueue.shift();
            if (typeof(task) === 'function') {
                task();
            }
        }
    }

    // function detach() {
    //     if (document.addEventListener) {
    //         document.removeEventListener('DOMContentLoaded', completed, false);
    //         global.removeEventListener('load', completed, false);
    //
    //     } else {
    //         document.detachEvent('onreadystatechange', completed);
    //         global.detachEvent('onload', completed);
    //     }
    // }
    //
    // function completed(event) {
    //     if (document.addEventListener || event.type === 'load' || document.readyState === 'complete') {
    //         detach();
    //         setJsReady();
    //     }
    // }
    //
    // function init() {
    //     if (document.readyState === 'complete') {
    //         setTimeout(setJsReady, 0);
    //     }
    //     else if (document.addEventListener) {
    //         document.addEventListener('DOMContentLoaded', completed, false);
    //         global.addEventListener('load', completed, false);
    //         if (/WebKit/i.test(navigator.userAgent)) {
    //             var timer = setInterval( function () {
    //                 if (/loaded|complete/.test(document.readyState)) {
    //                     clearInterval(timer);
    //                     completed();
    //                 }
    //             }, 10);
    //         }
    //     }
    //     else if (document.attachEvent) {
    //         document.attachEvent('onreadystatechange', completed);
    //         global.attachEvent('onload', completed);
    //         var top = false;
    //         try {
    //             top = window.frameElement === null && document.documentElement;
    //         }
    //         catch(e) {}
    //         if (top && top.doScroll) {
    //             (function doScrollCheck() {
    //                 if (!jsReady) {
    //                     try {
    //                         top.doScroll('left');
    //                     }
    //                     catch(e) {
    //                         return setTimeout(doScrollCheck, 15);
    //                     }
    //                     detach();
    //                     setJsReady();
    //                 }
    //             })();
    //         }
    //     }
    //     else if (/MSIE/i.test(navigator.userAgent) &&
    //             /Windows CE/i.test(navigator.userAgent)) {
    //         setJsReady();
    //     }
    //     else {
    //         global.onload = setJsReady;
    //     }
    // }

    function post(url, header, data, callbackid, timeout, binary) {
        data = encodeURIComponent(data);
        if (swfReady) {
            request.post(url, header, data, callbackid, timeout, binary);
        }
        else {
            swfTaskQueue.push(function() {
                request.post(url, header, data, callbackid, timeout, binary);
            });
        }
    }

    var FlashHttpRequest = {};

    FlashHttpRequest.flashSupport = function() {
        return flashSupport;
    };

    FlashHttpRequest.post = function(url, header, data, callback, timeout, binary) {
        var callbackid = -1;
        if (callback) {
            callbackid = callbackList.length;
            callbackList[callbackid] = callback;
        }
        if (jsReady) {
            post(url, header, data, callbackid, timeout, binary);
        }
        else {
            jsTaskQueue.push(function() {
                post(url, header, data, callbackid, timeout, binary);
            });
        }
    };

    FlashHttpRequest.__callback = function (callbackid, data, error) {
        data = (data !== null) ? decodeURIComponent(data) : null;
        error = (error !== null) ? decodeURIComponent(error) : null;
        if (typeof(callbackList[callbackid]) === 'function') {
            callbackList[callbackid](data, error);
        }
        delete callbackList[callbackid];
    };

    FlashHttpRequest.__jsReady = function () {
        return jsReady;
    };

    FlashHttpRequest.__setSwfReady = function () {
        request = (navigator.appName.indexOf('Microsoft') !== -1) ?
                    global[flashID] : document[flashID];
        swfReady = true;
        global.__flash__removeCallback = function (instance, name) {
            try {
                if (instance) {
                    instance[name] = null;
                 }
            }
            catch (flashEx) {
            }
        };
        while (swfTaskQueue.length > 0) {
            var task = swfTaskQueue.shift();
            if (typeof(task) === 'function') { task(); }
        }
    };

    global.FlashHttpRequest = FlashHttpRequest;

    //init();
    setJsReady();

})(this || [eval][0]('this'));
