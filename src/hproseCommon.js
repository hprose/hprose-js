/**********************************************************\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: http://www.hprose.com/                 |
|                   http://www.hprose.net/                 |
|                   http://www.hprose.org/                 |
|                                                          |
\**********************************************************/

/**********************************************************\
 *                                                        *
 * hproseCommon.js                                        *
 *                                                        *
 * hprose common library for JavaScript.                  *
 *                                                        *
 * LastModified: Feb 16, 2014                             *
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
    this.inputFilter = function (value) { return value; };
    this.outputFilter = function (value) { return value; };
}

if (!('isArray' in Array)) {
    Array.isArray = function (arg) {
        'use strict';
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

(function (global) {
    'use strict';
    var hasMap = 'Map' in global;
    var hasWeakMap = 'WeakMap' in global;
    if (hasMap && hasWeakMap) return;
    var hasObject_create = 'create' in Object;
    var hasObject_freeze = 'freeze' in Object;
    var createNPO = function () {
        return hasObject_create ? Object.create(null) : {};
    };
    var namespaces = createNPO();
    var count = 0;
    var reDefineValueOf = function (obj) {
        var privates = createNPO();
        var baseValueOf = obj.valueOf;
        obj.valueOf = function (namespace, n) {
            if ((this === obj) &&
                (n in namespaces) &&
                (namespaces[n] === namespace)) {
                if (!(n in privates)) privates[n] = createNPO();
                return privates[n];
            }
            else {
                baseValueOf.apply(this, arguments);
            }
        };
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
            if (hasObject_freeze) {
                return Object.freeze(Object.create(WeakMap.prototype, {
                    get: {
                        value: function (key) { return map(key).value; },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    set: {
                        value: function (key, value) { map(key).value = value; },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    has: {
                        value: function (key) { return 'value' in map(key); },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    'delete': {
                        value: function (key) { return delete map(key).value; },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    clear: {
                        value: function () {
                            delete namespaces[n];
                            n = count++;
                            namespaces[n] = namespace;
                        },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    }
                }));
            }
            else {
                this.get = function (key) { return map(key).value; };
                this.set = function (key, value) { map(key).value = value; };
                this.has = function (key) { return 'value' in map(key); };
                this['delete'] = function (key) { return delete map(key).value; };
                this.clear = function () {
                    delete namespaces[n];
                    n = count++;
                    namespaces[n] = namespace;
                };
            }
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
        var noKeyMap = function () {
            var map = createNPO();
            return {
                get: function (key) { return map.value; },
                set: function (key, value) { map.value = value; },
                has: function (key) { return 'value' in map; },
                'delete': function (key) { return delete map.value; },
                clear: function () { map = createNPO(); }
            };
        };
        global.Map = function Map() {
            var map = {
                'number': scalarMap(),
                'string': hasObject_create ? scalarMap() : stringMap(),
                'boolean': scalarMap(),
                'object': objectMap(),
                'function': objectMap(),
                'unknown': objectMap(),
                'undefined': noKeyMap(),
                'null': noKeyMap()
            };
            var size = 0;
            if (hasObject_freeze) {
                return Object.freeze(Object.create(Map.prototype, {
                    size: {
                        get : function () { return size; },
                        configurable: true,
                        enumerable: false
                    },
                    get: {
                        value: function (key) {
                            return map[typeof(key)].get(key);
                        },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    set: {
                        value: function (key, value) {
                            if (!this.has(key)) size++;
                            map[typeof(key)].set(key, value);
                        },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    has: {
                        value: function (key) {
                            return map[typeof(key)].has(key);
                        },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    'delete': {
                        value: function (key) {
                            if (this.has(key)) {
                                size--;
                                return map[typeof(key)]['delete'](key);
                            }
                            return false;
                        },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    },
                    clear: {
                        value: function () {
                            for (var key in map) map[key].clear();
                            size = 0;
                        },
                        writable: true,
                        configurable: true,
                        enumerable: false
                    }
                }));
            }
            else {
                this.size = size;
                this.get = function (key) {
                    return map[typeof(key)].get(key);
                };
                this.set = function (key, value) {
                    if (!this.has(key)) this.size = ++size;
                    map[typeof(key)].set(key, value);
                };
                this.has = function (key) {
                    return map[typeof(key)].has(key);
                };
                this['delete'] = function (key) {
                    if (this.has(key)) {
                        this.size = --size;
                        return map[typeof(key)]['delete'](key);
                    }
                    return false;
                };
                this.clear = function () {
                    for (var key in map) map[key].clear();
                    this.size = size = 0;
                };
            }
        };
    }
})(this);
