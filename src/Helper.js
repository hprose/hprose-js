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

    function setterName(name) {
        if ((name.length > 2) && (name.substr(0, 2) === "is")) {
            return 'set' + name.substr(2);
        }
        return 'set' + name.charAt(0).toUpperCase() + name.substr(1);
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
                else {
                    if ('get' in prop) {
                        obj[name] = prop.get;
                    }
                    if ('set' in prop) {
                        obj[setterName(name)] = prop.set;
                    }
                }
            }
        }
        :
        function(obj, properties) {
            for (var name in properties) {
                var prop = properties[name];
                if ('get' in prop) {
                    properties[name] = { value: prop.get };
                }
                if ('set' in prop) {
                    properties[setterName(name)] = { value: prop.set };
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
                    if ('get' in prop) {
                        properties[name] = { value: prop.get };
                    }
                    if ('set' in prop) {
                        properties[setterName(name)] = { value: prop.set };
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

    global.hprose.defineProperties = defineProperties;
    global.hprose.createObject = createObject;
    global.hprose.generic = generic;

})(this);
