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
 * hproseIO.js                                            *
 *                                                        *
 * hprose io stream library for JavaScript.               *
 *                                                        *
 * LastModified: Mar 29, 2014                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseException, WeakMap, Map */
/*jshint es3:true, unused:false, eqeqeq:true */
/*jslint plusplus:true, white:true, vars:true */

function HproseStringInputStream(str) {
    'use strict';
    var pos = 0, length = str.length;
    this.getc = function () {
        return str.charAt(pos++);
    };
    this.read = function (len) {
        var s = str.substr(pos, len);
        this.skip(len);
        return s;
    };
    this.skip = function (n) {
        pos += n;
    };
    this.readuntil = function (tag) {
        var p = str.indexOf(tag, pos), s;
        if (p >= 0) {
            s = str.substr(pos, p - pos);
            pos = p + tag.length;
        }
        else {
            s = str.substr(pos);
            pos = length;
        }
        return s;
    };
}

function HproseStringOutputStream(str) {
    'use strict';
    if (str === undefined) {
        str = '';
    }
    var buf = [str];
    this.write = function (s) {
        buf.push(s);
    };
    this.mark = function () {
        str = this.toString();
    };
    this.reset = function () {
        buf = [str];
    };
    this.clear = function () {
        buf = [];
    };
    this.toString = function () {
        return buf.join('');
    };
}

var HproseTags = {
    /* Serialize Tags */
    TagInteger: 'i',
    TagLong: 'l',
    TagDouble: 'd',
    TagNull: 'n',
    TagEmpty: 'e',
    TagTrue: 't',
    TagFalse: 'f',
    TagNaN: 'N',
    TagInfinity: 'I',
    TagDate: 'D',
    TagTime: 'T',
    TagUTC: 'Z',
/*  TagBytes: 'b', */ // Not support bytes in JavaScript.
    TagUTF8Char: 'u',
    TagString: 's',
    TagGuid: 'g',
    TagList: 'a',
    TagMap: 'm',
    TagClass: 'c',
    TagObject: 'o',
    TagRef: 'r',
    /* Serialize Marks */
    TagPos: '+',
    TagNeg: '-',
    TagSemicolon: ';',
    TagOpenbrace: '{',
    TagClosebrace: '}',
    TagQuote: '"',
    TagPoint: '.',
    /* Protocol Tags */
    TagFunctions: 'F',
    TagCall: 'C',
    TagResult: 'R',
    TagArgument: 'A',
    TagError: 'E',
    TagEnd: 'z'
};

var HproseClassManager = (function () {
    'use strict';
    var classCache = {};
    var aliasCache = new WeakMap();
    var cm = {
        register: function (cls, alias) {
            aliasCache.set(cls, alias);
            classCache[alias] = cls;
        },
        getClassAlias: function (cls) {
            return aliasCache.get(cls);
        },
        getClass: function (alias) {
            return classCache[alias];
        }
    };
    cm.register(Object, 'Object');
    return cm;
})();

