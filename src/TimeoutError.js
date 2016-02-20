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
 * LastModified: Jul 17, 2015                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

if (typeof TimeoutError !== 'function') {
    var TimeoutError = function TimeoutError(message) {
        Error.call(this);
        this.message = message;
        this.name = TimeoutError.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, TimeoutError);
        }
    };

    TimeoutError.prototype = hprose.createObject(Error.prototype);
    TimeoutError.prototype.constructor = TimeoutError;
}
