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
 * unserializeTest.js                                     *
 *                                                        *
 * hprose unserialize test for JavaScript.                *
 *                                                        *
 * LastModified: Feb 18, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseFormatter, HproseClassManager */
/*jshint eqeqeq:true, devel:true */

describe('hprose', function(){
    describe('#unserialize()', function(){
        var unserialize = HproseFormatter.unserialize;
        it('unserialize("0") should return 0', function(){
            var result = unserialize('0');
            assert(result === 0);
        });
        it('unserialize("i-0;") should return -0', function(){
            var result = unserialize("i-0;");
            function isNegZero(value) {
                return (value === 0 && 1/value === -Infinity);
            }
            assert(isNegZero(result));
        });
        it('unserialize("1") should return 1', function(){
            var result = unserialize('1');
            assert(result === 1);
        });
        it('unserialize("i-1;") should return -1', function(){
            var result = unserialize('i-1;');
            assert(result === -1);
        });
        it('unserialize("i-2147483648;") should return -2147483648', function(){
            var result = unserialize('i-2147483648;');
            assert(result === -2147483648);
        });
        it('unserialize("i-2147483648;") should return -2147483648', function(){
            var result = unserialize('i-2147483648;');
            assert(result === -2147483648);
        });
        it('unserialize("i2147483647;") should return 2147483647', function(){
            var result = unserialize('i2147483647;');
            assert(result === 2147483647);
        });
        it('unserialize("d2147483648;") should return 2147483648', function(){
            var result = unserialize('d2147483648;');
            assert(result === 2147483648);
        });
        it('unserialize("l2147483648;") should return 2147483648', function(){
            var result = unserialize('l2147483648;');
            assert(result === 2147483648);
        });
        it('unserialize("l1234567890987654321;") should return "1234567890987654321"', function(){
            var result = unserialize('l1234567890987654321;');
            assert(result === "1234567890987654321");
        });
        it('unserialize("d0.1;") should return 0.1', function(){
            var result = unserialize('d0.1;');
            assert(result === 0.1);
        });
        it('unserialize("d10000000000000;") should return 1e13', function(){
            var result = unserialize('d10000000000000;');
            assert(result === 1e13);
        });
        it('unserialize("d1e13;") should return 1e13', function(){
            var result = unserialize('d1e13;');
            assert(result === 1e13);
        });
        it('unserialize("d1e+235;") should return 1e+235', function(){
            var result = unserialize('d1e+235;');
            assert(result === 1e+235);
        });
        it('unserialize("d1e-235;") should return 1e-235', function(){
            var result = unserialize('d1e-235;');
            assert(result === 1e-235);
        });
        it('unserialize("d1e-235;") should return 1e-235', function(){
            var result = unserialize('d1e-235;');
            assert(result === 1e-235);
        });
        it('unserialize("N") should return NaN', function(){
            var result = unserialize('N');
            assert(isNaN(result));
        });
        it('unserialize("I+") should return Infinity', function(){
            var result = unserialize('I+');
            assert(result === Infinity);
        });
        it('unserialize("I-") should return -Infinity', function(){
            var result = unserialize('I-');
            assert(result === -Infinity);
        });
        it('unserialize("t") should return true', function(){
            var result = unserialize('t');
            assert(result === true);
        });
        it('unserialize("f") should return false', function(){
            var result = unserialize('f');
            assert(result === false);
        });
        it('unserialize("n") should return null', function(){
            var result = unserialize('n');
            assert(result === null);
        });
        it('unserialize("e") should return ""', function(){
            var result = unserialize('e');
            assert(result === '');
        });
        it('unserialize("u我") should return "我"', function(){
            var result = unserialize('u我');
            assert(result === '我');
        });
        it('unserialize("u#") should return "#"', function(){
            var result = unserialize('u#');
            assert(result === '#');
        });
        it('unserialize(\'s5"Hello"\') should return "Hello"', function(){
            var result = unserialize('s5"Hello"');
            assert(result === 'Hello');
        });
        it('unserialize(\'s3"我爱你"\') should return "我爱你"', function(){
            var result = unserialize('s3"我爱你"');
            assert(result === '我爱你');
        });
        it('unserialize("a{}") should return []', function(){
            var result = unserialize('a{}');
            assert(result instanceof Array);
            assert(result.length === 0);
        });
        it('unserialize("a5{12345}") should return [1,2,3,4,5]', function(){
            var result = unserialize('a5{12345}');
            assert(result instanceof Array);
            assert(result.length === 5);
            assert(result[0] === 1);
            assert(result[1] === 2);
            assert(result[2] === 3);
            assert(result[3] === 4);
            assert(result[4] === 5);
        });
        it('unserialize(\'a2{s3"Tom"s5"Jerry"}\') should return ["Tom", "Jerry"]', function(){
            var result = unserialize('a2{s3"Tom"s5"Jerry"}');
            assert(result instanceof Array);
            assert(result.length === 2);
            assert(result[0] === "Tom");
            assert(result[1] === "Jerry");
        });
        it('unserialize(\'a2{s3"Tom"r1;}\') should return ["Tom", "Tom"]', function(){
            var result = unserialize('a2{s3"Tom"r1;}');
            assert(result instanceof Array);
            assert(result.length === 2);
            assert(result[0] === "Tom");
            assert(result[1] === "Tom");
        });
        it('unserialize(\'a1{r0;}\') should return a cycle array: a[0] === a', function(){
            var result = unserialize('a1{r0;}');
            assert(result instanceof Array);
            assert(result.length === 1);
            assert(result[0] === result);
        });
        it('unserialize(\'m1{s4"self"r0;}\') should return a cycle object: o.self === o', function(){
            var result = unserialize('m1{s4"self"r0;}');
            assert(result.self === result);
        });
        it('unserialize(\'c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}\') should return an User object', function(){
            function User() {}
            HproseClassManager.register(User, 'User');
            var result = unserialize('c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}');
            assert(result instanceof User);
            assert(result.name === "张三");
            assert(result.age === 28);
            assert(result.self === result);
        });
        it('unserialize(\'c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}\') should return an User object', function(){
            var result = unserialize('c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}');
            assert(result instanceof HproseClassManager.getClass("User"));
            assert(result.name === "张三");
            assert(result.age === 28);
            assert(result.self === result);
        });
    });
});