var HproseRawReader, HproseReader, HproseWriter;
(function (global) {
    'use strict';
    // private static members
    var hproseTags = HproseTags;
    var hproseClassManager = HproseClassManager;
    var HException = HproseException;

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
        var cls = hproseClassManager.getClass(classname);
        if (cls) { return cls; }
        cls = getter(classname);
        if (typeof(cls) === 'function') {
            hproseClassManager.register(cls, classname);
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
                hproseClassManager.register(cls, classname);
                return cls;
            }
        }
        cls = function () {
            this.getClassName = function () {
                return classname;
            };
        };
        hproseClassManager.register(cls, classname);
        return cls;
    }

    function isNegZero(value) {
        return (value === 0 && 1/value === -Infinity);
    }

    function getClassName(obj) {
        if (obj === undefined || obj.constructor === undefined) { return ''; }
        var cls = obj.constructor;
        var classname = hproseClassManager.getClassAlias(cls);
        if (classname) { return classname; }
        var ctor = cls.toString();
        classname = ctor.substr(0, ctor.indexOf('(')).replace(/(^\s*function\s*)|(\s*$)/ig, '');
        if (classname === '' || classname === 'Object') {
            return (typeof(obj.getClassName) === 'function') ? obj.getClassName() : 'Object';
        }
        if (classname !== 'Object') {
            hproseClassManager.register(cls, classname);
        }
        return classname;
    }

    function unexpectedTag(tag, expectTags) {
        if (tag && expectTags) {
            throw new HException('Tag "' + expectTags + '" expected, but "' + tag + '" found in stream');
        }
        if (tag) {
            throw new HException('Unexpected serialize tag "' + tag + '" in stream');
        }
        throw new HException('No byte found in stream');
    }

    // public class
    HproseRawReader = function hproseRawReader(stream) {
        function readRaw(ostream, tag) {
            if (ostream === undefined) { ostream = new HproseStringOutputStream(); }
            if (tag === undefined) { tag = stream.getc(); }
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
            case hproseTags.TagNull:
            case hproseTags.TagEmpty:
            case hproseTags.TagTrue:
            case hproseTags.TagFalse:
            case hproseTags.TagNaN:
                break;
            case hproseTags.TagInfinity:
            case hproseTags.TagUTF8Char:
                ostream.write(stream.getc());
                break;
            case hproseTags.TagInteger:
            case hproseTags.TagLong:
            case hproseTags.TagDouble:
            case hproseTags.TagRef:
                readNumberRaw(ostream);
                break;
            case hproseTags.TagDate:
            case hproseTags.TagTime:
                readDateTimeRaw(ostream);
                break;
            case hproseTags.TagString:
                readStringRaw(ostream);
                break;
            case hproseTags.TagGuid:
                readGuidRaw(ostream);
                break;
            case hproseTags.TagList:
            case hproseTags.TagMap:
            case hproseTags.TagObject:
                readComplexRaw(ostream);
                break;
            case hproseTags.TagClass:
                readComplexRaw(ostream);
                readRaw(ostream);
                break;
            case hproseTags.TagError:
                readRaw(ostream);
                break;
            default: unexpectedTag(tag);
            }
            return ostream;
        }
        function readNumberRaw(ostream) {
            var tag;
            do {
                tag = stream.getc();
                ostream.write(tag);
            } while (tag !== hproseTags.TagSemicolon);
        }
        function readDateTimeRaw(ostream) {
            var tag;
            do {
                tag = stream.getc();
                ostream.write(tag);
            } while (tag !== hproseTags.TagSemicolon &&
                     tag !== hproseTags.TagUTC);
        }
        function readStringRaw(ostream) {
            var s = stream.readuntil(hproseTags.TagQuote);
            ostream.write(s);
            ostream.write(hproseTags.TagQuote);
            var len = 0;
            if (s.length > 0) { len = parseInt(s, 10); }
            ostream.write(stream.read(len + 1));
        }
        function readGuidRaw(ostream) {
            ostream.write(stream.read(38));
        }
        function readComplexRaw(ostream) {
            var tag;
            do {
                tag = stream.getc();
                ostream.write(tag);
            } while (tag !== hproseTags.TagOpenbrace);
            while ((tag = stream.getc()) !== hproseTags.TagClosebrace) {
                readRaw(ostream, tag);
            }
            ostream.write(tag);
        }
        this.readRaw = readRaw;
    };

    var fakeReaderRefer = {
        set: function () {},
        read: function () {
            unexpectedTag(hproseTags.TagRef);
        },
        reset: function () {}
    };

    function realReaderRefer() {
        var ref = [];
        return {
            set: function (val) {
                ref[ref.length] = val;
            },
            read: function (index) {
                return ref[index];
            },
            reset: function () {
                ref.length = 0;
            }
        };
    }

    // public class
    HproseReader = function hproseReader(stream, simple, useHarmonyMap) {
        HproseRawReader.call(this, stream);
        var classref = [];
        var refer = (simple ? fakeReaderRefer : realReaderRefer());
        function checkTag(expectTag, tag) {
            if (tag === undefined) tag = stream.getc();
            if (tag !== expectTag) unexpectedTag(tag, expectTag);
        }
        function checkTags(expectTags, tag) {
            if (tag === undefined) tag = stream.getc();
            if (expectTags.indexOf(tag) >= 0) return tag;
            unexpectedTag(tag, expectTags);
        }
        function readInt(tag) {
            var s = stream.readuntil(tag);
            if (s.length === 0) return 0;
            return parseInt(s, 10);
        }
        function unserialize() {
            var tag = stream.getc();
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
            case hproseTags.TagInteger: return readIntegerWithoutTag();
            case hproseTags.TagLong: return readLongWithoutTag();
            case hproseTags.TagDouble: return readDoubleWithoutTag();
            case hproseTags.TagNull: return null;
            case hproseTags.TagEmpty: return '';
            case hproseTags.TagTrue: return true;
            case hproseTags.TagFalse: return false;
            case hproseTags.TagNaN: return NaN;
            case hproseTags.TagInfinity: return readInfinityWithoutTag();
            case hproseTags.TagDate: return readDateWithoutTag();
            case hproseTags.TagTime: return readTimeWithoutTag();
            case hproseTags.TagUTF8Char: return stream.getc();
            case hproseTags.TagString: return readStringWithoutTag();
            case hproseTags.TagGuid: return readGuidWithoutTag();
            case hproseTags.TagList: return readListWithoutTag();
            case hproseTags.TagMap: return useHarmonyMap ? readHarmonyMapWithoutTag() : readMapWithoutTag();
            case hproseTags.TagClass: readClass(); return readObject();
            case hproseTags.TagObject: return readObjectWithoutTag();
            case hproseTags.TagRef: return readRef();
            case hproseTags.TagError: throw new HException(readString());
            default: unexpectedTag(tag);
            }
        }
        function readIntegerWithoutTag() {
            return readInt(hproseTags.TagSemicolon);
        }
        function readInteger() {
            var tag = stream.getc();
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
            case hproseTags.TagInteger: return readIntegerWithoutTag();
            default: unexpectedTag(tag);
            }
        }
        function readLongWithoutTag() {
            var s = stream.readuntil(hproseTags.TagSemicolon);
            var l = parseInt(s, 10);
            if (l.toString() === s) return l;
            return s;
        }
        function readLong() {
            var tag = stream.getc();
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
            case hproseTags.TagInteger:
            case hproseTags.TagLong: return readLongWithoutTag();
            default: unexpectedTag(tag);
            }
        }
        function readDoubleWithoutTag() {
            return parseFloat(stream.readuntil(hproseTags.TagSemicolon));
        }
        function readDouble() {
            var tag = stream.getc();
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
            case hproseTags.TagInteger:
            case hproseTags.TagLong:
            case hproseTags.TagDouble: return readDoubleWithoutTag();
            case hproseTags.TagNaN: return NaN;
            case hproseTags.TagInfinity: return readInfinityWithoutTag();
            default: unexpectedTag(tag);
            }
        }
        function readInfinityWithoutTag() {
            return ((stream.getc() === hproseTags.TagNeg) ? -Infinity : Infinity);
        }
        function readBoolean() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagTrue: return true;
            case hproseTags.TagFalse: return false;
            default: unexpectedTag(tag);
            }
        }
        function readDateWithoutTag() {
            var year = parseInt(stream.read(4), 10);
            var month = parseInt(stream.read(2), 10) - 1;
            var day = parseInt(stream.read(2), 10);
            var date;
            var tag = stream.getc();
            if (tag === hproseTags.TagTime) {
                var hour = parseInt(stream.read(2), 10);
                var minute = parseInt(stream.read(2), 10);
                var second = parseInt(stream.read(2), 10);
                var millisecond = 0;
                tag = stream.getc();
                if (tag === hproseTags.TagPoint) {
                    millisecond = parseInt(stream.read(3), 10);
                    tag = stream.getc();
                    if ((tag >= '0') && (tag <= '9')) {
                        stream.skip(2);
                        tag = stream.getc();
                        if ((tag >= '0') && (tag <= '9')) {
                            stream.skip(2);
                            tag = stream.getc();
                        }
                    }
                }
                if (tag === hproseTags.TagUTC) {
                    date = new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
                }
                else {
                    date = new Date(year, month, day, hour, minute, second, millisecond);
                }
            }
            else if (tag === hproseTags.TagUTC) {
                date = new Date(Date.UTC(year, month, day));
            }
            else {
                date = new Date(year, month, day);
            }
            refer.set(date);
            return date;
        }
        function readDate() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagDate: return readDateWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function readTimeWithoutTag() {
            var time;
            var hour = parseInt(stream.read(2), 10);
            var minute = parseInt(stream.read(2), 10);
            var second = parseInt(stream.read(2), 10);
            var millisecond = 0;
            var tag = stream.getc();
            if (tag === hproseTags.TagPoint) {
                millisecond = parseInt(stream.read(3), 10);
                tag = stream.getc();
                if ((tag >= '0') && (tag <= '9')) {
                    stream.skip(2);
                    tag = stream.getc();
                    if ((tag >= '0') && (tag <= '9')) {
                        stream.skip(2);
                        tag = stream.getc();
                    }
                }
            }
            if (tag === hproseTags.TagUTC) {
                time = new Date(Date.UTC(1970, 0, 1, hour, minute, second, millisecond));
            }
            else {
                time = new Date(1970, 0, 1, hour, minute, second, millisecond);
            }
            refer.set(time);
            return time;
        }
        function readTime() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagTime: return readTimeWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function _readString() {
            var s = stream.read(readInt(hproseTags.TagQuote));
            stream.skip(1);
            return s;
        }
        function readStringWithoutTag() {
            var s = _readString();
            refer.set(s);
            return s;
        }
        function readString() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagEmpty: return '';
            case hproseTags.TagUTF8Char: return stream.getc();
            case hproseTags.TagString: return readStringWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function readGuidWithoutTag() {
            stream.skip(1);
            var s = stream.read(36);
            stream.skip(1);
            refer.set(s);
            return s;
        }
        function readGuid() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagGuid: return readGuidWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function readListWithoutTag() {
            var list = [];
            refer.set(list);
            var count = readInt(hproseTags.TagOpenbrace);
            for (var i = 0; i < count; i++) {
                list[i] = unserialize();
            }
            stream.skip(1);
            return list;
        }
        function readList() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagList: return readListWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function readMapWithoutTag() {
            var map = {};
            refer.set(map);
            var count = readInt(hproseTags.TagOpenbrace);
            for (var i = 0; i < count; i++) {
                var key = unserialize();
                var value = unserialize();
                map[key] = value;
            }
            stream.skip(1);
            return map;
        }
        function readMap() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagMap: return readMapWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function readHarmonyMapWithoutTag() {
            var map = new Map();
            refer.set(map);
            var count = readInt(hproseTags.TagOpenbrace);
            for (var i = 0; i < count; i++) {
                var key = unserialize();
                var value = unserialize();
                map.set(key, value);
            }
            stream.skip(1);
            return map;
        }
        function readHarmonyMap() {
            var tag = stream.getc();
            switch (tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagMap: return readHarmonyMapWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function readObjectWithoutTag() {
            var cls = classref[readInt(hproseTags.TagOpenbrace)];
            var obj = new cls.classname();
            refer.set(obj);
            for (var i = 0; i < cls.count; i++) {
                obj[cls.fields[i]] = unserialize();
            }
            stream.skip(1);
            return obj;
        }
        function readObject() {
            var tag = stream.getc();
            switch(tag) {
            case hproseTags.TagNull: return null;
            case hproseTags.TagClass: readClass(); return readObject();
            case hproseTags.TagObject: return readObjectWithoutTag();
            case hproseTags.TagRef: return readRef();
            default: unexpectedTag(tag);
            }
        }
        function readClass() {
            var classname = _readString();
            var count = readInt(hproseTags.TagOpenbrace);
            var fields = [];
            for (var i = 0; i < count; i++) {
                fields[i] = readString();
            }
            stream.skip(1);
            classname = getClass(classname);
            classref[classref.length] = {
                classname: classname,
                count: count,
                fields: fields
            };
        }
        function readRef() {
            return refer.read(readInt(hproseTags.TagSemicolon));
        }
        function reset() {
            classref.length = 0;
            refer.reset();
        }
        this.checkTag = checkTag;
        this.checkTags = checkTags;
        this.unserialize = unserialize;
        this.readInteger = readInteger;
        this.readLong = readLong;
        this.readDouble = readDouble;
        this.readBoolean = readBoolean;
        this.readDateWithoutTag = readDateWithoutTag;
        this.readDate = readDate;
        this.readTimeWithoutTag = readTimeWithoutTag;
        this.readTime = readTime;
        this.readStringWithoutTag = readStringWithoutTag;
        this.readString = readString;
        this.readGuidWithoutTag = readGuidWithoutTag;
        this.readGuid = readGuid;
        this.readListWithoutTag = readListWithoutTag;
        this.readList = readList;
        this.readMapWithoutTag = readMapWithoutTag;
        this.readMap = readMap;
        this.readHarmonyMapWithoutTag = readHarmonyMapWithoutTag;
        this.readHarmonyMap = readHarmonyMap;
        this.readObjectWithoutTag = readObjectWithoutTag;
        this.readObject = readObject;
        this.reset = reset;
    };

    var fakeWriterRefer = {
        set: function () {},
        write: function () { return false; },
        reset: function () {}
    };

    var realWriterRefer = function (stream) {
        var ref = new Map();
        var refcount = 0;
        return {
            set: function (val) {
                ref.set(val, refcount++);
            },
            write: function (val) {
                var index = ref.get(val);
                if (index !== undefined) {
                    stream.write(hproseTags.TagRef + index + hproseTags.TagSemicolon);
                    return true;
                }
                return false;
            },
            reset: function () {
                ref = new Map();
                refcount = 0;
            }
        };
    };

    // public class
    HproseWriter = function hproseWriter(stream, simple) {
        var classref = {};
        var fieldsref = [];
        var refer = (simple ? fakeWriterRefer : realWriterRefer(stream));
        function serialize(variable) {
            if (variable === undefined ||
                variable === null ||
                variable.constructor === Function) {
                writeNull();
                return;
            }
            if (variable === '') {
                writeEmpty();
                return;
            }
            switch (variable.constructor) {
            case Boolean:
                writeBoolean(variable);
                break;
            case Number:
                writeNumber(variable);
                break;
            case String:
                if (variable.length === 1) {
                    writeUTF8Char(variable);
                }
                else {
                    writeStringWithRef(variable);
                }
                break;
            case Date:
                writeDateWithRef(variable);
                break;
            case Map:
                writeHarmonyMapWithRef(variable);
                break;
            default:
                if (Array.isArray(variable)) {
                    writeListWithRef(variable);
                }
                else {
                    var classname = getClassName(variable);
                    if (classname === 'Object') {
                        writeMapWithRef(variable);
                    }
                    else {
                        writeObjectWithRef(variable);
                    }
                }
                break;
            }
        }
        function writeNumber(n) {
            n = n.valueOf();
            if (isNegZero(n)) {
                stream.write(hproseTags.TagInteger + '-0' + hproseTags.TagSemicolon);
            }
            else if (n === (n | 0)) {
                if (0 <= n && n <= 9) {
                    stream.write('' + n);
                }
                else {
                    stream.write(hproseTags.TagInteger + n + hproseTags.TagSemicolon);
                }
            }
            else {
                writeDouble(n);
            }
        }
        function writeInteger(i) {
            if (0 <= i && i <= 9) {
                stream.write('' + i);
            }
            else {
                if (i < -2147483648 || i > 2147483647) {
                    stream.write(hproseTags.TagLong);
                }
                else {
                    stream.write(hproseTags.TagInteger);
                }
                stream.write('' + i + hproseTags.TagSemicolon);
            }
        }
        function writeDouble(d) {
            if (isNaN(d)) {
                writeNaN();
            }
            else if (isFinite(d)) {
                if (isNegZero(d)) {
                    d = '-0';
                }
                stream.write(hproseTags.TagDouble + d + hproseTags.TagSemicolon);
            }
            else {
                writeInfinity(d > 0);
            }
        }
        function writeNaN() {
            stream.write(hproseTags.TagNaN);
        }
        function writeInfinity(positive) {
            stream.write(hproseTags.TagInfinity + (positive ?
                                                   hproseTags.TagPos :
                                                   hproseTags.TagNeg));
        }
        function writeNull() {
            stream.write(hproseTags.TagNull);
        }
        function writeEmpty() {
            stream.write(hproseTags.TagEmpty);
        }
        function writeBoolean(b) {
            stream.write(b.valueOf() ? hproseTags.TagTrue : hproseTags.TagFalse);
        }
        function writeUTCDate(date) {
            refer.set(date);
            var year = ('0000' + date.getUTCFullYear()).slice(-4);
            var month = ('00' + (date.getUTCMonth() + 1)).slice(-2);
            var day = ('00' + date.getUTCDate()).slice(-2);
            var hour = ('00' + date.getUTCHours()).slice(-2);
            var minute = ('00' + date.getUTCMinutes()).slice(-2);
            var second = ('00' + date.getUTCSeconds()).slice(-2);
            var millisecond = ('000' + date.getUTCMilliseconds()).slice(-3);
            stream.write(hproseTags.TagDate + year + month + day +
                         hproseTags.TagTime + hour + minute + second);
            if (millisecond !== '000') {
                stream.write(hproseTags.TagPoint + millisecond);
            }
            stream.write(hproseTags.TagUTC);
        }
        function writeUTCDateWithRef(date) {
            if (!refer.write(date)) writeUTCDate(date);
        }
        function writeDate(date) {
            refer.set(date);
            var year = ('0000' + date.getFullYear()).slice(-4);
            var month = ('00' + (date.getMonth() + 1)).slice(-2);
            var day = ('00' + date.getDate()).slice(-2);
            var hour = ('00' + date.getHours()).slice(-2);
            var minute = ('00' + date.getMinutes()).slice(-2);
            var second = ('00' + date.getSeconds()).slice(-2);
            var millisecond = ('000' + date.getMilliseconds()).slice(-3);
            if ((hour === '00') && (minute === '00') &&
                (second === '00') && (millisecond === '000')) {
                stream.write(hproseTags.TagDate + year + month + day);
            }
            else if ((year === '1970') && (month === '01') && (day === '01')) {
                stream.write(hproseTags.TagTime + hour + minute + second);
                if (millisecond !== '000') {
                    stream.write(hproseTags.TagPoint + millisecond);
                }
            }
            else {
                stream.write(hproseTags.TagDate + year + month + day +
                             hproseTags.TagTime + hour + minute + second);
                if (millisecond !== '000') {
                    stream.write(hproseTags.TagPoint + millisecond);
                }
            }
            stream.write(hproseTags.TagSemicolon);
        }
        function writeDateWithRef(date) {
            if (!refer.write(date)) writeDate(date);
        }
        function writeTime(time) {
            refer.set(time);
            var hour = ('00' + time.getHours()).slice(-2);
            var minute = ('00' + time.getMinutes()).slice(-2);
            var second = ('00' + time.getSeconds()).slice(-2);
            var millisecond = ('000' + time.getMilliseconds()).slice(-3);
            stream.write(hproseTags.TagTime + hour + minute + second);
            if (millisecond !== '000') {
                stream.write(hproseTags.TagPoint + millisecond);
            }
            stream.write(hproseTags.TagSemicolon);
        }
        function writeTimeWithRef(time) {
            if (!refer.write(time)) writeTime(time);
        }
        function writeUTF8Char(c) {
            stream.write(hproseTags.TagUTF8Char + c);
        }
        function writeString(str) {
            refer.set(str);
            stream.write(hproseTags.TagString +
                (str.length > 0 ? str.length : '') +
                hproseTags.TagQuote + str + hproseTags.TagQuote);
        }
        function writeStringWithRef(str) {
            if (!refer.write(str)) writeString(str);
        }
        function writeList(list) {
            refer.set(list);
            var count = list.length;
            stream.write(hproseTags.TagList + (count > 0 ? count : '') + hproseTags.TagOpenbrace);
            for (var i = 0; i < count; i++) {
                serialize(list[i]);
            }
            stream.write(hproseTags.TagClosebrace);
        }
        function writeListWithRef(list) {
            if (!refer.write(list)) writeList(list);
        }
        function writeMap(map) {
            refer.set(map);
            var fields = [];
            for (var key in map) {
                if (map.hasOwnProperty(key) && typeof(map[key]) !== 'function') {
                    fields[fields.length] = key;
                }
            }
            var count = fields.length;
            stream.write(hproseTags.TagMap + (count > 0 ? count : '') + hproseTags.TagOpenbrace);
            for (var i = 0; i < count; i++) {
                serialize(fields[i]);
                serialize(map[fields[i]]);
            }
            stream.write(hproseTags.TagClosebrace);
        }
        function writeMapWithRef(map) {
            if (!refer.write(map)) writeMap(map);
        }
        function writeHarmonyMap(map) {
            refer.set(map);
            var count = map.size;
            stream.write(hproseTags.TagMap + (count > 0 ? count : '') + hproseTags.TagOpenbrace);
            map.forEach(function(value, key) {
                serialize(key);
                serialize(value);
            });
            stream.write(hproseTags.TagClosebrace);
        }
        function writeHarmonyMapWithRef(map) {
            if (!refer.write(map)) writeHarmonyMap(map);
        }
        function writeObject(obj) {
            var classname = getClassName(obj);
            var index = classref[classname];
            var fields;
            if (index !== undefined) {
                fields = fieldsref[index];
            }
            else {
                fields = [];
                for (var key in obj) {
                    if (obj.hasOwnProperty(key) &&
                        typeof(obj[key]) !== 'function') {
                        fields[fields.length] = key.toString();
                    }
                }
                index = writeClass(classname, fields);
            }
            stream.write(hproseTags.TagObject + index + hproseTags.TagOpenbrace);
            refer.set(obj);
            var count = fields.length;
            for (var i = 0; i < count; i++) {
                serialize(obj[fields[i]]);
            }
            stream.write(hproseTags.TagClosebrace);
        }
        function writeObjectWithRef(obj) {
            if (!refer.write(obj)) writeObject(obj);
        }
        function writeClass(classname, fields) {
            var count = fields.length;
            stream.write(hproseTags.TagClass + classname.length +
                         hproseTags.TagQuote + classname + hproseTags.TagQuote +
                         (count > 0 ? count : '') + hproseTags.TagOpenbrace);
            for (var i = 0; i < count; i++) {
                writeString(fields[i]);
            }
            stream.write(hproseTags.TagClosebrace);
            var index = fieldsref.length;
            classref[classname] = index;
            fieldsref[index] = fields;
            return index;
        }
        function reset() {
            classref = {};
            fieldsref.length = 0;
            refer.reset();
        }
        this.serialize = serialize;
        this.writeInteger = writeInteger;
        this.writeDouble = writeDouble;
        this.writeBoolean = writeBoolean;
        this.writeUTCDate = writeUTCDate;
        this.writeUTCDateWithRef = writeUTCDateWithRef;
        this.writeDate = writeDate;
        this.writeDateWithRef = writeDateWithRef;
        this.writeTime = writeTime;
        this.writeTimeWithRef = writeTimeWithRef;
        this.writeUTF8Char = writeUTF8Char;
        this.writeString = writeString;
        this.writeStringWithRef = writeStringWithRef;
        this.writeList = writeList;
        this.writeListWithRef = writeListWithRef;
        this.writeMap = writeMap;
        this.writeMapWithRef = writeMapWithRef;
        this.writeHarmonyMap = writeHarmonyMap;
        this.writeHarmonyMapWithRef = writeHarmonyMapWithRef;
        this.writeObject = writeObject;
        this.writeObjectWithRef = writeObjectWithRef;
        this.reset = reset;
    };
})(window);

var HproseFormatter = {
    serialize: function (variable, simple) {
        'use strict';
        var stream = new HproseStringOutputStream();
        var writer = new HproseWriter(stream, simple);
        writer.serialize(variable);
        return stream.toString();
    },
    unserialize: function (variable_representation, simple, useHarmonyMap) {
        'use strict';
        var stream = new HproseStringInputStream(variable_representation);
        var reader = new HproseReader(stream, simple, useHarmonyMap);
        return reader.unserialize();
    }
};
