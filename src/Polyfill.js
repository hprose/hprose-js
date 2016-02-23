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
 * Polyfill.js                                            *
 *                                                        *
 * Polyfill for JavaScript.                               *
 *                                                        *
 * LastModified: Feb 23, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';
    /* Function */
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(oThis) {
            if (typeof this !== 'function') {
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            }
            var aArgs   = Array.prototype.slice.call(arguments, 1),
                toBind = this,
                NOP    = function() {},
                bound  = function() {
                    return toBind.apply(this instanceof NOP ? this : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            if (this.prototype) {
                NOP.prototype = this.prototype;
            }
            bound.prototype = new NOP();
            return bound;
        };
    }
    /* Array */
    if (!('isArray' in Array)) {
        Array.isArray = function(arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement /*, fromIndex */) {
            if (!this) {
                throw new TypeError('"this" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = +Number(arguments[1]) || 0;
            if (Math.abs(n) === Infinity) {
                n = 0;
            }
            if (n >= len) {
                return -1;
            }
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                if (k in o && o[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }

    if (!Array.prototype.lastIndexOf) {
        Array.prototype.lastIndexOf = function(searchElement /*, fromIndex */) {
            if (!this) {
                throw new TypeError('"this" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = +Number(arguments[1]) || 0;
            if (Math.abs(n) === Infinity) {
                n = 0;
            }
            for (var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

    if (!Array.prototype.filter) {
        Array.prototype.filter = function(fun /*, thisp */) {
            if (!this) {
                throw new TypeError("this is null or not defined");
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function") {
                throw new TypeError(fun + " is not a function");
            }
            var res = [];
            var thisp = arguments[1];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (fun.call(thisp, val, i, t)) {
                        res.push(val);
                    }
                }
            }
            return res;
        };
    }
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(fun /*, thisp */) {
            if (!this) {
                throw new TypeError("this is null or not defined");
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function") {
                throw new TypeError(fun + " is not a function");
            }
            var thisp = arguments[1];
            for (var i = 0; i <len; i++) {
                if (i in t) {
                    fun.call(thisp, t[i], i, t);
                }
            }
        };
    }
    if (!Array.prototype.every) {
        Array.prototype.every = function(fun /*, thisp */) {
            if (!this) {
                throw new TypeError("this is null or not defined");
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function") {
                throw new TypeError(fun + " is not a function");
            }
            var thisp = arguments[1];
            for (var i = 0; i < len; i++) {
                if (i in t && !fun.call(thisp, t[i], i, t)) {
                    return false;
                }
            }
            return true;
        };
    }
    if (!Array.prototype.map) {
        Array.prototype.map = function(fun /*, thisp */) {
            if (!this) {
                throw new TypeError("this is null or not defined");
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function") {
                throw new TypeError(fun + " is not a function");
            }
            var thisp = arguments[1];
            var res = new Array(len);
            for (var i = 0; i <len; i++) {
                if (i in t) {
                    res[i] = fun.call(thisp, t[i], i, t);
                }
            }
            return res;
        };
    }
    if (!Array.prototype.some) {
        Array.prototype.some = function(fun /*, thisp */) {
            if (!this) {
                throw new TypeError("this is null or not defined");
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function") {
                throw new TypeError(fun + " is not a function");
            }
            var thisp = arguments[1];
            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(thisp, t[i], i, t)) {
                    return true;
                }
            }
            return false;
        };
    }
    if (!Array.prototype.reduce) {
        Array.prototype.reduce = function(callbackfn /*, initialValue */) {
            if (!this) {
                throw new TypeError("this is null or not defined");
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof callbackfn !== "function") {
                throw new TypeError("First argument is not callable");
            }
            if (len === 0 && arguments.length === 1) {
                // == on purpose to test 0 and false.
                throw new TypeError("Array length is 0 and no second argument");
            }
            var i = 0, accumulator;
            if (arguments.length >= 2) {
                accumulator = arguments[1];
            }
            else {
                accumulator = t[0]; // Increase i to start searching the secondly defined element in the array
                i = 1; // start accumulating at the second element
            }

            for (; i < len; ++i) {
                if (i in t) {
                    accumulator = callbackfn.call(undefined, accumulator, t[i], i, t);
                }
            }
            return accumulator;
        };
    }
    if (!Array.prototype.reduceRight) {
        Array.prototype.reduceRight = function(callbackfn /*, initialValue */) {
            if (!this) {
                throw new TypeError("this is null or not defined");
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof callbackfn !== "function") {
                throw new TypeError("First argument is not callable");
            }
            // no value to return if no initial value, empty array
            if (len === 0 && arguments.length === 1) {
                throw new TypeError("Array length is 0 and no second argument");
            }
            var k = len - 1;
            var accumulator;
            if (arguments.length >= 2) {
                accumulator = arguments[1];
            }
            else {
                do {
                    if (k in t) {
                        accumulator = t[k--];
                        break;
                    }
                    // if array contains no values, no initial value to return
                    if (--k < 0) {
                        throw new TypeError("Array contains no values");
                    }
                } while (true);
            }
            while (k >= 0) {
                if (k in t) {
                    accumulator = callbackfn.call(undefined, accumulator, t[k], k, t);
                }
                k--;
            }
            return accumulator;
        };
    }
    /* String */
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position){
          position = position || 0;
          return this.substr(position, searchString.length) === searchString;
      };
    }
    if (!String.prototype.endsWith) {
      String.prototype.endsWith = function(searchString, position) {
          var subjectString = this.toString();
          if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
          }
          position -= searchString.length;
          var lastIndex = subjectString.indexOf(searchString, position);
          return lastIndex !== -1 && lastIndex === position;
      };
    }
    if (!String.prototype.includes) {
        String.prototype.includes = function() {
            if (typeof arguments[1] === "number") {
                if (this.length < arguments[0].length + arguments[1].length) {
                    return false;
                }
                else {
                    return this.substr(arguments[1], arguments[0].length) === arguments[0];
                }
            }
            else {
                return String.prototype.indexOf.apply(this, arguments) !== -1;
            }
        };
    }
    if (!String.prototype.repeat) {
        String.prototype.repeat = function(count) {
            var str = this.toString();
            count = +count;
            if (count !== count) {
                count = 0;
            }
            if (count < 0) {
                throw new RangeError('repeat count must be non-negative');
            }
            if (count === Infinity) {
                throw new RangeError('repeat count must be less than infinity');
            }
            count = Math.floor(count);
            if (str.length === 0 || count === 0) {
                return '';
            }
            // Ensuring count is a 31-bit integer allows us to heavily optimize the
            // main part. But anyway, most current (August 2014) browsers can't handle
            // strings 1 << 28 chars or longer, so:
            if (str.length * count >= 1 << 28) {
              throw new RangeError('repeat count must not overflow maximum string size');
            }
            var rpt = '';
            for (;;) {
                if ((count & 1) === 1) {
                    rpt += str;
                }
                count >>>= 1;
                if (count === 0) {
                    break;
                }
                str += str;
            }
            // Could we try:
            // return Array(count + 1).join(this);
            return rpt;
        };
    }
    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
        };
    }
    if (!String.prototype.trimLeft) {
        String.prototype.trimLeft = function() {
            return this.toString().replace(/^[\s\xa0]+/, '');
        };
    }
    if (!String.prototype.trimRight) {
        String.prototype.trimRight = function() {
            return this.toString().replace(/[\s\xa0]+$/, '');
        };
    }
    /* Object */
    if (!Object.keys) {
        Object.keys = (function () {
            var hasOwnProperty = Object.prototype.hasOwnProperty,
                hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
                dontEnums = [
                    'toString',
                    'toLocaleString',
                    'valueOf',
                    'hasOwnProperty',
                    'isPrototypeOf',
                    'propertyIsEnumerable',
                    'constructor'
                ],
                dontEnumsLength = dontEnums.length;
            return function (obj) {
                if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) {
                    throw new TypeError('Object.keys called on non-object');
                }
                var result = [];
                for (var prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }
                if (hasDontEnumBug) {
                    for (var i=0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        })();
    }
    /* Date */
    if (!Date.now) {
        Date.now = function () {
            return +(new Date());
        };
    }
    if (!Date.prototype.toISOString) {
        var f = function(n) {
            return n < 10 ? '0' + n : n;
        };
        Date.prototype.toISOString = function () {
            return this.getUTCFullYear()     + '-' +
                   f(this.getUTCMonth() + 1) + '-' +
                   f(this.getUTCDate())      + 'T' +
                   f(this.getUTCHours())     + ':' +
                   f(this.getUTCMinutes())   + ':' +
                   f(this.getUTCSeconds())   + 'Z';
        };
    }
    /* Generic methods */
    var generic = global.hprose.generic;

    function genericMethods(obj, properties) {
        var proto = obj.prototype;
        for (var i = 0, len = properties.length; i < len; i++) {
            var property = properties[i];
            var method = proto[property];
            if (typeof method === 'function' && typeof obj[property] === 'undefined') {
                obj[property] = generic(method);
            }
        }
    }
    genericMethods(Array, [
        "pop",
        "push",
        "reverse",
        "shift",
        "sort",
        "splice",
        "unshift",
        "concat",
        "join",
        "slice",
        "indexOf",
        "lastIndexOf",
        "filter",
        "forEach",
        "every",
        "map",
        "some",
        "reduce",
        "reduceRight"
    ]);
    genericMethods(String, [
        'quote',
        'substring',
        'toLowerCase',
        'toUpperCase',
        'charAt',
        'charCodeAt',
        'indexOf',
        'lastIndexOf',
        'include',
        'startsWith',
        'endsWith',
        'repeat',
        'trim',
        'trimLeft',
        'trimRight',
        'toLocaleLowerCase',
        'toLocaleUpperCase',
        'match',
        'search',
        'replace',
        'split',
        'substr',
        'concat',
        'slice'
    ]);
})(this);
