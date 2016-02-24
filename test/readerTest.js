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
 * readerTest.js                                          *
 *                                                        *
 * hprose reader test for JavaScript.                     *
 *                                                        *
 * LastModified: Feb 24, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global hprose */
/*jshint eqeqeq:true, devel:true */

describe('hprose.Reader', function(){
    describe('#unserialize()', function(){
        var StringIO = hprose.StringIO;
        var BinaryString = hprose.BinaryString;
        var Reader = hprose.Reader;
        it('unserialize("0") should return 0', function(){
            var stream = new StringIO("0");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 0);
        });
        it('unserialize("i-0;") should return -0', function(){
            function isNegZero(value) {
                return (value === 0 && 1/value === -Infinity);
            }
            var stream = new StringIO("i-0;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(isNegZero(result));
        });
        it('unserialize("1") should return 1', function(){
            var stream = new StringIO("1");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 1);
        });
        it('unserialize("i-1;") should return -1', function(){
            var stream = new StringIO("i-1;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === -1);
        });
        it('unserialize("i-2147483648;") should return -2147483648', function(){
            var stream = new StringIO("i-2147483648;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === -2147483648);
        });
        it('unserialize("i2147483647;") should return 2147483647', function(){
            var stream = new StringIO("i2147483647;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 2147483647);
        });
        it('unserialize("d2147483648;") should return 2147483648', function(){
            var stream = new StringIO("d2147483648;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 2147483648);
        });
        it('unserialize("l2147483648;") should return 2147483648', function(){
            var stream = new StringIO("l2147483648;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 2147483648);
        });
        it('unserialize("l1234567890987654321;") should return "1234567890987654321"', function(){
            var stream = new StringIO("l1234567890987654321;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === "1234567890987654321");
        });
        it('unserialize("d0.1;") should return 0.1', function(){
            var stream = new StringIO("d0.1;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 0.1);
        });
        it('unserialize("d10000000000000;") should return 1e13', function(){
            var stream = new StringIO("d10000000000000;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 1e13);
        });
        it('unserialize("d1e13;") should return 1e13', function(){
            var stream = new StringIO("d1e13;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 1e13);
        });
        it('unserialize("d1e+235;") should return 1e+235', function(){
            var stream = new StringIO("d1e+235;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 1e+235);
        });
        it('unserialize("d1e-235;") should return 1e-235', function(){
            var stream = new StringIO("d1e-235;");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 1e-235);
        });
        it('unserialize("N") should return NaN', function(){
            var stream = new StringIO("N");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(isNaN(result));
        });
        it('unserialize("I+") should return Infinity', function(){
            var stream = new StringIO("I+");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === Infinity);
        });
        it('unserialize("I-") should return -Infinity', function(){
            var stream = new StringIO("I-");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === -Infinity);
        });
        it('unserialize("t") should return true', function(){
            var stream = new StringIO("t");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === true);
        });
        it('unserialize("f") should return false', function(){
            var stream = new StringIO("f");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === false);
        });
        it('unserialize("n") should return null', function(){
            var stream = new StringIO("n");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === null);
        });
        it('unserialize("e") should return ""', function(){
            var stream = new StringIO("e");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === '');
        });
        it('unserialize("u我") should return "我" in text mode', function(){
            var stream = new StringIO("u我");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === '我');
        });
        it('unserialize("u\\xE6\\x88\\x91") should return "我" in binary mode', function(){
            var stream = new StringIO("u\xE6\x88\x91");
            var reader = new Reader(stream);
            reader.binary = true;
            var result = reader.unserialize();
            assert(result === '我');
        });
        it('unserialize("u#") should return "#"', function(){
            var stream = new StringIO("u#");
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === '#');
        });
        it('unserialize(\'s5"Hello"\') should return "Hello"', function(){
            var stream = new StringIO('s5"Hello"');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === 'Hello');
        });
        it('unserialize(\'b5"Hello"\') should return binary("Hello") in binary mode', function(){
            var stream = new StringIO('b5"Hello"');
            var reader = new Reader(stream);
            reader.binary = true;
            var result = reader.unserialize();
            assert(result.toString() === 'Hello' && result instanceof BinaryString);
        });
        it('unserialize(\'s2"你好"\') should return "你好" in text mode', function(){
            var stream = new StringIO('s2"你好"');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result === '你好');
        });
        it('unserialize(\'s2"\\xE4\\xBD\\xA0\\xE5\\xA5\\xBD\') should return "你好" in binary mode', function(){
            var stream = new StringIO('s2"\xE4\xBD\xA0\xE5\xA5\xBD');
            var reader = new Reader(stream);
            reader.binary = true;
            var result = reader.unserialize();
            assert(result === '你好');
        });
        it('unserialize("a{}") should return []', function(){
            var stream = new StringIO('a{}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result instanceof Array);
            assert(result.length === 0);
        });
        it('unserialize("a5{12345}") should return [1,2,3,4,5]', function(){
            var stream = new StringIO('a5{12345}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result instanceof Array);
            assert(result.length === 5);
            assert(result[0] === 1);
            assert(result[1] === 2);
            assert(result[2] === 3);
            assert(result[3] === 4);
            assert(result[4] === 5);
        });
        it('unserialize(\'a2{s3"Tom"s5"Jerry"}\') should return ["Tom", "Jerry"]', function(){
            var stream = new StringIO('a2{s3"Tom"s5"Jerry"}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result instanceof Array);
            assert(result.length === 2);
            assert(result[0] === "Tom");
            assert(result[1] === "Jerry");
        });
        it('unserialize(\'a2{s3"Tom"r1;}\') should return ["Tom", "Tom"]', function(){
            var stream = new StringIO('a2{s3"Tom"r1;}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result instanceof Array);
            assert(result.length === 2);
            assert(result[0] === "Tom");
            assert(result[1] === "Tom");
        });
        it('unserialize(\'a1{r0;}\') should return a cycle array: a[0] === a', function(){
            var stream = new StringIO('a1{r0;}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result instanceof Array);
            assert(result.length === 1);
            assert(result[0] === result);
        });
        it('unserialize(\'m1{s4"self"r0;}\') should return a cycle object: o.self === o', function(){
            var stream = new StringIO('m1{s4"self"r0;}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result.self === result);
        });
        it('unserialize(\'c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}\') should return an User object', function(){
            function User() {}
            hprose.ClassManager.register(User, 'User');
            var stream = new StringIO('c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result instanceof User);
            assert(result.name === "张三");
            assert(result.age === 28);
            assert(result.self === result);
        });
        it('unserialize(\'c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}\') should return an User object', function(){
            var stream = new StringIO('c4"User"3{s4"name"s3"age"s4"self"}o0{s2"张三"i28;r3;}');
            var reader = new Reader(stream);
            var result = reader.unserialize();
            assert(result instanceof hprose.ClassManager.getClass("User"));
            assert(result.name === "张三");
            assert(result.age === 28);
            assert(result.self === result);
        });
    });
});
