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
 * Helper.js                                              *
 *                                                        *
 * hprose helper for JavaScript.                          *
 *                                                        *
 * LastModified: Sep 29, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var propertyToMethod = function(prop) {
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
              throw new TypeError('prototype must be an object or function');
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

    var generic = function(method) {
        if (typeof method !== "function") {
            throw new TypeError(method + " is not a function");
        }
        return function(context) {
            return method.apply(context, Array.prototype.slice.call(arguments, 1));
        };
    }

    var toArray = function(arrayLikeObject) {
        var n = arrayLikeObject.length;
        var a = new Array(n);
        for (var i = 0; i < n; ++i) {
            a[i] = arrayLikeObject[i];
        }
        return a;
    };

    var toBinaryString = function(bytes) {
        if (bytes instanceof ArrayBuffer) {
            bytes = new Uint8Array(bytes);
        }
        var n = bytes.length;
        if (n < 0xFFFF) {
            return String.fromCharCode.apply(String, toArray(bytes));
        }
        var remain = n & 0x7FFF;
        var count = n >> 15;
        var a = new Array(remain ? count + 1 : count);
        for (var i = 0; i < count; ++i) {
            a[i] = String.fromCharCode.apply(String, toArray(bytes.subarray(i << 15, (i + 1) << 15)));
        }
        if (remain) {
            a[count] = String.fromCharCode.apply(String, toArray(bytes.subarray(count << 15, n)));
        }
        return a.join('');
    };

    var toUint8Array = function(bs) {
        var n = bs.length;
        var data = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            data[i] = bs.charCodeAt(i) & 0xFF;
        }
        return data;
    };

    var parseuri = function(url) {
        var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
        var matches =  url.match(pattern);
        var host = matches[4].split(':', 2);
        return {
            protocol: matches[1],
            host: matches[4],
            hostname: host[0],
            port: parseInt(host[1], 10) || 0,
            path: matches[5],
            query: matches[7],
            fragment: matches[9]
        };
    }

    global.hprose.defineProperties = defineProperties;
    global.hprose.createObject = createObject;
    global.hprose.generic = generic;
    global.hprose.toBinaryString = toBinaryString;
    global.hprose.toUint8Array = toUint8Array;
    global.hprose.toArray = toArray;
    global.hprose.parseuri = parseuri;

})(this || [eval][0]('this'));
