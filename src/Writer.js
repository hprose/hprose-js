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
 * Writer.js                                              *
 *                                                        *
 * hprose Writer for JavaScript.                          *
 *                                                        *
 * LastModified: Nov 18, 2016                              *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (hprose, global, undefined) {
    'use strict';

    var Map = global.Map;
    var StringIO = hprose.StringIO;
    var BinaryString = hprose.BinaryString;
    var Tags = hprose.Tags;
    var ClassManager = hprose.ClassManager;
    var defineProperties = hprose.defineProperties;
    var createObject = hprose.createObject;
    var utf8Encode = StringIO.utf8Encode;

    function getClassName(obj) {
        var cls = obj.constructor;
        var classname = ClassManager.getClassAlias(cls);
        if (classname) { return classname; }
        if (cls.name) {
            classname = cls.name;
        }
        else {
            var ctor = cls.toString();
            classname = ctor.substr(0, ctor.indexOf('(')).replace(/(^\s*function\s*)|(\s*$)/ig, '');
            if (classname === '' || classname === 'Object') {
                return (typeof(obj.getClassName) === 'function') ? obj.getClassName() : 'Object';
            }
        }
        if (classname !== 'Object') {
            ClassManager.register(cls, classname);
        }
        return classname;
    }

    var fakeWriterRefer = createObject(null, {
        set: { value: function () {} },
        write: { value: function () { return false; } },
        reset: { value: function () {} }
    });

    function RealWriterRefer(stream) {
        defineProperties(this, {
            _stream: { value: stream },
            _ref: { value: new Map(), writable: true }
        });
    }

    defineProperties(RealWriterRefer.prototype, {
        _refcount: { value: 0, writable: true },
        set: { value: function (val) {
            this._ref.set(val, this._refcount++);
        } },
        write: { value: function (val) {
            var index = this._ref.get(val);
            if (index !== undefined) {
                this._stream.write(Tags.TagRef);
                this._stream.write(index);
                this._stream.write(Tags.TagSemicolon);
                return true;
            }
            return false;
        } },
        reset: { value: function () {
            this._ref = new Map();
            this._refcount = 0;
        } }
    });

    function realWriterRefer(stream) {
        return new RealWriterRefer(stream);
    }

    function Writer(stream, simple, binary) {
        this.binary = !!binary;
        defineProperties(this, {
            stream: { value: stream },
            _classref: { value: createObject(null), writable: true },
            _fieldsref: { value: [], writable: true },
            _refer: { value: simple ? fakeWriterRefer : realWriterRefer(stream) }
        });
    }

    function serialize(writer, value) {
        var stream = writer.stream;
        if (value === undefined ||
            value === null ||
            value.constructor === Function) {
            stream.write(Tags.TagNull);
            return;
        }
        if (value === '') {
            stream.write(Tags.TagEmpty);
            return;
        }
        switch (value.constructor) {
        case Number:
            writeNumber(writer, value);
            break;
        case Boolean:
            writeBoolean(writer, value);
            break;
        case String:
            if (value.length === 1) {
                stream.write(Tags.TagUTF8Char);
                stream.write(writer.binary ? utf8Encode(value) : value);
            }
            else {
                writer.writeStringWithRef(value);
            }
            break;
        case BinaryString:
            if (writer.binary) {
                writer.writeBinaryWithRef(value);
            }
            else {
                throw new Error('The binary string does not support serialization in text mode.');
            }
            break;
        case Date:
            writer.writeDateWithRef(value);
            break;
        case Map:
            writer.writeMapWithRef(value);
            break;
        default:
            if (Array.isArray(value)) {
                writer.writeListWithRef(value);
            }
            else {
                var classname = getClassName(value);
                if (classname === 'Object') {
                    writer.writeMapWithRef(value);
                }
                else {
                    writer.writeObjectWithRef(value);
                }
            }
            break;
        }
    }

    function writeNumber(writer, n) {
        var stream = writer.stream;
        n = n.valueOf();
        if (n === (n | 0)) {
            if (0 <= n && n <= 9) {
                stream.write(n);
            }
            else {
                stream.write(Tags.TagInteger);
                stream.write(n);
                stream.write(Tags.TagSemicolon);
            }
        }
        else {
            writeDouble(writer, n);
        }
    }

    function writeInteger(writer, n) {
        var stream = writer.stream;
        if (0 <= n && n <= 9) {
            stream.write(n);
        }
        else {
            if (n < -2147483648 || n > 2147483647) {
                stream.write(Tags.TagLong);
            }
            else {
                stream.write(Tags.TagInteger);
            }
            stream.write(n);
            stream.write(Tags.TagSemicolon);
        }
    }

    function writeDouble(writer, n) {
        var stream = writer.stream;
        if (n !== n) {
            stream.write(Tags.TagNaN);
        }
        else if (n !== Infinity && n !== -Infinity) {
            stream.write(Tags.TagDouble);
            stream.write(n);
            stream.write(Tags.TagSemicolon);
        }
        else {
            stream.write(Tags.TagInfinity);
            stream.write((n > 0) ? Tags.TagPos : Tags.TagNeg);
        }
    }

    function writeBoolean(writer, b) {
        writer.stream.write(b.valueOf() ? Tags.TagTrue : Tags.TagFalse);
    }

    function writeUTCDate(writer, date) {
        writer._refer.set(date);
        var stream = writer.stream;
        stream.write(Tags.TagDate);
        stream.write(('0000' + date.getUTCFullYear()).slice(-4));
        stream.write(('00' + (date.getUTCMonth() + 1)).slice(-2));
        stream.write(('00' + date.getUTCDate()).slice(-2));
        stream.write(Tags.TagTime);
        stream.write(('00' + date.getUTCHours()).slice(-2));
        stream.write(('00' + date.getUTCMinutes()).slice(-2));
        stream.write(('00' + date.getUTCSeconds()).slice(-2));
        var millisecond = date.getUTCMilliseconds();
        if (millisecond !== 0) {
            stream.write(Tags.TagPoint);
            stream.write(('000' + millisecond).slice(-3));
        }
        stream.write(Tags.TagUTC);
    }

    function writeDate(writer, date) {
        writer._refer.set(date);
        var stream = writer.stream;
        var year = ('0000' + date.getFullYear()).slice(-4);
        var month = ('00' + (date.getMonth() + 1)).slice(-2);
        var day = ('00' + date.getDate()).slice(-2);
        var hour = ('00' + date.getHours()).slice(-2);
        var minute = ('00' + date.getMinutes()).slice(-2);
        var second = ('00' + date.getSeconds()).slice(-2);
        var millisecond = ('000' + date.getMilliseconds()).slice(-3);
        if ((hour === '00') && (minute === '00') &&
            (second === '00') && (millisecond === '000')) {
            stream.write(Tags.TagDate);
            stream.write(year);
            stream.write(month);
            stream.write(day);
        }
        else if ((year === '1970') && (month === '01') && (day === '01')) {
            stream.write(Tags.TagTime);
            stream.write(hour);
            stream.write(minute);
            stream.write(second);
            if (millisecond !== '000') {
                stream.write(Tags.TagPoint);
                stream.write(millisecond);
            }
        }
        else {
            stream.write(Tags.TagDate);
            stream.write(year);
            stream.write(month);
            stream.write(day);
            stream.write(Tags.TagTime);
            stream.write(hour);
            stream.write(minute);
            stream.write(second);
            if (millisecond !== '000') {
                stream.write(Tags.TagPoint);
                stream.write(millisecond);
            }
        }
        stream.write(Tags.TagSemicolon);
    }

    function writeTime(writer, time) {
        writer._refer.set(time);
        var stream = writer.stream;
        var hour = ('00' + time.getHours()).slice(-2);
        var minute = ('00' + time.getMinutes()).slice(-2);
        var second = ('00' + time.getSeconds()).slice(-2);
        var millisecond = ('000' + time.getMilliseconds()).slice(-3);
        stream.write(Tags.TagTime);
        stream.write(hour);
        stream.write(minute);
        stream.write(second);
        if (millisecond !== '000') {
            stream.write(Tags.TagPoint);
            stream.write(millisecond);
        }
        stream.write(Tags.TagSemicolon);
    }

    function writeBinary(writer, bs) {
        writer._refer.set(bs);
        var stream = writer.stream;
        stream.write(Tags.TagBytes);
        var n = bs.length;
        if (n > 0) {
            stream.write(n);
            stream.write(Tags.TagQuote);
            stream.write(bs);
        }
        else {
            stream.write(Tags.TagQuote);
        }
        stream.write(Tags.TagQuote);
    }

    function writeString(writer, str) {
        writer._refer.set(str);
        var stream = writer.stream;
        var n = str.length;
        stream.write(Tags.TagString);
        if (n > 0) {
            stream.write(n);
            stream.write(Tags.TagQuote);
            stream.write(writer.binary ? utf8Encode(str) : str);
        }
        else {
            stream.write(Tags.TagQuote);
        }
        stream.write(Tags.TagQuote);
    }

    function writeList(writer, array) {
        writer._refer.set(array);
        var stream = writer.stream;
        var n = array.length;
        stream.write(Tags.TagList);
        if (n > 0) {
            stream.write(n);
            stream.write(Tags.TagOpenbrace);
            for (var i = 0; i < n; i++) {
                serialize(writer, array[i]);
            }
        }
        else {
            stream.write(Tags.TagOpenbrace);
        }
        stream.write(Tags.TagClosebrace);
    }

    function writeMap(writer, map) {
        writer._refer.set(map);
        var stream = writer.stream;
        var fields = [];
        for (var key in map) {
            if (map.hasOwnProperty(key) &&
                typeof(map[key]) !== 'function') {
                fields[fields.length] = key;
            }
        }
        var n = fields.length;
        stream.write(Tags.TagMap);
        if (n > 0) {
            stream.write(n);
            stream.write(Tags.TagOpenbrace);
            for (var i = 0; i < n; i++) {
                serialize(writer, fields[i]);
                serialize(writer, map[fields[i]]);
            }
        }
        else {
            stream.write(Tags.TagOpenbrace);
        }
        stream.write(Tags.TagClosebrace);
    }

    function writeHarmonyMap(writer, map) {
        writer._refer.set(map);
        var stream = writer.stream;
        var n = map.size;
        stream.write(Tags.TagMap);
        if (n > 0) {
            stream.write(n);
            stream.write(Tags.TagOpenbrace);
            map.forEach(function(value, key) {
                serialize(writer, key);
                serialize(writer, value);
            });
        }
        else {
            stream.write(Tags.TagOpenbrace);
        }
        stream.write(Tags.TagClosebrace);
    }

    function writeObject(writer, obj) {
        var stream = writer.stream;
        var classname = getClassName(obj);
        var fields, index;
        if (classname in writer._classref) {
            index = writer._classref[classname];
            fields = writer._fieldsref[index];
        }
        else {
            fields = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key) &&
                    typeof(obj[key]) !== 'function') {
                    fields[fields.length] = key.toString();
                }
            }
            index = writeClass(writer, classname, fields);
        }
        stream.write(Tags.TagObject);
        stream.write(index);
        stream.write(Tags.TagOpenbrace);
        writer._refer.set(obj);
        var n = fields.length;
        for (var i = 0; i < n; i++) {
            serialize(writer, obj[fields[i]]);
        }
        stream.write(Tags.TagClosebrace);
    }

    function writeClass(writer, classname, fields) {
        var stream = writer.stream;
        var n = fields.length;
        stream.write(Tags.TagClass);
        stream.write(classname.length);
        stream.write(Tags.TagQuote);
        stream.write(writer.binary ? utf8Encode(classname) : classname);
        stream.write(Tags.TagQuote);
        if (n > 0) {
            stream.write(n);
            stream.write(Tags.TagOpenbrace);
            for (var i = 0; i < n; i++) {
                writeString(writer, fields[i]);
            }
        }
        else {
            stream.write(Tags.TagOpenbrace);
        }
        stream.write(Tags.TagClosebrace);
        var index = writer._fieldsref.length;
        writer._classref[classname] = index;
        writer._fieldsref[index] = fields;
        return index;
    }

    defineProperties(Writer.prototype, {
        binary: { value: false, writable: true },
        serialize: { value: function(value) {
            serialize(this, value);
        } },
        writeInteger: { value: function(value) {
            writeInteger(this, value);
        } },
        writeDouble: { value: function(value) {
            writeDouble(this, value);
        } },
        writeBoolean: { value: function(value) {
            writeBoolean(this, value);
        } },
        writeUTCDate: { value: function(value) {
            writeUTCDate(this, value);
        } },
        writeUTCDateWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                writeUTCDate(this, value);
            }
        } },
        writeDate: { value: function(value) {
            writeDate(this, value);
        } },
        writeDateWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                writeDate(this, value);
            }
        } },
        writeTime: { value: function(value) {
            writeTime(this, value);
        } },
        writeTimeWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                writeTime(this, value);
            }
        } },
        writeBinary: { value: function(value) {
            writeBinary(this, value);
        } },
        writeBinaryWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                writeBinary(this, value);
            }
        } },
        writeString: { value: function(value) {
            writeString(this, value);
        } },
        writeStringWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                writeString(this, value);
            }
        } },
        writeList: { value: function(value) {
            writeList(this, value);
        } },
        writeListWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                writeList(this, value);
            }
        } },
        writeMap: { value: function(value) {
            if (value instanceof Map) {
                writeHarmonyMap(this, value);
            }
            else {
                writeMap(this, value);
            }
        } },
        writeMapWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                this.writeMap(value);
            }
        } },
        writeObject: { value: function(value) {
            writeObject(this, value);
        } },
        writeObjectWithRef: { value: function(value) {
            if (!this._refer.write(value)) {
                writeObject(this, value);
            }
        } },
        reset: { value: function() {
            this._classref = createObject(null);
            this._fieldsref.length = 0;
            this._refer.reset();
        } }
    });

    global.HproseWriter = hprose.Writer = Writer;

})(hprose, hprose.global);
