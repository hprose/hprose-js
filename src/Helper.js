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
 * LastModified: Feb 29, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    function propertyToMethod(prop) {
        if ('get' in prop && 'set' in prop) {
            return function() {
                if (arguments.length === 0) {
                    return prop.get();
                }
                prop.set(arguments[0]);
            };
        }
        if ('get' in prop) {
            return prop.get;
        }
        if ('set' in prop) {
            return prop.set;
        }
    }

    var defineProperties = (typeof Object.defineProperties !== 'function' ?
        function(obj, properties) {
            var buildinMethod = ['toString',
                                 'toLocaleString',
                                 'valueOf',
                                 'hasOwnProperty',
                                 'isPrototypeOf',
                                 'propertyIsEnumerable',
                                 'constructor'];
            buildinMethod.forEach(function(name) {
                var prop = properties[name];
                if ('value' in prop) {
                    obj[name] = prop.value;
                }
            });
            for (var name in properties) {
                var prop = properties[name];
                obj[name] = undefined;
                if ('value' in prop) {
                    obj[name] = prop.value;
                }
                else if ('get' in prop || 'set' in prop) {
                    obj[name] = propertyToMethod(prop);
                }
            }
        }
        :
        function(obj, properties) {
            for (var name in properties) {
                var prop = properties[name];
                if ('get' in prop || 'set' in prop) {
                    properties[name] = { value: propertyToMethod(prop) };
                }
            }
            Object.defineProperties(obj, properties);
        }
    );

    var Temp = function() {};

    var createObject = (typeof Object.create !== 'function' ?
        function(prototype, properties) {
            if (typeof prototype != 'object' &&
                typeof prototype != 'function') {
              throw TypeError('prototype must be an object or function');
            }
            Temp.prototype = prototype;
            var result = new Temp();
            Temp.prototype = null;
            if (properties) {
                defineProperties(result, properties);
            }
            return result;
        }
        :
        function(prototype, properties) {
            if (properties) {
                for (var name in properties) {
                    var prop = properties[name];
                    if ('get' in prop || 'set' in prop) {
                        properties[name] = { value: propertyToMethod(prop) };
                    }
                }
                return Object.create(prototype, properties);
            }
            return Object.create(prototype);
        }
    );

    function generic(method) {
        if (typeof method !== "function") {
            throw new TypeError(method + " is not a function");
        }
        return function(context) {
            return method.apply(context, Array.prototype.slice.call(arguments, 1));
        };
    }

    var arrayLikeObjectArgumentsEnabled = true;

    try {
        String.fromCharCode.apply(String, new Uint8Array([1]));
    }
    catch (e) {
        arrayLikeObjectArgumentsEnabled = false;
    }

    function _toBinaryString(charCodes, subarray) {
        var n = charCodes.length;
        if (n < 100000) {
            return String.fromCharCode.apply(String, charCodes);
        }
        var remain = n & 0xFFFF;
        var count = n >> 16;
        var a = new Array(remain ? count + 1 : count);
        for (var i = 0; i < count; ++i) {
            a[i] = String.fromCharCode.apply(String, charCodes[subarray](i << 16, (i + 1) << 16));
        }
        if (remain) {
            a[count] = String.fromCharCode.apply(String, charCodes[subarray](count << 16, n));
        }
        return a.join('');
    }

    var toBinaryString = (arrayLikeObjectArgumentsEnabled ?
        function(charCodes) {
            if (charCodes instanceof ArrayBuffer) {
                charCodes = new Uint8Array(charCodes);
            }
            return _toBinaryString(charCodes, 'subarray');
        }
        :
        function(bytes) {
            if (bytes instanceof ArrayBuffer) {
                bytes = new Uint8Array(bytes);
            }
            var n = bytes.length;
            var charCodes = new Array(n);
            for (var i = 0; i < n; ++i) {
                charCodes[i] = bytes[i];
            }
            return _toBinaryString(charCodes, 'slice');
        }
    );

    var toUint8Array = function(bs) {
        var n = bs.length;
        var data = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            data[i] = bs.charCodeAt(i) & 0xFF;
        }
        return data;
    };

    global.hprose.defineProperties = defineProperties;
    global.hprose.createObject = createObject;
    global.hprose.generic = generic;
    global.hprose.toBinaryString = toBinaryString;
    global.hprose.toUint8Array = toUint8Array;

})(this);
