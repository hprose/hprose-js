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
 * Reader.js                                              *
 *                                                        *
 * hprose Reader for JavaScript.                          *
 *                                                        *
 * LastModified: Feb 23, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global, undefined) {
    'use strict';

    var Map = global.Map;
    var StringIO = global.hprose.StringIO;
    var BinaryString = global.hprose.BinaryString;
    var Tags = global.hprose.Tags;
    var ClassManager = global.hprose.ClassManager;
    var defineProperties = global.hprose.defineProperties;
    var createObject = global.hprose.createObject;
    var utf8Decode = StringIO.utf8Decode;

    function unexpectedTag(tag, expectTags) {
        if (tag && expectTags) {
            throw new Error('Tag "' + expectTags + '" expected, but "' + tag + '" found in stream');
        }
        if (tag) {
            throw new Error('Unexpected serialize tag "' + tag + '" in stream');
        }
        throw new Error('No byte found in stream');
    }

    function readRaw(stream, binary) {
        var ostream = new StringIO();
        _readRaw(stream, ostream, binary);
        return ostream.take();
    }

    function _readRaw(stream, ostream, binary) {
        __readRaw(stream, ostream, stream.readChar(), binary);
    }

    function __readRaw(stream, ostream, tag, binary) {
        ostream.write(tag);
        switch (tag) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case Tags.TagNull:
            case Tags.TagEmpty:
            case Tags.TagTrue:
            case Tags.TagFalse:
            case Tags.TagNaN:
                break;
            case Tags.TagInfinity:
                ostream.write(stream.read());
                break;
            case Tags.TagInteger:
            case Tags.TagLong:
            case Tags.TagDouble:
            case Tags.TagRef:
                readNumberRaw(stream, ostream);
                break;
            case Tags.TagDate:
            case Tags.TagTime:
                readDateTimeRaw(stream, ostream);
                break;
            case Tags.TagUTF8Char:
                readUTF8CharRaw(stream, ostream, binary);
                break;
            case Tags.TagBytes:
                readBinaryRaw(stream, ostream, binary);
                break;
            case Tags.TagString:
                readStringRaw(stream, ostream, binary);
                break;
            case Tags.TagGuid:
                readGuidRaw(stream, ostream);
                break;
            case Tags.TagList:
            case Tags.TagMap:
            case Tags.TagObject:
                readComplexRaw(stream, ostream, binary);
                break;
            case Tags.TagClass:
                readComplexRaw(stream, ostream, binary);
                _readRaw(stream, ostream, binary);
                break;
            case Tags.TagError:
                _readRaw(stream, ostream, binary);
                break;
            default: unexpectedTag(tag);
        }
    }

    function readNumberRaw(stream, ostream) {
        var tag;
        do {
            tag = stream.read();
            ostream.write(tag);
        } while (tag !== Tags.TagSemicolon);
    }

    function readDateTimeRaw(stream, ostream) {
        var tag;
        do {
            tag = stream.read();
            ostream.write(tag);
        } while (tag !== Tags.TagSemicolon &&
                 tag !== Tags.TagUTC);
    }

    function readUTF8CharRaw(stream, ostream, binary) {
        if (binary) {
            ostream.write(stream.readUTF8(1));
        }
        else {
            ostream.write(stream.readChar());
        }
    }

    function readBinaryRaw(stream, ostream, binary) {
        if (!binary) {
            throw new Error('The binary string does not support to unserialize in text mode.');
        }
        var s = stream.readUntil(Tags.TagQuote);
        ostream.write(s);
        ostream.write(Tags.TagQuote);
        var count = 0;
        if (s.length > 0) {
            count = parseInt(s, 10);
        }
        ostream.write(stream.read(len + 1));
    }

    function readStringRaw(stream, ostream, binary) {
        var s = stream.readUntil(Tags.TagQuote);
        ostream.write(s);
        ostream.write(Tags.TagQuote);
        var count = 0;
        if (s.length > 0) {
            count = parseInt(s, 10);
        }
        if (binary) {
            ostream.write(stream.readUTF8(len + 1));
        }
        else {
            ostream.write(stream.read(len + 1));
        }
    }

    function readGuidRaw(stream, ostream) {
        ostream.write(stream.read(38));
    }

    function readComplexRaw(stream, ostream, binary) {
        var tag;
        do {
            tag = stream.readChar();
            ostream.write(tag);
        } while (tag !== Tags.TagOpenbrace);
        while ((tag = stream.readChar()) !== Tags.TagClosebrace) {
            __readRaw(stream, ostream, tag, binary);
        }
        ostream.write(tag);
    }

    function RawReader(stream, binary) {
        defineProperties(this, {
            stream: { value : stream },
            binary: { value : !!binary, writable: true },
            readRaw: { value: function() { return readRaw(stream, this.binary); } }
        });
    }

    global.hprose.RawReader = RawReader;

    var fakeReaderRefer = createObject(null, {
        set: { value: function() {} },
        read: { value: function() { unexpectedTag(Tags.TagRef); } },
        reset: { value: function() {} }
    });

    function RealReaderRefer() {
        defineProperties(this, {
            ref: { value: [] }
        });
    }

    defineProperties(RealReaderRefer.prototype, {
        set: { value: function(val) { this.ref.push(val); } },
        read: { value: function(index) { return this.ref[index]; } },
        reset: { value: function() { this.ref.length = 0; } }
    });

    function realReaderRefer() {
        return new RealReaderRefer();
    }

    function getter(str) {
        var obj = global;
        var names = str.split('.');
        var i;
        for (i = 0; i < names.length; i++) {
            obj = obj[names[i]];
            if (obj === undefined) {
                return null;
            }
        }
        return obj;
    }
    function findClass(cn, poslist, i, c) {
        if (i < poslist.length) {
            var pos = poslist[i];
            cn[pos] = c;
            var cls = findClass(cn, poslist, i + 1, '.');
            if (i + 1 < poslist.length) {
                if (cls === null) {
                    cls = findClass(cn, poslist, i + 1, '_');
                }
            }
            return cls;
        }
        var classname = cn.join('');
        try {
            var cl = getter(classname);
            return ((typeof(cl) === 'function') ? cl : null);
        } catch (e) {
            return null;
        }
    }

    function getClass(classname) {
        var cls = ClassManager.getClass(classname);
        if (cls) { return cls; }
        cls = getter(classname);
        if (typeof(cls) === 'function') {
            ClassManager.register(cls, classname);
            return cls;
        }
        var poslist = [];
        var pos = classname.indexOf('_');
        while (pos >= 0) {
            poslist[poslist.length] = pos;
            pos = classname.indexOf('_', pos + 1);
        }
        if (poslist.length > 0) {
            var cn = classname.split('');
            cls = findClass(cn, poslist, 0, '.');
            if (cls === null) {
                cls = findClass(cn, poslist, 0, '_');
            }
            if (typeof(cls) === 'function') {
                ClassManager.register(cls, classname);
                return cls;
            }
        }
        cls = function () {};
        defineProperty(cls.prototype, 'getClassName', { value: function () {
            return classname;
        }});
        ClassManager.register(cls, classname);
        return cls;
    }

    function readInt(stream, tag) {
        var s = stream.readUntil(tag);
        if (s.length === 0) return 0;
        return parseInt(s, 10);
    }

    function unserialize(reader) {
        var stream = reader.stream;
        var tag = stream.readChar();
        switch (tag) {
            case '0': return 0;
            case '1': return 1;
            case '2': return 2;
            case '3': return 3;
            case '4': return 4;
            case '5': return 5;
            case '6': return 6;
            case '7': return 7;
            case '8': return 8;
            case '9': return 9;
            case Tags.TagInteger: return readIntegerWithoutTag(stream);
            case Tags.TagLong: return readLongWithoutTag(stream);
            case Tags.TagDouble: return readDoubleWithoutTag(stream);
            case Tags.TagNull: return null;
            case Tags.TagEmpty: return '';
            case Tags.TagTrue: return true;
            case Tags.TagFalse: return false;
            case Tags.TagNaN: return NaN;
            case Tags.TagInfinity: return readInfinityWithoutTag(stream);
            case Tags.TagDate: return readDateWithoutTag(reader);
            case Tags.TagTime: return readTimeWithoutTag(reader);
            case Tags.TagBytes: return readBinaryWithoutTag(reader);
            case Tags.TagUTF8Char: return readUTF8CharWithoutTag(reader);
            case Tags.TagString: return readStringWithoutTag(reader);
            case Tags.TagGuid: return readGuidWithoutTag(reader);
            case Tags.TagList: return readListWithoutTag(reader);
            case Tags.TagMap: return reader.useHarmonyMap ? readHarmonyMapWithoutTag(reader) : readMapWithoutTag(reader);
            case Tags.TagClass: readClass(reader); return readObject(reader);
            case Tags.TagObject: return readObjectWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            case Tags.TagError: throw new Error(readString(reader));
            default: unexpectedTag(tag);
        }
    }
    function readIntegerWithoutTag(stream) {
        return readInt(stream, Tags.TagSemicolon);
    }
    function readInteger(stream) {
        var tag = stream.readChar();
        switch (tag) {
            case '0': return 0;
            case '1': return 1;
            case '2': return 2;
            case '3': return 3;
            case '4': return 4;
            case '5': return 5;
            case '6': return 6;
            case '7': return 7;
            case '8': return 8;
            case '9': return 9;
            case Tags.TagInteger: return readIntegerWithoutTag(stream);
            default: unexpectedTag(tag);
        }
    }
    function readLongWithoutTag(stream) {
        var s = stream.readUntil(Tags.TagSemicolon);
        var l = parseInt(s, 10);
        if (l.toString() === s) return l;
        return s;
    }
    function readLong(stream) {
        var tag = stream.readChar();
        switch (tag) {
            case '0': return 0;
            case '1': return 1;
            case '2': return 2;
            case '3': return 3;
            case '4': return 4;
            case '5': return 5;
            case '6': return 6;
            case '7': return 7;
            case '8': return 8;
            case '9': return 9;
            case Tags.TagInteger:
            case Tags.TagLong: return readLongWithoutTag(stream);
            default: unexpectedTag(tag);
        }
    }
    function readDoubleWithoutTag(stream) {
        return parseFloat(stream.readUntil(Tags.TagSemicolon));
    }
    function readDouble(stream) {
        var tag = stream.readChar();
        switch (tag) {
            case '0': return 0;
            case '1': return 1;
            case '2': return 2;
            case '3': return 3;
            case '4': return 4;
            case '5': return 5;
            case '6': return 6;
            case '7': return 7;
            case '8': return 8;
            case '9': return 9;
            case Tags.TagInteger:
            case Tags.TagLong:
            case Tags.TagDouble: return readDoubleWithoutTag(stream);
            case Tags.TagNaN: return NaN;
            case Tags.TagInfinity: return readInfinityWithoutTag(stream);
            default: unexpectedTag(tag);
        }
    }
    function readInfinityWithoutTag(stream) {
        return ((stream.readChar() === Tags.TagNeg) ? -Infinity : Infinity);
    }
    function readBoolean(stream) {
        var tag = stream.readChar();
        switch (tag) {
            case Tags.TagTrue: return true;
            case Tags.TagFalse: return false;
            default: unexpectedTag(tag);
        }
    }
    function readDateWithoutTag(reader) {
        var stream = reader.stream;
        var year = parseInt(stream.read(4), 10);
        var month = parseInt(stream.read(2), 10) - 1;
        var day = parseInt(stream.read(2), 10);
        var date;
        var tag = stream.readChar();
        if (tag === Tags.TagTime) {
            var hour = parseInt(stream.read(2), 10);
            var minute = parseInt(stream.read(2), 10);
            var second = parseInt(stream.read(2), 10);
            var millisecond = 0;
            tag = stream.readChar();
            if (tag === Tags.TagPoint) {
                millisecond = parseInt(stream.read(3), 10);
                tag = stream.readChar();
                if ((tag >= 48) && (tag <= 57)) {
                    stream.skip(2);
                    tag = stream.readChar();
                    if ((tag >= 48) && (tag <= 57)) {
                        stream.skip(2);
                        tag = stream.readChar();
                    }
                }
            }
            if (tag === Tags.TagUTC) {
                date = new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
            }
            else {
                date = new Date(year, month, day, hour, minute, second, millisecond);
            }
        }
        else if (tag === Tags.TagUTC) {
            date = new Date(Date.UTC(year, month, day));
        }
        else {
            date = new Date(year, month, day);
        }
        reader.refer.set(date);
        return date;
    }
    function readDate(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagDate: return readDateWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readTimeWithoutTag(reader) {
        var stream = reader.stream;
        var time;
        var hour = parseInt(stream.read(2), 10);
        var minute = parseInt(stream.read(2), 10);
        var second = parseInt(stream.read(2), 10);
        var millisecond = 0;
        var tag = stream.readChar();
        if (tag === Tags.TagPoint) {
            millisecond = parseInt(stream.read(3), 10);
            tag = stream.readChar();
            if ((tag >= 48) && (tag <= 57)) {
                stream.skip(2);
                tag = stream.readChar();
                if ((tag >= 48) && (tag <= 57)) {
                    stream.skip(2);
                    tag = stream.readChar();
                }
            }
        }
        if (tag === Tags.TagUTC) {
            time = new Date(Date.UTC(1970, 0, 1, hour, minute, second, millisecond));
        }
        else {
            time = new Date(1970, 0, 1, hour, minute, second, millisecond);
        }
        reader.refer.set(time);
        return time;
    }
    function readTime(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagTime: return readTimeWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readBinaryWithoutTag(reader) {
        if (!reader.binary) {
            throw new Error('The binary string does not support to unserialize in text mode.');
        }
        var stream = reader.stream;
        var count = readInt(stream, Tags.TagQuote);
        var bs = new BinaryString(stream.read(count));
        stream.skip(1);
        reader.refer.set(bs);
        return bs;
    }
    function readBinary(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagEmpty: return new BinaryString('');
            case Tags.TagBytes: return readBinaryWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readUTF8CharWithoutTag(reader) {
        if (reader.binary) {
            return reader.stream.readUTF8(1);
        }
        return reader.stream.read(1);
    }
    function _readString(reader) {
        var stream = reader.stream;
        var count = readInt(stream, Tags.TagQuote);
        var s;
        if (reader.binary) {
            s = stream.readUTF8(count);
        }
        else {
            s = stream.read(count);
        }
        stream.skip(1);
        return s;
    }
    function readStringWithoutTag(reader) {
        var s = _readString(reader);
        reader.refer.set(s);
        return s;
    }
    function readString(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagEmpty: return '';
            case Tags.TagUTF8Char: return readUTF8CharWithoutTag(reader);
            case Tags.TagString: return readStringWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readGuidWithoutTag(reader) {
        var stream = reader.stream;
        stream.skip(1);
        var s = stream.read(36);
        stream.skip(1);
        reader.refer.set(s);
        return s;
    }
    function readGuid(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagGuid: return readGuidWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readListWithoutTag(reader) {
        var stream = reader.stream;
        var list = [];
        reader.refer.set(list);
        var count = readInt(stream, Tags.TagOpenbrace);
        for (var i = 0; i < count; i++) {
            list[i] = unserialize(reader);
        }
        stream.skip(1);
        return list;
    }
    function readList(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagList: return readListWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readMapWithoutTag(reader) {
        var stream = reader.stream;
        var map = {};
        reader.refer.set(map);
        var count = readInt(stream, Tags.TagOpenbrace);
        for (var i = 0; i < count; i++) {
            var key = unserialize(reader);
            var value = unserialize(reader);
            map[key] = value;
        }
        stream.skip(1);
        return map;
    }
    function readMap(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagMap: return readMapWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readHarmonyMapWithoutTag(reader) {
        var stream = reader.stream;
        var map = new Map();
        reader.refer.set(map);
        var count = readInt(stream, Tags.TagOpenbrace);
        for (var i = 0; i < count; i++) {
            var key = unserialize(reader);
            var value = unserialize(reader);
            map.set(key, value);
        }
        stream.skip(1);
        return map;
    }
    function readHarmonyMap(reader) {
        var tag = reader.stream.readChar();
        switch (tag) {
            case Tags.TagNull: return null;
            case Tags.TagMap: return readHarmonyMapWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readObjectWithoutTag(reader) {
        var stream = reader.stream;
        var cls = reader.classref[readInt(stream, Tags.TagOpenbrace)];
        var obj = new cls.classname();
        reader.refer.set(obj);
        for (var i = 0; i < cls.count; i++) {
            obj[cls.fields[i]] = unserialize(reader);
        }
        stream.skip(1);
        return obj;
    }
    function readObject(reader) {
        var tag = reader.stream.readChar();
        switch(tag) {
            case Tags.TagNull: return null;
            case Tags.TagClass: readClass(reader); return readObject(reader);
            case Tags.TagObject: return readObjectWithoutTag(reader);
            case Tags.TagRef: return readRef(reader);
            default: unexpectedTag(tag);
        }
    }
    function readClass(reader) {
        var stream = reader.stream;
        var classname = _readString(reader);
        var count = readInt(stream, Tags.TagOpenbrace);
        var fields = [];
        for (var i = 0; i < count; i++) {
            fields[i] = readString(reader);
        }
        stream.skip(1);
        classname = getClass(classname);
        reader.classref.push({
            classname: classname,
            count: count,
            fields: fields
        });
    }
    function readRef(reader) {
        return reader.refer.read(readInt(reader.stream, Tags.TagSemicolon));
    }

    function Reader(stream, simple, useHarmonyMap, binary) {
        RawReader.call(this, stream, binary);
        this.useHarmonyMap = !!useHarmonyMap;
        defineProperties(this, {
            classref: { value: [] },
            refer: { value: simple ? fakeReaderRefer : realReaderRefer() }
        });
    }

    Reader.prototype = createObject(RawReader.prototype);
    Reader.prototype.constructor = Reader;

    defineProperties(Reader.prototype, {
        useHarmonyMap: { value: false, writable: true },
        checkTag: { value: function(expectTag, tag) {
            if (tag === undefined) tag = this.stream.readChar();
            if (tag !== expectTag) unexpectedTag(tag, expectTag);
        } },
        checkTags: { value: function(expectTags, tag) {
            if (tag === undefined) tag = this.stream.readChar();
            if (expectTags.indexOf(tag) >= 0) return tag;
            unexpectedTag(tag, expectTags);
        } },
        unserialize: { value: function() {
            return unserialize(this);
        } },
        readInteger: { value: function() {
            return readInteger(this.stream);
        } },
        readLong: { value: function() {
            return readLong(this.stream);
        } },
        readDouble: { value: function() {
            return readDouble(this.stream);
        } },
        readBoolean: { value: function() {
            return readBoolean(this.stream);
        } },
        readDateWithoutTag: { value: function() {
            return readDateWithoutTag(this);
        } },
        readDate: { value: function() {
            return readDate(this);
        } },
        readTimeWithoutTag: { value: function() {
            return readTimeWithoutTag(this);
        } },
        readTime: { value: function() {
            return readTime(this);
        } },
        readBinaryWithoutTag: { value: function() {
            return readBinaryWithoutTag(this);
        } },
        readBinary: { value: function() {
            return readBinary(this);
        } },
        readStringWithoutTag: { value: function() {
            return readStringWithoutTag(this);
        } },
        readString: { value: function() {
            return readString(this);
        } },
        readGuidWithoutTag: { value: function() {
            return readGuidWithoutTag(this);
        } },
        readGuid: { value: function() {
            return readGuid(this);
        } },
        readListWithoutTag: { value: function() {
            return readListWithoutTag(this);
        } },
        readList: { value: function() {
            return readList(this);
        } },
        readMapWithoutTag: { value: function() {
            return this.useHarmonyMap ?
                   readHarmonyMapWithoutTag(this) :
                   readMapWithoutTag(this);
        } },
        readMap: { value: function() {
            return this.useHarmonyMap ?
                   readHarmonyMap(this) :
                   readMap(this);
        } },
        readObjectWithoutTag: { value: function() {
            return readObjectWithoutTag(this);
        } },
        readObject: { value: function() {
            return readObject(this);
        } },
        reset: { value: function() {
            this.classref.length = 0;
            this.refer.reset();
        } }
    });

    global.HproseReader = global.hprose.Reader = Reader;
})(this);
