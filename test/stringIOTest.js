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
 * stringIOTest.js                                        *
 *                                                        *
 * StringIO test for JavaScript.                          *
 *                                                        *
 * LastModified: Feb 21, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*jshint eqeqeq:true, devel:true */

describe('StringIO', function(){
    var StringIO = hprose.StringIO;
    it('#toString() test', function() {
        var s = new StringIO("Hello World");
        s.write("你好");
        s.write(12345);
        assert(s.toString() === "Hello World你好12345");
    });
    it('#length() test', function() {
        var s = new StringIO("Hello World");
        assert(s.length() === 11);
        s.write("你好");
        assert(s.length() === 13);
    });
    it('#position() test', function() {
        var s = new StringIO("Hello World");
        s.read(3);
        assert(s.position() === 3);
        s.skip(5);
        assert(s.position() === 8);
        s.read(10);
        assert(s.position() === 11);
    });
    it('#mark() & #reset() test', function() {
        var s = new StringIO("Hello World");
        s.read(3);
        s.mark();
        s.write("你好");
        s.skip(5);
        assert(s.position() === 8);
        assert(s.toString() === "Hello World你好");
        s.reset();
        assert(s.position() === 3);
        assert(s.toString() === "Hello World");
    });
    it('#clear() test', function() {
        var s = new StringIO("Hello World");
        s.read(3);
        assert(s.length() === 11);
        assert(s.position() === 3);
        assert(s.toString() === "Hello World");
        s.clear();
        assert(s.length() === 0);
        assert(s.position() === 0);
        assert(s.toString() === "");
    });
    it('#writeByte() test', function() {
        var s = new StringIO();
        s.writeByte(0x30);
        s.writeByte(0x31);
        s.writeByte(0x32);
        assert(s.readByte() === 0x30);
        assert(s.readByte() === 0x31);
        assert(s.readByte() === 0x32);
    });
    it('#writeInt32BE() test', function() {
        var s = new StringIO();
        s.writeInt32BE(0xFDB96420 | 0);
        assert(s.readByte() === 0xFD);
        assert(s.readByte() === 0xB9);
        assert(s.readByte() === 0x64);
        assert(s.readByte() === 0x20);
    });
    it('#writeUInt32BE() test', function() {
        var s = new StringIO();
        s.writeUInt32BE(0xFDB96420);
        assert(s.readByte() === 0xFD);
        assert(s.readByte() === 0xB9);
        assert(s.readByte() === 0x64);
        assert(s.readByte() === 0x20);
    });
    it('#writeInt32LE() test', function() {
        var s = new StringIO();
        s.writeInt32LE(0xFDB96420 | 0);
        assert(s.readByte() === 0x20);
        assert(s.readByte() === 0x64);
        assert(s.readByte() === 0xB9);
        assert(s.readByte() === 0xFD);
    });
    it('#writeUInt32LE() test', function() {
        var s = new StringIO();
        s.writeUInt32LE(0xFDB96420);
        assert(s.readByte() === 0x20);
        assert(s.readByte() === 0x64);
        assert(s.readByte() === 0xB9);
        assert(s.readByte() === 0xFD);
    });
    it('#writeUTF16AsUTF8() test', function() {
        var s = new StringIO();
        s.writeUTF16AsUTF8("Hello World, ");
        s.writeUTF16AsUTF8("你好");
        assert(s.read(19) === "Hello World, \xE4\xBD\xA0\xE5\xA5\xBD");
    });
    it('#writeUTF8AsUTF16() test', function() {
        var s = new StringIO();
        s.writeUTF8AsUTF16("Hello World, ");
        s.writeUTF8AsUTF16("\xE4\xBD\xA0\xE5\xA5\xBD");
        assert(s.read(15) === "Hello World, 你好");
    });
    it('#write() test', function() {
        var s = new StringIO();
        s.write("Hello World, ");
        s.write("\xE4\xBD\xA0\xE5\xA5\xBD");
        s.write("你好");
        s.write(1234567890);
        s.write(3.14159265);
        assert(s.read(21) === "Hello World, \xE4\xBD\xA0\xE5\xA5\xBD你好");
        assert(s.read(10) === "1234567890");
        assert(s.read(10) === "3.14159265");
    });
    it('#readByte() test', function() {
        var s = new StringIO();
        var i;
        for (i = 0; i <= 1024; ++i) {
            s.writeByte(i);
        }
        for (i = 0; i <= 1024; ++i) {
            assert(s.readByte() === (i & 0xFF));
        }
    });
    it('#readChar() test', function() {
        var s = new StringIO();
        var i;
        for (i = 0; i <= 1024; ++i) {
            s.write(String.fromCharCode(i));
        }
        for (i = 0; i <= 1024; ++i) {
            assert(s.readChar() === String.fromCharCode(i));
        }
    });
    it('#readInt32BE() test', function() {
        var s = new StringIO();
        s.writeInt32BE(0xFDB96420 | 0);
        assert(s.readInt32BE() === (0xFDB96420 | 0));
        s.writeUInt32BE(0xFDB96420);
        assert(s.readInt32BE() === (0xFDB96420 | 0));
        s.writeInt32LE(0xFDB96420 | 0);
        assert(s.readInt32BE() === (0x2064B9FD | 0));
        s.writeUInt32LE(0xFDB96420);
        assert(s.readInt32BE() === (0x2064B9FD | 0));
    });
    it('#readUInt32BE() test', function() {
        var s = new StringIO();
        s.writeInt32BE(0xFDB96420 | 0);
        assert(s.readUInt32BE() === 0xFDB96420);
        s.writeUInt32BE(0xFDB96420);
        assert(s.readUInt32BE() === 0xFDB96420);
        s.writeInt32LE(0xFDB96420 | 0);
        assert(s.readUInt32BE() === 0x2064B9FD);
        s.writeUInt32LE(0xFDB96420);
        assert(s.readUInt32BE() === 0x2064B9FD);
    });
    it('#readInt32LE() test', function() {
        var s = new StringIO();
        s.writeInt32BE(0xFDB96420 | 0);
        assert(s.readInt32LE() === (0x2064B9FD | 0));
        s.writeUInt32BE(0xFDB96420);
        assert(s.readInt32LE() === (0x2064B9FD | 0));
        s.writeInt32LE(0xFDB96420 | 0);
        assert(s.readInt32LE() === (0xFDB96420 | 0));
        s.writeUInt32LE(0xFDB96420);
        assert(s.readInt32LE() === (0xFDB96420 | 0));
    });
    it('#readUInt32LE() test', function() {
        var s = new StringIO();
        s.writeInt32BE(0xFDB96420 | 0);
        assert(s.readUInt32LE() === 0x2064B9FD);
        s.writeUInt32BE(0xFDB96420);
        assert(s.readUInt32LE() === 0x2064B9FD);
        s.writeInt32LE(0xFDB96420 | 0);
        assert(s.readUInt32LE() === 0xFDB96420);
        s.writeUInt32LE(0xFDB96420);
        assert(s.readUInt32LE() === 0xFDB96420);
    });
    it('#read() test', function() {
        var s = new StringIO();
        s.write("Hello World, \xE4\xBD\xA0\xE5\xA5\xBD你好");
        s.write(1234567890);
        s.write(3.14159265);
        assert(s.read(13) === "Hello World, ");
        assert(s.read(6) === "\xE4\xBD\xA0\xE5\xA5\xBD");
        assert(s.read(2) === "你好");
        assert(s.read(10) === "1234567890");
        assert(s.read(10) === "3.14159265");
        assert(s.read(100) === "");
    });
    it('#skip() test', function() {
        var s = new StringIO();
        s.write("Hello World, \xE4\xBD\xA0\xE5\xA5\xBD你好");
        s.write(1234567890);
        s.write(3.14159265);
        assert(s.read(13) === "Hello World, ");
        s.skip(6);
        assert(s.read(2) === "你好");
        s.skip(10);
        assert(s.read(10) === "3.14159265");
        var p = s.position();
        s.skip(100);
        assert(p === s.position());
    });
    it('#readString() test', function() {
        var s = new StringIO();
        s.write("Hello World, \xE4\xBD\xA0\xE5\xA5\xBD,你好");
        assert(s.readString(' ') === "Hello ");
        assert(s.readString(' ') === "World, ");
        assert(s.readString(',') === "\xE4\xBD\xA0\xE5\xA5\xBD,");
        assert(s.readString(',') === "你好");
    });
    it('#readUntil() test', function() {
        var s = new StringIO();
        s.write("Hello World, \xE4\xBD\xA0\xE5\xA5\xBD,你好");
        assert(s.readUntil(' ') === "Hello");
        assert(s.readUntil(' ') === "World,");
        assert(s.readUntil(',') === "\xE4\xBD\xA0\xE5\xA5\xBD");
        assert(s.readUntil(',') === "你好");
    });
    it('#readUTF8AsUTF16() test', function() {
        var s = new StringIO();
        s.writeUTF16AsUTF8("Hello World, ");
        s.writeUTF16AsUTF8("你好");
        assert(s.readUTF8AsUTF16(15) === "Hello World, 你好");
    });
    it('#readUTF16AsUTF8() test', function() {
        var s = new StringIO();
        s.writeUTF8AsUTF16("Hello World, ");
        s.writeUTF8AsUTF16("\xE4\xBD\xA0\xE5\xA5\xBD");
        assert(s.readUTF16AsUTF8(15) === "Hello World, \xE4\xBD\xA0\xE5\xA5\xBD");
    });
    it('#take() test', function() {
        var s = new StringIO("Hello World");
        assert(s.take() === "Hello World");
        assert(s.toString() === "");
    });
    it('#clone() test', function() {
        var s = new StringIO("Hello World");
        var s2 = s.clone();
        assert(s !== s2);
        assert(s.toString() === s2.toString());
    });
    it('#trunc() test', function() {
        var s = new StringIO("Hello World");
        s.skip(6);
        assert(s.toString() === "Hello World");
        s.write(" Hello");
        s.trunc();
        assert(s.toString() === "World Hello");
    });

});
