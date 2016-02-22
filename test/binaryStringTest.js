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
 * binaryStringTest.js                                    *
 *                                                        *
 * BinaryString test for JavaScript.                      *
 *                                                        *
 * LastModified: Feb 22, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*jshint eqeqeq:true, devel:true */

describe('BinaryString', function(){
    var BinaryString = hprose.BinaryString;
    it('#toString() test', function() {
        var bs = new BinaryString("Hello World");
        assert(bs.toString() === "Hello World");
    });
    it('#valueOf() test', function() {
        var bs = new BinaryString("Hello World");
        assert(bs.valueOf() === "Hello World");
    });
    it('#length test', function() {
        var bs = new BinaryString("Hello World");
        assert(bs.length === 11);
    });
    it('prototype test', function() {
        var bs = new BinaryString("Hello World");
        assert(bs instanceof BinaryString);
        assert(bs instanceof String);
    });
    it('prototype method test', function() {
        var bs = new BinaryString("Hello World");
        assert(bs.substr(0, 5) === "Hello");
    });
    it('binary function test', function() {
        var bs = hprose.binary("Hello World");
        assert(bs.valueOf() === "Hello World");
    });
});
