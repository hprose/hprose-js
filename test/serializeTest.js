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
 * serializeTest.js                                       *
 *                                                        *
 * hprose serialize test for JavaScript.                  *
 *                                                        *
 * LastModified: Feb 25, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global hprose */
/*jshint eqeqeq:true, devel:true */

describe('hprose', function(){
    describe('#serialize()', function(){
        var BinaryString = hprose.BinaryString;
        var serialize = hprose.Formatter.serialize;
        it('serialize(0) should return 0', function(){
            var result = serialize(0);
            assert(result === '0', 'serialize(0): ' + result);
        });
        it('serialize(-0) should return 0', function(){
            var result = serialize(-0);
            assert(result === '0', 'serialize(-0): ' + result);
        });
        it('serialize(1) should return 1', function(){
            var result = serialize(1);
            assert(result === '1', 'serialize(1): ' + result);
        });
        it('serialize(-1) should return i-1;', function(){
            var result = serialize(-1);
            assert(result === 'i-1;', 'serialize(-1): ' + result);
        });
        it('serialize(-2147483648) should return i-2147483648;', function(){
            var result = serialize(-2147483648);
            assert(result === 'i-2147483648;', 'serialize(-2147483648): ' + result);
        });
        it('serialize(2147483647) should return i2147483647;', function(){
            var result = serialize(2147483647);
            assert(result === 'i2147483647;', 'serialize(2147483647): ' + result);
        });
        it('serialize(2147483648) should return d2147483648;', function(){
            var result = serialize(2147483648);
            assert(result === 'd2147483648;', 'serialize(2147483648): ' + result);
        });
        it('serialize(0.1) should return d0.1;', function(){
            var result = serialize(0.1);
            assert(result === 'd0.1;', 'serialize(0.1): ' + result);
        });
        it('serialize(1e13) should return d10000000000000;', function(){
            var result = serialize(1e13);
            assert(result === 'd10000000000000;', 'serialize(1e13): ' + result);
        });
        it('serialize(1e235) should return d1e+235;', function(){
            var result = serialize(1e235);
            assert(result === 'd1e+235;', 'serialize(1e235): ' + result);
        });
        it('serialize(1e-235) should return d1e-235;', function(){
            var result = serialize(1e-235);
            assert(result === 'd1e-235;', 'serialize(1e-235): ' + result);
        });
        it('serialize(NaN) should return N', function(){
            var result = serialize(NaN);
            assert(result === 'N', 'serialize(NaN): ' + result);
        });
        it('serialize(Infinity) should return I+', function(){
            var result = serialize(Infinity);
            assert(result === 'I+', 'serialize(Infinity): ' + result);
        });
        it('serialize(-Infinity) should return I-', function(){
            var result = serialize(-Infinity);
            assert(result === 'I-', 'serialize(-Infinity): ' + result);
        });
        it('serialize(true) should return t', function(){
            var result = serialize(true);
            assert(result === 't', 'serialize(true): ' + result);
        });
        it('serialize(false) should return f', function(){
            var result = serialize(false);
            assert(result === 'f', 'serialize(false): ' + result);
        });
        it('serialize(undefined) should return n', function(){
            var result = serialize(undefined);
            assert(result === 'n', 'serialize(undefined): ' + result);
        });
        it('serialize(null) should return n', function(){
            var result = serialize(null);
            assert(result === 'n', 'serialize(null): ' + result);
        });
        it('serialize(function(){}) should return n', function(){
            var result = serialize(function(){});
            assert(result === 'n', 'serialize(function(){}): ' + result);
        });
        it('serialize("") should return e', function(){
            var result = serialize("");
            assert(result === 'e', 'serialize(""): ' + result);
        });
        it('serialize("我") should return u我', function(){
            var result = serialize("我");
            assert(result === 'u我', 'serialize("我"): ' + result);
        });
        it('serialize("我", true, true) should return u\\xE6\\x88\\x91', function(){
            var result = serialize("我", true, true);
            assert(result === 'u\xE6\x88\x91', 'serialize("我", true, true): ' + result);
        });
        it('serialize("#") should return u#', function(){
            var result = serialize("#");
            assert(result === 'u#', 'serialize("#"): ' + result);
        });
        it('serialize("Hello") should return s5"Hello"', function(){
            var result = serialize("Hello");
            assert(result === 's5"Hello"', 'serialize("Hello"): ' + result);
        });
        it('serialize(new BinaryString("Hello"), true, true) should return b5"Hello"', function(){
            var result = serialize(new BinaryString("Hello"), true, true);
            assert(result === 'b5"Hello"', 'serialize(new BinaryString("Hello"), true, true): ' + result);
        });
        it('serialize("我爱你") should return s3"我爱你"', function(){
            var result = serialize("我爱你");
            assert(result === 's3"我爱你"', 'serialize("我爱你"): ' + result);
        });
        it('serialize("你好", true, true) should return s2"\\xE4\\xBD\\xA0\\xE5\\xA5\\xBD"', function(){
            var result = serialize("你好", true, true);
            assert(result === 's2"\xE4\xBD\xA0\xE5\xA5\xBD"', 'serialize("你好", true, true): ' + result);
        });
        it('serialize([]) should return a{}', function(){
            var result = serialize([]);
            assert(result === 'a{}', 'serialize([]): ' + result);
        });
        it('serialize([1,2,3,4,5]) should return a5{12345}', function(){
            var result = serialize([1,2,3,4,5]);
            assert(result === 'a5{12345}', 'serialize([1,2,3,4,5]): ' + result);
        });
        it('serialize(["Tom", "Jerry"]) should return a2{s3"Tom"s5"Jerry"}', function(){
            var result = serialize(["Tom", "Jerry"]);
            assert(result === 'a2{s3"Tom"s5"Jerry"}', 'serialize(["Tom", "Jerry"]): ' + result);
        });
        it('serialize(["Tom", "Tom"]) should return a2{s3"Tom"r1;}', function(){
            var result = serialize(["Tom", "Tom"]);
            assert(result === 'a2{s3"Tom"r1;}', 'serialize(["Tom", "Tom"]): ' + result);
        });
        it('serialize(a) should return a1{r0;}', function(){
            var a = [];
            a[0] = a;
            var result = serialize(a);
            assert(result === 'a1{r0;}', 'serialize(a): ' + result);
        });
        it('serialize(m) should return m1{s4"self"r0;}', function(){
            var m = {};
            m.self = m;
            var result = serialize(m);
            assert(result === 'm1{s4"self"r0;}', 'serialize(m): ' + result);
        });
        it('serialize(map) should return m3{r0;r0;s3"age"i12;s4"name"s5"Jason"}', function(){
            var map = new Map();
            map.set(map, map);
            map.set("age", 12);
            map.set("name", 'Jason');
            var result = serialize(map);
            assert(result === 'm3{r0;r0;s3"age"i12;s4"name"s5"Jason"}', 'serialize(map): ' + result);
        });
        it('serialize(user) should return c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}', function(){
            function User() {}
            hprose.ClassManager.register(User, 'User');
            var user = new User();
            user.name = '张三';
            user.age = 28;
            user.self = user;
            var result = serialize(user);
            assert(result === 'c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}', 'serialize(user): ' + result);
        });
    });
});
