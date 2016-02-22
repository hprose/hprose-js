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
 * writerTest.js                                          *
 *                                                        *
 * hprose writer test for JavaScript.                     *
 *                                                        *
 * LastModified: Feb 22, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseWriter, HproseClassManager */
/*jshint eqeqeq:true, devel:true */

describe('hprose.Writer', function() {
    describe('#serialize()', function() {
        var StringIO = hprose.StringIO;
        var binary = hprose.binary;
        var Writer = hprose.Writer;
        it('serialize(0) should return `0`', function() {
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(0);
            var result = stream.toString();
            assert(result === '0', 'serialize(0): ' + result);
        });
        it('serialize(-0) should return `0`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(-0);
            var result = stream.toString();
            assert(result === '0', 'serialize(-0): ' + result);
        });
        it('serialize(1) should return `1`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(1);
            var result = stream.toString();
            assert(result === '1', 'serialize(1): ' + result);
        });
        it('serialize(-1) should return `i-1;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(-1);
            var result = stream.toString();
            assert(result === 'i-1;', 'serialize(-1): ' + result);
        });
        it('serialize(-2147483648) should return `i-2147483648;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(-2147483648);
            var result = stream.toString();
            assert(result === 'i-2147483648;', 'serialize(-2147483648): ' + result);
        });
        it('serialize(2147483647) should return `i2147483647;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(2147483647);
            var result = stream.toString();
            assert(result === 'i2147483647;', 'serialize(2147483647): ' + result);
        });
        it('serialize(2147483648) should return `d2147483648;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(2147483648);
            var result = stream.toString();
            assert(result === 'd2147483648;', 'serialize(2147483648): ' + result);
        });
        it('serialize(0.1) should return `d0.1;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(0.1);
            var result = stream.toString();
            assert(result === 'd0.1;', 'serialize(0.1): ' + result);
        });
        it('serialize(1e13) should return `d10000000000000;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(1e13);
            var result = stream.toString();
            assert(result === 'd10000000000000;', 'serialize(1e13): ' + result);
        });
        it('serialize(1e235) should return `d1e+235;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(1e235);
            var result = stream.toString();
            assert(result === 'd1e+235;', 'serialize(1e235): ' + result);
        });
        it('serialize(1e-235) should return `d1e-235;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(1e-235);
            var result = stream.toString();
            assert(result === 'd1e-235;', 'serialize(1e-235): ' + result);
        });
        it('serialize(NaN) should return `N`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(NaN);
            var result = stream.toString();
            assert(result === 'N', 'serialize(NaN): ' + result);
        });
        it('serialize(Infinity) should return `I+`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(Infinity);
            var result = stream.toString();
            assert(result === 'I+', 'serialize(Infinity): ' + result);
        });
        it('serialize(-Infinity) should return `I-`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(-Infinity);
            var result = stream.toString();
            assert(result === 'I-', 'serialize(-Infinity): ' + result);
        });
        it('serialize(true) should return `t`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(true);
            var result = stream.toString();
            assert(result === 't', 'serialize(true): ' + result);
        });
        it('serialize(false) should return `f`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(false);
            var result = stream.toString();
            assert(result === 'f', 'serialize(false): ' + result);
        });
        it('serialize(undefined) should return `n`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(undefined);
            var result = stream.toString();
            assert(result === 'n', 'serialize(undefined): ' + result);
        });
        it('serialize(null) should return `n`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(null);
            var result = stream.toString();
            assert(result === 'n', 'serialize(null): ' + result);
        });
        it('serialize(function(){}) should return `n`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(function(){});
            var result = stream.toString();
            assert(result === 'n', 'serialize(function(){}): ' + result);
        });
        it('serialize("") should return `e`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize("");
            var result = stream.toString();
            assert(result === 'e', 'serialize(""): ' + result);
        });
        it('serialize("我") in text mode should return `u我`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize("我");
            var result = stream.toString();
            assert(result === 'u我', 'serialize("我"): ' + result);
        });
        it('serialize("我") in binary mode should return `u\\xE6\\x88\\x91`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.binary = true;
            writer.serialize("我");
            var result = stream.toString();
            assert(result === 'u\xE6\x88\x91', 'serialize("我"): ' + result);
        });
        it('serialize("Hello") in text mode should return `s5"Hello"`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize("Hello");
            var result = stream.toString();
            assert(result === 's5"Hello"', 'serialize("Hello"): ' + result);
        });
        it('serialize("Hello") in binary mode should return `s5"Hello"`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.binary = true;
            writer.serialize("Hello");
            var result = stream.toString();
            assert(result === 's5"Hello"', 'serialize("Hello"): ' + result);
        });
        it('serialize(binary("Hello")) in binary mode should return `b5"Hello"`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.binary = true;
            writer.serialize(binary("Hello"));
            var result = stream.toString();
            assert(result === 'b5"Hello"', 'serialize(hello): ' + result);
        });
        it('serialize("你好") in text mode should return `s2"你好"`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize("你好");
            var result = stream.toString();
            assert(result === 's2"你好"', 'serialize("你好"): ' + result);
        });
        it('serialize("你好") in binary mode should return `s2"\\xE4\\xBD\\xA0\\xE5\\xA5\\xBD"`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.binary = true;
            writer.serialize("你好");
            var result = stream.toString();
            assert(result === 's2"\xE4\xBD\xA0\xE5\xA5\xBD"', 'serialize("你好"): ' + result);
        });
        it('serialize(new Date("December 17, 1995 03:24:00")) should return `D19951217T032400;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(new Date("December 17, 1995 03:24:00"));
            var result = stream.toString();
            assert(result === 'D19951217T032400;', 'serialize(new Date("December 17, 1995 03:24:00")): ' + result);
        });
        it('serialize(new Date(1995, 11, 17)) should return `D19951217;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(new Date(1995, 11, 17));
            var result = stream.toString();
            assert(result === 'D19951217;', 'serialize(new Date(1995, 11, 17)): ' + result);
        });
        it('serialize(new Date(1970, 0, 1, 1, 34, 54, 234)) should return `T013454.234;`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(new Date(1970, 0, 1, 1, 34, 54, 234));
            var result = stream.toString();
            assert(result === 'T013454.234;', 'serialize(new Date(1970, 0, 1, 1, 34, 54, 234)): ' + result);
        });
        it('serialize([]) should return `a{}`', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize([]);
            var result = stream.toString();
            assert(result === 'a{}', 'serialize([]): ' + result);
        });
        it('serialize([1,2,3,4,5]) should return a5{12345}', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize([1,2,3,4,5]);
            var result = stream.toString();
            assert(result === 'a5{12345}', 'serialize([1,2,3,4,5]): ' + result);
        });
        it('serialize(["Tom", "Jerry"]) should return a2{s3"Tom"s5"Jerry"}', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(["Tom", "Jerry"]);
            var result = stream.toString();
            assert(result === 'a2{s3"Tom"s5"Jerry"}', 'serialize(["Tom", "Jerry"]): ' + result);
        });
        it('serialize(["Tom", "Tom"]) should return a2{s3"Tom"r1;}', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(["Tom", "Tom"]);
            var result = stream.toString();
            assert(result === 'a2{s3"Tom"r1;}', 'serialize(["Tom", "Tom"]): ' + result);
        });
        it('serialize(a) should return a1{r0;}', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            var a = [];
            a[0] = a;
            writer.serialize(a);
            var result = stream.toString();
            assert(result === 'a1{r0;}', 'serialize(a): ' + result);
        });
        it('serialize(m) should return m1{s4"self"r0;}', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            var m = {};
            m.self = m;
            writer.serialize(m);
            var result = stream.toString();
            assert(result === 'm1{s4"self"r0;}', 'serialize(m): ' + result);
        });
        it('serialize(map) should return m3{r0;r0;s3"age"i12;s4"name"s5"Jason"}', function(){
            var stream = new StringIO();
            var writer = new Writer(stream);
            var map = new Map();
            map.set(map, map);
            map.set("age", 12);
            map.set("name", 'Jason');
            writer.serialize(map);
            var result = stream.toString();
            assert(result === 'm3{r0;r0;s3"age"i12;s4"name"s5"Jason"}', 'serialize(map): ' + result);
        });
        it('serialize(user) should return c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}', function(){
            function User() {}
            HproseClassManager.register(User, 'User');
            var user = new User();
            user.name = '张三';
            user.age = 28;
            user.self = user;
            var stream = new StringIO();
            var writer = new Writer(stream);
            writer.serialize(user);
            var result = stream.toString();
            assert(result === 'c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}', 'serialize(user): ' + result);
        });
    });
});
