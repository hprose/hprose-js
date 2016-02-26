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
 * LastModified: Feb 26, 2016                             *
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
    // get flash path
    var scripts = document.getElementsByTagName('script');
    var s_flashpath = scripts[scripts.length - 1].getAttribute('flashpath') || '';
    scripts = null;

    // static private members
    var s_nativeXHR = (typeof(XMLHttpRequest) !== 'undefined');
    var s_localfile = (location.protocol === 'file:');
    var s_corsSupport = (!s_localfile && s_nativeXHR && 'withCredentials' in new XMLHttpRequest());
    var s_flashID = 'flashhttprequest_as3';

    var s_flashSupport = false;

    /*
     * to save Flash Request
     */
    var s_request = null;

    /*
     * to save all request callback functions
     */
    var s_callbackList = [];

    /*
     * to save FlashHttpRequest tasks.
     */
    var s_jsTaskQueue = [];
    var s_swfTaskQueue = [];

    /*
     * to save js & swf status.
     */
    var s_jsReady = false;
    var s_swfReady = false;

    function checkFlash() {
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
                var ax = new ActiveXObject(flashax);
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
        s_flashSupport = flashStatus > 0;
        if (s_flashSupport) {
            var div = document.createElement('div');
            div.style.width = 0;
            div.style.height = 0;
            if (flashStatus === 1) {
                div.innerHTML = ['<object ',
                'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ',
                'type="application/x-shockwave-flash" ',
                'width="0" height="0" id="', s_flashID, '" name="', s_flashID, '">',
                '<param name="movie" value="', s_flashpath , 'FlashHttpRequest.swf" />',
                '<param name="allowScriptAccess" value="always" />',
                '<param name="quality" value="high" />',
                '<param name="wmode" value="opaque" />',
                '</object>'].join('');
            } else {
                div.innerHTML = '<embed id="' + s_flashID + '" ' +
                'src="' + s_flashpath + 'FlashHttpRequest.swf" ' +
                'type="application/x-shockwave-flash" ' +
                'width="0" height="0" name="' + s_flashID + '" ' +
                'allowScriptAccess="always" />';
            }
            document.documentElement.appendChild(div);
        }
    }

    function setJsReady() {
        if (s_jsReady) return;
        s_jsReady = true;
        if (!s_localfile && !s_corsSupport) setFlash();
        while (s_jsTaskQueue.length > 0) {
            var task = s_jsTaskQueue.shift();
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
    //                 if (!s_jsReady) {
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
        if (s_swfReady) {
            s_request.post(url, header, data, callbackid, timeout, binary);
        }
        else {
            s_swfTaskQueue.push(function() {
                s_request.post(url, header, data, callbackid, timeout, binary);
            });
        }
    }

    var FlashHttpRequest = {};

    FlashHttpRequest.flashSupport = function() {
        return s_flashSupport;
    };

    FlashHttpRequest.corsSupport = function() {
        return s_corsSupport;
    };

    FlashHttpRequest.post = function(url, header, data, callback, timeout, binary) {
        var callbackid = -1;
        if (callback) {
            callbackid = s_callbackList.length;
            s_callbackList[callbackid] = callback;
        }
        if (s_jsReady) {
            post(url, header, data, callbackid, timeout, binary);
        }
        else {
            s_jsTaskQueue.push(function() {
                post(url, header, data, callbackid, timeout, binary);
            });
        }
    };

    FlashHttpRequest.__callback = function (callbackid, data, error) {
        if (typeof(s_callbackList[callbackid]) === 'function') {
            s_callbackList[callbackid](data, error);
        }
        delete s_callbackList[callbackid];
    };

    FlashHttpRequest.__jsReady = function () {
        return s_jsReady;
    };

    FlashHttpRequest.__setSwfReady = function () {
        s_request = (navigator.appName.indexOf('Microsoft') !== -1) ?
                    global[s_flashID] : document[s_flashID];
        s_swfReady = true;
        global.__flash__removeCallback = function (instance, name) {
            try {
                if (instance) {
                    instance[name] = null;
                 }
            }
            catch (flashEx) {
            }
        };
        while (s_swfTaskQueue.length > 0) {
            var task = s_swfTaskQueue.shift();
            if (typeof(task) === 'function') task();
        }
    };

    global.FlashHttpRequest = FlashHttpRequest;

    //init();
    setJsReady();

})(this);
