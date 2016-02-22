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
 * StringIO.js                                            *
 *                                                        *
 * hprose StringIO for JavaScript.                        *
 *                                                        *
 * LastModified: Feb 21, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/* jshint -W067 */
(function (global, undefined) {
    'use strict';

    // i is a int32 number
    function int32BE(i) {
        return String.fromCharCode(
            i >>> 24 & 0xFF,
            i >>> 16 & 0xFF,
            i >>> 8  & 0xFF,
            i        & 0xFF
        );
    }

    // i is a int32 number
    function int32LE(i) {
        return String.fromCharCode(
            i        & 0xFF,
            i >>> 8  & 0xFF,
            i >>> 16 & 0xFF,
            i >>> 24 & 0xFF
        );
    }

    // s is an UTF16 encode string
    function utf8Encode(s) {
        if (/^[\x00-\x7f]*$/.test(s)) {
            return s;
        }
        var buf = [];
        var n = s.length;
        for (var i = 0, j = 0; i < n; ++i, ++j) {
            var codeUnit = s.charCodeAt(i);
            if (codeUnit < 0x80) {
                buf[j] = s.charAt(i);
            }
            else if (codeUnit < 0x800) {
                buf[j] = String.fromCharCode(0xC0 | (codeUnit >> 6),
                                             0x80 | (codeUnit & 0x3F));
            }
            else if (codeUnit < 0xD800 || codeUnit > 0xDFFF) {
                buf[j] = String.fromCharCode(0xE0 | (codeUnit >> 12),
                                             0x80 | ((codeUnit >> 6) & 0x3F),
                                             0x80 | (codeUnit & 0x3F));
            }
            else {
                if (i + 1 < n) {
                    var nextCodeUnit = s.charCodeAt(i + 1);
                    if (codeUnit < 0xDC00 && 0xDC00 <= nextCodeUnit && nextCodeUnit <= 0xDFFF) {
                        var rune = (((codeUnit & 0x03FF) << 10) | (nextCodeUnit & 0x03FF)) + 0x010000;
                        buf[j] = String.fromCharCode(0xF0 | ((rune >> 18) &0x3F),
                                                     0x80 | ((rune >> 12) & 0x3F),
                                                     0x80 | ((rune >> 6) & 0x3F),
                                                     0x80 | (rune & 0x3F));
                        ++i;
                        continue;
                    }
                }
                throw new Error('Malformed string');
            }
        }
        return buf.join('');
    }

    function readShortString(bs, n) {
        var charCodes = new Array(n);
        var i = 0, off = 0;
        for (var len = bs.length; i < n && off < len; i++) {
            var unit = bs.charCodeAt(off++);
            switch (unit >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                charCodes[i] = unit;
                break;
            case 12:
            case 13:
                if (off < len) {
                    charCodes[i] = ((unit & 0x1F) << 6) |
                                    (bs.charCodeAt(off++) & 0x3F);
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            case 14:
                if (off + 1 < len) {
                    charCodes[i] = ((unit & 0x0F) << 12) |
                                   ((bs.charCodeAt(off++) & 0x3F) << 6) |
                                   (bs.charCodeAt(off++) & 0x3F);
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            case 15:
                if (off + 2 < len) {
                    var rune = (((unit & 0x07) << 18) |
                                ((bs.charCodeAt(off++) & 0x3F) << 12) |
                                ((bs.charCodeAt(off++) & 0x3F) << 6) |
                                (bs.charCodeAt(off++) & 0x3F)) - 0x10000;
                    if (0 <= rune && rune <= 0xFFFFF) {
                        charCodes[i++] = (((rune >> 10) & 0x03FF) | 0xD800);
                        charCodes[i] = ((rune & 0x03FF) | 0xDC00);
                    }
                    else {
                        throw new Error('Character outside valid Unicode range: 0x' + rune.toString(16));
                    }
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            default:
                throw new Error('Bad UTF-8 encoding 0x' + unit.toString(16));
            }
        }
        if (i < n) {
            charCodes.length = i;
        }
        return [String.fromCharCode.apply(String, charCodes), off];
    }

    function readLongString(bs, n) {
        var buf = [];
        var charCodes = new Array(0xFFFF);
        var i = 0, off = 0;
        for (var len = bs.length; i < n && off < len; i++) {
            var unit = bs.charCodeAt(off++);
            switch (unit >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                charCodes[i] = unit;
                break;
            case 12:
            case 13:
                if (off < len) {
                    charCodes[i] = ((unit & 0x1F) << 6) |
                                    (bs.charCodeAt(off++) & 0x3F);
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            case 14:
                if (off + 1 < len) {
                    charCodes[i] = ((unit & 0x0F) << 12) |
                                   ((bs.charCodeAt(off++) & 0x3F) << 6) |
                                   (bs.charCodeAt(off++) & 0x3F);
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            case 15:
                if (off + 2 < len) {
                    var rune = (((unit & 0x07) << 18) |
                                ((bs.charCodeAt(off++) & 0x3F) << 12) |
                                ((bs.charCodeAt(off++) & 0x3F) << 6) |
                                (bs.charCodeAt(off++) & 0x3F)) - 0x10000;
                    if (0 <= rune && rune <= 0xFFFFF) {
                        charCodes[i++] = (((rune >> 10) & 0x03FF) | 0xD800);
                        charCodes[i] = ((rune & 0x03FF) | 0xDC00);
                    }
                    else {
                        throw new Error('Character outside valid Unicode range: 0x' + rune.toString(16));
                    }
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            default:
                throw new Error('Bad UTF-8 encoding 0x' + unit.toString(16));
            }
            if (i >= 65534) {
                var size = i + 1;
                charCodes.length = size;
                buf[buf.length] = String.fromCharCode.apply(String, charCodes);
                n -= size;
                i = -1;
            }
        }
        if (i > 0) {
            charCodes.length = i;
            buf[buf.length] = String.fromCharCode.apply(String, charCodes);
        }
        return [buf.join(''), off];
    }

    // bs is an UTF8 encode binary string
    // n is UTF16 length
    function readString(bs, n) {
        if (n === undefined || n === null || (n < 0)) n = bs.length;
        if (n === 0) return ['', 0];
        if (/^[\x00-\x7f]*$/.test(bs) || !(/^[\x00-\xff]*$/.test(bs))) {
            if (n === bs.length) return [bs, n];
            return [bs.substr(0, n), n];
        }
        return ((n < 100000) ?
                readShortString(bs, n) :
                readLongString(bs, n));
    }

    // bs is an UTF8 encode binary string
    function utf8Decode(bs) {
        return readString(bs)[0];
    }

    // s is an UTF16 encode string
    function utf8Length(s) {
        var n = s.length;
        if (/^[\x00-\x7f]*$/.test(s)) {
            return n;
        }
        var length = 0;
        for (var i = 0; i < n; ++i) {
            var codeUnit = s.charCodeAt(i);
            if (codeUnit < 0x80) {
                ++length;
            }
            else if (codeUnit < 0x800) {
                length += 2;
            }
            else if (codeUnit < 0xD800 || codeUnit > 0xDFFF) {
                length += 3;
            }
            else {
                if (i + 1 < n) {
                    var nextCodeUnit = s.charCodeAt(i + 1);
                    if (codeUnit < 0xDC00 && 0xDC00 <= nextCodeUnit && nextCodeUnit <= 0xDFFF) {
                        ++i;
                        length += 4;
                        continue;
                    }
                }
                throw new Error('Malformed string');
            }
        }
        return length;
    }

    // bs is an UTF8 encode binary string
    function utf16Length(bs) {
        var n = bs.length;
        if (/^[\x00-\x7f]*$/.test(bs) || !(/^[\x00-\xff]*$/.test(bs))) {
            return n;
        }
        var length = 0;
        for (var i = 0; i < n; ++i, ++length) {
            var unit = bs.charCodeAt(i);
            switch (unit >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                break;
            case 12:
            case 13:
                if (i < n) {
                    ++i;
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            case 14:
                if (i + 1 < n) {
                    i += 2;
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            case 15:
                if (i + 2 < n) {
                    var rune = (((unit & 0x07) << 18) |
                                ((bs.charCodeAt(i++) & 0x3F) << 12) |
                                ((bs.charCodeAt(i++) & 0x3F) << 6) |
                                (bs.charCodeAt(i++) & 0x3F)) - 0x10000;
                    if (0 <= rune && rune <= 0xFFFFF) {
                        ++length;
                    }
                    else {
                        throw new Error('Character outside valid Unicode range: 0x' + rune.toString(16));
                    }
                }
                else {
                    throw new Error('Unfinished UTF-8 octet sequence');
                }
                break;
            default:
                throw new Error('Bad UTF-8 encoding 0x' + unit.toString(16));
            }
        }
        return length;
    }

    function isUTF8(bs) {
        if (/^[\x00-\x7f]*$/.test(bs)) {
            return true;
        }
        if (!(/^[\x00-\xff]*$/.test(bs))) {
            return false;
        }
        for (var i = 0, n = bs.length; i < n; ++i) {
            var unit = bs.charCodeAt(i);
            switch (unit >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                break;
            case 12:
            case 13:
                if (i < n) {
                    ++i;
                }
                else {
                    return false;
                }
                break;
            case 14:
                if (i + 1 < n) {
                    i += 2;
                }
                else {
                    return false;
                }
                break;
            case 15:
                if (i + 2 < n) {
                    var rune = (((unit & 0x07) << 18) |
                                ((bs.charCodeAt(i++) & 0x3F) << 12) |
                                ((bs.charCodeAt(i++) & 0x3F) << 6) |
                                (bs.charCodeAt(i++) & 0x3F)) - 0x10000;
                    if (!(0 <= rune && rune <= 0xFFFFF)) {
                        return false;
                    }
                }
                else {
                    return false;
                }
                break;
            default:
                return false;
            }
        }
        return true;
    }

    function StringIO() {
        var a = arguments;
        switch (a.length) {
        case 1:
            this._buffer = [a[0].toString()];
            break;
        case 2:
            this._buffer = [a[0].toString().substr(a[1])];
            break;
        case 3:
            this._buffer = [a[0].toString().substr(a[1], a[2])];
            break;
        default:
            this._buffer = [''];
            break;
        }
        this.mark();
    }

    var defineProperties = global.hprose.defineProperties;

    defineProperties(StringIO.prototype, {
        _buffer: { writable: true },
        _off: { value: 0, writable: true },
        _wmark: { writable: true },
        _rmark: { writable: true },
        toString: { value: function() {
            if (this._buffer.length > 1) {
                this._buffer = [this._buffer.join('')];
            }
            return this._buffer[0];
        } },
        length: { get: function() {
            return this.toString().length;
        } },
        position: { get: function() {
            return this._off;
        } },
        mark: { value: function() {
            this._wmark = this.length();
            this._rmark = this._off;
        } },
        reset: { value: function() {
            this._buffer = [this.toString().substr(0, this._wmark)];
            this._off = this._rmark;
        } },
        clear: { value: function() {
            this._buffer = [''];
            this._wmark = 0;
            this._off = 0;
            this._rmark = 0;
        } },
        writeByte: { value: function(b) {
            this._buffer.push(String.fromCharCode(b & 0xFF));
        } },
        writeInt32BE: { value: function(i) {
            if ((i === (i | 0)) && (i <= 2147483647)) {
                this._buffer.push(int32BE(i));
                return;
            }
            throw new TypeError('value is out of bounds');
        } },
        writeUInt32BE: { value: function(i) {
            if (((i & 0x7FFFFFFF) + 0x80000000 === i) && (i >= 0)) {
                this._buffer.push(int32BE(i | 0));
                return;
            }
            throw new TypeError('value is out of bounds');
        } },
        writeInt32LE: { value: function(i) {
            if ((i === (i | 0)) && (i <= 2147483647)) {
                this._buffer.push(int32LE(i));
                return;
            }
            throw new TypeError('value is out of bounds');
        } },
        writeUInt32LE: { value: function(i) {
            if (((i & 0x7FFFFFFF) + 0x80000000 === i) && (i >= 0)) {
                this._buffer.push(int32LE(i | 0));
                return;
            }
            throw new TypeError('value is out of bounds');
        } },
        writeUTF16AsUTF8: { value: function(str) {
            this._buffer.push(utf8Encode(str));
        } },
        writeUTF8AsUTF16: { value: function(str) {
            this._buffer.push(utf8Decode(str));
        } },
        write: { value: function(data) {
            this._buffer.push(data);
        } },
        readByte: { value: function() {
            if (this._off < this.length()) {
                return this._buffer[0].charCodeAt(this._off++);
            }
            return -1;
        } },
        readChar: { value: function() {
            if (this._off < this.length()) {
                return this._buffer[0].charAt(this._off++);
            }
            return '';
        } },
        readInt32BE: { value: function() {
            var len = this.length();
            var buf = this._buffer[0];
            var off = this._off;
            if (off + 3 < len) {
                var result = buf.charCodeAt(off++) << 24 |
                             buf.charCodeAt(off++) << 16 |
                             buf.charCodeAt(off++) << 8  |
                             buf.charCodeAt(off++);
                this._off = off;
                return result;
            }
            throw new Error('EOF');
        } },
        readUInt32BE: { value: function() {
            var value = this.readInt32BE();
            if (value < 0) {
                return (value & 0x7FFFFFFF) + 0x80000000;
            }
            return value;
        } },
        readInt32LE: { value: function() {
            var len = this.length();
            var buf = this._buffer[0];
            var off = this._off;
            if (off + 3 < len) {
                var result = buf.charCodeAt(off++)       |
                             buf.charCodeAt(off++) << 8  |
                             buf.charCodeAt(off++) << 16 |
                             buf.charCodeAt(off++) << 24;
                this._off = off;
                return result;
            }
            throw new Error('EOF');
        } },
        readUInt32LE: { value: function() {
            var value = this.readInt32LE();
            if (value < 0) {
                return (value & 0x7FFFFFFF) + 0x80000000;
            }
            return value;
        } },
        read: { value: function(n) {
            var off = this._off;
            var len = this.length();
            if (off + n > len) {
                n = len - off;
            }
            if (n === 0) return '';
            this._off = off + n;
            return this._buffer[0].substring(off, this._off);
        } },
        skip: { value: function(n) {
            var len = this.length();
            if (this._off + n > len) {
                n = len - this._off;
                this._off = len;
            }
            else {
                this._off += n;
            }
            return n;
        } },
        // the result is an String, and includes tag.
        readString: { value: function(tag) {
            var len = this.length();
            var off = this._off;
            var buf = this._buffer[0];
            var pos = buf.indexOf(tag, off);
            if (pos === -1) {
                buf = buf.substr(off);
                this._off = len;
            }
            else {
                buf = buf.substring(off, pos + 1);
                this._off = pos + 1;
            }
            return buf;
        } },
        // the result is a String, and doesn't include tag.
        // but the position is the same as readString
        readUntil: { value: function(tag) {
            var len = this.length();
            var off = this._off;
            var buf = this._buffer[0];
            var pos = buf.indexOf(tag, off);
            if (pos === this._off) {
                buf = '';
                this._off++;
            }
            else if (pos === -1) {
                buf = buf.substr(off);
                this._off = len;
            }
            else {
                buf = buf.substring(off, pos);
                this._off = pos + 1;
            }
            return buf;
        } },
        // n is the UTF16 length
        readUTF8AsUTF16: { value: function(n) {
            var len = this.length();
            var r = readString(this._buffer[0].substring(this._off, len), n);
            this._off += r[1];
            return r[0];
        } },
        // n is also the UTF16 length
        readUTF16AsUTF8: { value: function(n) {
            return utf8Encode(this.read(n));
        } },
        // returns a view of the the internal buffer and clears `this`.
        take: { value: function() {
            var buffer = this.toString();
            this.clear();
            return buffer;
        } },
        clone: { value: function() {
            return new StringIO(this.toString());
        } },
        trunc: { value: function() {
            var buf = this.toString().substring(this._off, this._length);
            this._buffer[0] = buf;
            this._off = 0;
            this._wmark = 0;
            this._rmark = 0;
        } }
    });

    defineProperties(StringIO, {
        utf8Encode: { value: utf8Encode },
        utf8Decode: { value: utf8Decode },
        utf8Length: { value: utf8Length },
        utf16Length: { value: utf16Length },
        isUTF8: { value: isUTF8 }
    });

    global.hprose.StringIO = StringIO;

}(function() {
    return this || (1, eval)('this');
}()));
