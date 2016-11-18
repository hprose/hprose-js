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
 * BinaryString.js                                        *
 *                                                        *
 * hprose BinaryString for JavaScript.                    *
 *                                                        *
 * LastModified: Nov 18, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (hprose) {
    'use strict';

    var defineProperties = hprose.defineProperties;
    var createObject = hprose.createObject;

    function BinaryString(bs, needtest) {
        if (!needtest || /^[\x00-\xff]*$/.test(bs)) {
            defineProperties(this, {
                length: { value: bs.length },
                toString: { value: function() { return bs; } },
                valueOf: {
                    value: function() { return bs; },
                    writable: true,
                    configurable: true,
                    enumerable: false
                }
            });
        }
        else {
            throw new Error("argument is not a binary string.");
        }
    }

    var methods = {};

    ['quote', 'substring', 'toLowerCase', 'toUpperCase',
     'charAt', 'charCodeAt', 'indexOf', 'lastIndexOf',
     'include', 'startsWith', 'endsWith', 'repeat',
     'trim', 'trimLeft', 'trimRight',
     'toLocaleLowerCase', 'toLocaleUpperCase',
     'match', 'search', 'replace', 'split',
     'substr', 'concat', 'slice'].forEach(function(name) {
         methods[name] = { value: String.prototype[name] };
    });

    BinaryString.prototype = createObject(null, methods);
    BinaryString.prototype.constructor = BinaryString;

    hprose.BinaryString = BinaryString;
    hprose.binary = function(bs) { return new BinaryString(bs, true); };

})(hprose);
