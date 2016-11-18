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
 * DeviceOne.js                                           *
 *                                                        *
 * setTimeout patch for DeviceOne.                        *
 *                                                        *
 * LastModified: Nov 18, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global) {
    'use strict';
    
    if (typeof global.setTimeout !== "undefined") {
        return;
    }
    if (typeof global.require !== "function") {
    	return;
    }
    var deviceone;
    try {
        deviceone = global.require("deviceone");
    }
    catch (e) {
        return;
    }
    if (!deviceone) {
    	return;
    }
    global.setTimeout = function(func, delay) {
    	if (delay <= 0) {
    		delay = 1;
    	}
        var timer = deviceone.mm("do_Timer");
        timer.delay = delay;
        timer.interval = delay;
        timer.on('tick', function() {
            timer.stop();
            func();
        });
        timer.start();
        return timer;
    };
    global.clearTimeout = function(timer) {
        if (timer.isStart()) {
            timer.stop();
        }
    };
})(hprose.global);