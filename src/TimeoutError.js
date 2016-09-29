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
 * TimeoutError.js                                        *
 *                                                        *
 * TimeoutError for JavaScript.                           *
 *                                                        *
 * LastModified: Sep 29, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function(global) {
    if (typeof global.TimeoutError !== 'function') {
        var TimeoutError = function(message) {
            Error.call(this);
            this.message = message;
            this.name = TimeoutError.name;
            if (typeof Error.captureStackTrace === 'function') {
                Error.captureStackTrace(this, TimeoutError);
            }
        }
        TimeoutError.prototype = global.hprose.createObject(Error.prototype);
        TimeoutError.prototype.constructor = TimeoutError;
        global.TimeoutError = TimeoutError;
    }
})(this || [eval][0]('this'));
