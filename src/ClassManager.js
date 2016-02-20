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
 * ClassManager.js                                        *
 *                                                        *
 * hprose ClassManager for JavaScript.                    *
 *                                                        *
 * LastModified: Jul 15, 2015                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/* jshint -W067 */
(function (global) {
    'use strict';

    var WeakMap = global.WeakMap;
    var createObject = global.hprose.createObject;

    var classCache = createObject(null);
    var aliasCache = new WeakMap();

    function register(cls, alias) {
        aliasCache.set(cls, alias);
        classCache[alias] = cls;
    }

    function getClassAlias(cls) {
        return aliasCache.get(cls);
    }

    function getClass(alias) {
        return classCache[alias];
    }

    global.HproseClassManager  =
    global.hprose.ClassManager = createObject(null, {
        register: { value: register },
        getClassAlias: { value: getClassAlias },
        getClass: { value: getClass }
    });

    global.hprose.register = register;

    register(Object, 'Object');

}(function() {
    return this || (1, eval)('this');
}()));
