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
 * hproseCommon.js                                        *
 *                                                        *
 * hprose common library for JavaScript.                  *
 *                                                        *
 * LastModified: Jun 26, 2014                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*jshint es3:true, unused:false, eqeqeq:true */
var HproseResultMode = {
    Normal: 0,
    Serialized: 1,
    Raw: 2,
    RawWithEndTag: 3
};

function HproseException(message) {
    'use strict';
    this.message = message;
}

HproseException.prototype = new Error();
HproseException.prototype.name = 'HproseException';

function HproseFilter() {
    'use strict';
    this.inputFilter = function (value, context) { return value; };
    this.outputFilter = function (value, context) { return value; };
}

if (!('isArray' in Array)) {
    Array.isArray = function (arg) {
        'use strict';
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        'use strict';
        if (this === undefined || this === null) {
            throw new TypeError('this is null or not defined');
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            }
            else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

(function (global) {
    'use strict';
    var hasWeakMap = 'WeakMap' in global;
    var hasMap = 'Map' in global;
    var hasForEach = true;

    if (hasMap) {
        hasForEach = 'forEach' in new global.Map();
    }

    if (hasWeakMap && hasMap && hasForEach) return;

    var hasObject_create = 'create' in Object;
    var createNPO = function () {
        return hasObject_create ? Object.create(null) : {};
    };

    var namespaces = createNPO();
    var count = 0;
    var reDefineValueOf = function (obj) {
        var privates = createNPO();
        var baseValueOf = obj.valueOf;
        if (hasObject_create) {
            Object.defineProperty(obj, 'valueOf', {
                value: function (namespace, n) {
                        if ((this === obj) &&
                            (n in namespaces) &&
                            (namespaces[n] === namespace)) {
                            if (!(n in privates)) privates[n] = createNPO();
                            return privates[n];
                        }
                        else {
                            return baseValueOf.apply(this, arguments);
                        }
                    },
                writable: true,
                configurable: true,
                enumerable: false
            });
        }
        else {
            obj.valueOf = function (namespace, n) {
                if ((this === obj) &&
                    (n in namespaces) &&
                    (namespaces[n] === namespace)) {
                    if (!(n in privates)) privates[n] = createNPO();
                    return privates[n];
                }
                else {
                    return baseValueOf.apply(this, arguments);
                }
            };
        }
    };

    if (!hasWeakMap) {
        global.WeakMap = function WeakMap() {
            var namespace = createNPO();
            var n = count++;
            namespaces[n] = namespace;
            var map = function (key) {
                if (key !== Object(key)) throw new Error('value is not a non-null object');
                var privates = key.valueOf(namespace, n);
                if (privates !== key.valueOf()) return privates;
                reDefineValueOf(key);
                return key.valueOf(namespace, n);
            };
            var m = (hasObject_create ?
                Object.create(WeakMap.prototype, {
                    get: {
                        value: function (key) { return map(key).value; },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    set: {
                        value: function (key, value) { map(key).value = value; },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    has: {
                        value: function (key) { return 'value' in map(key); },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    'delete': {
                        value: function (key) { return delete map(key).value; },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    clear: {
                        value: function () {
                            delete namespaces[n];
                            n = count++;
                            namespaces[n] = namespace;
                        },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    }
                }) :
                {
                    get : function (key) { return map(key).value; },
                    set : function (key, value) { map(key).value = value; },
                    has : function (key) { return 'value' in map(key); },
                    'delete' : function (key) { return delete map(key).value; },
                    clear : function () {
                        delete namespaces[n];
                        n = count++;
                        namespaces[n] = namespace;
                    }
                }
            );
            if (arguments.length > 0 && Array.isArray(arguments[0])) {
                var iterable = arguments[0];
                for (var i = 0, len = iterable.length; i < len; i++) {
                    m.set(iterable[i][0], iterable[i][1]);
                }
            }
            return m;
        };
    }

    if (!hasMap) {
        var objectMap = function () {
            var namespace = createNPO();
            var n = count++;
            var nullMap = createNPO();
            namespaces[n] = namespace;
            var map = function (key) {
                if (key === null) return nullMap;
                var privates = key.valueOf(namespace, n);
                if (privates !== key.valueOf()) return privates;
                reDefineValueOf(key);
                return key.valueOf(namespace, n);
            };
            return {
                get: function (key) { return map(key).value; },
                set: function (key, value) { map(key).value = value; },
                has: function (key) { return 'value' in map(key); },
                'delete': function (key) { return delete map(key).value; },
                clear: function () {
                    delete namespaces[n];
                    n = count++;
                    namespaces[n] = namespace;
                }
            };
        };
        var noKeyMap = function () {
            var map = createNPO();
            return {
                get: function () { return map.value; },
                set: function (_, value) { map.value = value; },
                has: function () { return 'value' in map; },
                'delete': function () { return delete map.value; },
                clear: function () { map = createNPO(); }
            };
        };
        var numberMap = function () {
            var map = createNPO();
            var isNegZero = function(value) {
                return (value === 0 && 1/value === -Infinity);
            };
            var negZeroMap = noKeyMap();
            return {
                get: function (key) { return isNegZero(key) ? negZeroMap.get() : map[key]; },
                set: function (key, value) {
                    if (isNegZero(key)) {
                        negZeroMap.set(key, value);
                    }
                    else {
                        map[key] = value;
                    }
                },
                has: function (key) { return isNegZero(key) ? negZeroMap.has() : key in map; },
                'delete': function (key) { return isNegZero(key) ? negZeroMap['delete']() : delete map[key]; },
                clear: function () { negZeroMap.clear(); map = createNPO(); }
            };
        };
        var scalarMap = function () {
            var map = createNPO();
            return {
                get: function (key) { return map[key]; },
                set: function (key, value) { map[key] = value; },
                has: function (key) { return key in map; },
                'delete': function (key) { return delete map[key]; },
                clear: function () { map = createNPO(); }
            };
        };
        if (!hasObject_create) {
            var stringMap = function () {
                var map = {};
                return {
                    get: function (key) { return map['str_' + key]; },
                    set: function (key, value) { map['str_' + key] = value; },
                    has: function (key) { return ('str_' + key) in map; },
                    'delete': function (key) { return delete map['str_' + key]; },
                    clear: function () { map = {}; }
                };
            };
        }
        global.Map = function Map() {
            var map = {
                'number': numberMap(),
                'string': hasObject_create ? scalarMap() : stringMap(),
                'boolean': scalarMap(),
                'object': objectMap(),
                'function': objectMap(),
                'unknown': objectMap(),
                'undefined': noKeyMap(),
                'null': noKeyMap()
            };
            var size = 0;
            var keys = [];
            var m = (hasObject_create ?
                Object.create(Map.prototype, {
                    size: {
                        get : function () { return size; },
                        configurable: false,
                        enumerable: false
                    },
                    get: {
                        value: function (key) {
                            return map[typeof(key)].get(key);
                        },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    set: {
                        value: function (key, value) {
                            if (!this.has(key)) {
                                keys.push(key);
                                size++;
                            }
                            map[typeof(key)].set(key, value);
                        },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    has: {
                        value: function (key) {
                            return map[typeof(key)].has(key);
                        },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    'delete': {
                        value: function (key) {
                            if (this.has(key)) {
                                size--;
                                keys.splice(keys.indexOf(key), 1);
                                return map[typeof(key)]['delete'](key);
                            }
                            return false;
                        },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    clear: {
                        value: function () {
                            keys.length = 0;
                            for (var key in map) map[key].clear();
                            size = 0;
                        },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    },
                    forEach: {
                        value: function (callback, thisArg) {
                            for (var i = 0, n = keys.length; i < n; i++) {
                                callback.call(thisArg, this.get(keys[i]), keys[i], this);
                            }
                        },
                        writable: false,
                        configurable: false,
                        enumerable: false
                    }
                }) :
                {
                    size: size,
                    get: function (key) {
                        return map[typeof(key)].get(key);
                    },
                    set: function (key, value) {
                        if (!this.has(key)) {
                            keys.push(key);
                            this.size = ++size;
                        }
                        map[typeof(key)].set(key, value);
                    },
                    has: function (key) {
                        return map[typeof(key)].has(key);
                    },
                    'delete': function (key) {
                        if (this.has(key)) {
                            this.size = --size;
                            keys.splice(keys.indexOf(key), 1);
                            return map[typeof(key)]['delete'](key);
                        }
                        return false;
                    },
                    clear: function () {
                        keys.length = 0;
                        for (var key in map) map[key].clear();
                        this.size = size = 0;
                    },
                    forEach: function (callback, thisArg) {
                        for (var i = 0, n = keys.length; i < n; i++) {
                            callback.call(thisArg, this.get(keys[i]), keys[i], this);
                        }
                    }
                }
            );
            if (arguments.length > 0 && Array.isArray(arguments[0])) {
                var iterable = arguments[0];
                for (var i = 0, len = iterable.length; i < len; i++) {
                    m.set(iterable[i][0], iterable[i][1]);
                }
            }
            return m;
        };
    }

    if (!hasForEach) {
        var OldMap = global.Map;
        global.Map = function Map() {
            var map = new OldMap();
            var size = 0;
            var keys = [];
            var m = Object.create(Map.prototype, {
                size: {
                    get : function () { return size; },
                    configurable: false,
                    enumerable: false
                },
                get: {
                    value: function (key) {
                        return map.get(key);
                    },
                    writable: false,
                    configurable: false,
                    enumerable: false
                },
                set: {
                    value: function (key, value) {
                        if (!map.has(key)) {
                            keys.push(key);
                            size++;
                        }
                        map.set(key, value);
                    },
                    writable: false,
                    configurable: false,
                    enumerable: false
                },
                has: {
                    value: function (key) {
                        return map.has(key);
                    },
                    writable: false,
                    configurable: false,
                    enumerable: false
                },
                'delete': {
                    value: function (key) {
                        if (map.has(key)) {
                            size--;
                            keys.splice(keys.indexOf(key), 1);
                            return map['delete'](key);
                        }
                        return false;
                    },
                    writable: false,
                    configurable: false,
                    enumerable: false
                },
                clear: {
                    value: function () {
                        if ('clear' in map) {
                            map.clear();
                        }
                        else {
                            for (var i = 0, n = keys.length; i < n; i++) {
                                map['delete'](keys[i]);
                            }
                        }
                        keys.length = 0;
                        size = 0;
                    },
                    writable: false,
                    configurable: false,
                    enumerable: false
                },
                forEach: {
                    value: function (callback, thisArg) {
                        for (var i = 0, n = keys.length; i < n; i++) {
                            callback.call(thisArg, this.get(keys[i]), keys[i], this);
                        }
                    },
                    writable: false,
                    configurable: false,
                    enumerable: false
                }
            });
            if (arguments.length > 0 && Array.isArray(arguments[0])) {
                var iterable = arguments[0];
                for (var i = 0, len = iterable.length; i < len; i++) {
                    m.set(iterable[i][0], iterable[i][1]);
                }
            }
            return m;
        };
    }
})(this);
