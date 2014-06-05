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
 * hproseSerializeTest.js                                 *
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
    console.assert(serialize(0) === '0', 'serialize(0): ' + serialize(0));
    console.assert(serialize(-0) === 'i-0;', 'serialize(-0): ' + serialize(-0));
    console.assert(serialize(1) === '1', 'serialize(1): ' + serialize(1));
    console.assert(serialize(-1) === 'i-1;', 'serialize(-1): ' + serialize(-1));
    console.assert(serialize(-2147483648) === 'i-2147483648;', 'serialize(-2147483648): ' + serialize(-2147483648));
    console.assert(serialize(2147483647) === 'i2147483647;', 'serialize(2147483647): ' + serialize(2147483647));
    console.assert(serialize(2147483648) === 'd2147483648;', 'serialize(2147483648): ' + serialize(2147483648));
    console.assert(serialize(0.1) === 'd0.1;', 'serialize(0.1): ' + serialize(0.1));
    console.assert(serialize(1e13) === 'd10000000000000;', 'serialize(1e13): ' + serialize(1e13));
    console.assert(serialize(1e235) === 'd1e+235;', 'serialize(1e235): ' + serialize(1e235));
    console.assert(serialize(1e-235) === 'd1e-235;', 'serialize(1e-235): ' + serialize(1e-235));
    console.assert(serialize(NaN) === 'N', 'serialize(NaN): ' + serialize(NaN));
    console.assert(serialize(Infinity) === 'I+', 'serialize(Infinity): ' + serialize(Infinity));
    console.assert(serialize(-Infinity) === 'I-', 'serialize(-Infinity): ' + serialize(-Infinity));
    console.assert(serialize(true) === 't', 'serialize(true): ' + serialize(true));
    console.assert(serialize(false) === 'f', 'serialize(false): ' + serialize(false));
    console.assert(serialize(undefined) === 'n', 'serialize(undefined): ' + serialize(undefined));
    console.assert(serialize(null) === 'n', 'serialize(null): ' + serialize(null));
    console.assert(serialize(function(){}) === 'n', 'serialize(function(){}): ' + serialize(function(){}));
    console.assert(serialize('') === 'e', 'serialize(""): ' + serialize(''));
    console.assert(serialize('我') === 'u我', 'serialize("我"): ' + serialize('我'));
    console.assert(serialize('#') === 'u#', 'serialize("#"): ' + serialize('#'));
    console.assert(serialize('Hello') === 's5"Hello"', 'serialize("Hello"): ' + serialize('Hello'));
    console.assert(serialize('我爱你') === 's3"我爱你"', 'serialize("我爱你"): ' + serialize('我爱你'));
    console.assert(serialize([]) === 'a{}', 'serialize([]): ' + serialize([]));
    console.assert(serialize([1,2,3,4,5]) === 'a5{12345}', 'serialize([1,2,3,4,5]): ' + serialize([1,2,3,4,5]));
    console.assert(serialize(['Tom', 'Jerry']) === 'a2{s3"Tom"s5"Jerry"}', 'serialize(["Tom", "Jerry"]): ' + serialize(['Tom', 'Jerry']));
    console.assert(serialize(['Tom', 'Tom']) === 'a2{s3"Tom"r1;}', 'serialize(["Tom", "Tom"]): ' + serialize(['Tom', 'Tom']));
    var a = [];
    a[0] = a;
    console.assert(serialize(a) === 'a1{r0;}', 'serialize(a): ' + serialize(a));
    var m = {};
    m.self = m;
    console.assert(serialize(m) === 'm1{s4"self"r0;}', 'serialize(m): ' + serialize(m));
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
    console.assert(serialize(user) === 'c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}', 'serialize(user): ' + serialize(user));
    var map = new Map();
    map.set(map, map);
    map.set(0, '+0');
    map.set(-0, '-0');
    console.assert(serialize(map) === 'm3{r0;r0;0s2"+0"i-0;s2"-0"}', 'serialize(map): ' + serialize(map));
})();