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
 * hproseUnserializeTest.js                               *
 *                                                        *
 * hprose serialize test for JavaScript.                  *
 *                                                        *
 * LastModified: Mar 25, 2014                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseFormatter, HproseClassManager */
/*jshint eqeqeq:true, devel:true */

(function() {
    'use strict';
    var serialize = HproseFormatter.serialize;
    var unserialize = HproseFormatter.unserialize;
    console.assert(unserialize(serialize(0)) === 0);
    console.assert(unserialize(serialize(-0)) === -0);
    console.assert(unserialize(serialize(1)) === 1);
    console.assert(unserialize(serialize(-1)) === -1);
    console.assert(unserialize(serialize(-2147483648)) === -2147483648);
    console.assert(unserialize(serialize(2147483647)) === 2147483647);
    console.assert(unserialize(serialize(2147483648)) === 2147483648);
    console.assert(unserialize(serialize(0.1)) === 0.1);
    console.assert(unserialize(serialize(1e13)) === 1e13);
    console.assert(unserialize(serialize(1e235)) === 1e235);
    console.assert(unserialize(serialize(1e-235)) === 1e-235);
    console.assert(isNaN(unserialize(serialize(NaN))));
    console.assert(unserialize(serialize(Infinity)) === Infinity);
    console.assert(unserialize(serialize(-Infinity)) === -Infinity);
    console.assert(unserialize(serialize(true)) === true);
    console.assert(unserialize(serialize(false)) === false);
    console.assert(unserialize(serialize(undefined)) === null);
    console.assert(unserialize(serialize(null)) === null);
    console.assert(unserialize(serialize(function(){})) === null);
    console.assert(unserialize(serialize('')) === '');
    console.assert(unserialize(serialize('我')) === '我');
    console.assert(unserialize(serialize('#')) === '#');
    console.assert(unserialize(serialize('Hello')) === 'Hello');
    console.assert(unserialize(serialize('我爱你')) === '我爱你');
    console.assert(serialize(unserialize(serialize([]))) === serialize([]));
    console.assert(serialize(unserialize(serialize([1,2,3,4,5]))) === serialize([1,2,3,4,5]));
    console.assert(serialize(unserialize(serialize(['Tom', 'Jerry']))) === serialize(['Tom', 'Jerry']));
    console.assert(serialize(unserialize(serialize(['Tom', 'Tom']))) === serialize(['Tom', 'Tom']));
    var a = [];
    a[0] = a;
    console.assert(serialize(unserialize(serialize(a))) === serialize(a));
    var m = {};
    m.self = m;
    console.assert(serialize(unserialize(serialize(m))) === serialize(m));
    function User() {
        this.name = '';
        this.age = 0;
        this.self = null;
    }
    HproseClassManager.register(User, 'User');
    var user = new User();
    user.name = '张三';
    user.age = 28;
    user.self = user;
    console.assert(serialize(unserialize(serialize(user))) === serialize(user));
})();