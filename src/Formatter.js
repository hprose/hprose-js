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
 * Formatter.js                                           *
 *                                                        *
 * hprose Formatter for JavaScript.                       *
 *                                                        *
 * LastModified: Feb 25, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (global) {
    'use strict';

    var BinaryString = global.hprose.BinaryString;
    var StringIO = global.hprose.StringIO;
    var Writer = global.hprose.Writer;
    var Reader = global.hprose.Reader;
    var createObject = global.hprose.createObject;

    function serialize(value, simple, binary) {
        var stream = new StringIO();
        var writer = new Writer(stream, simple, binary);
        writer.serialize(value);
        return stream.take();
    }

    function unserialize(stream, simple, useHarmonyMap, binary) {
        if (!(stream instanceof StringIO)) {
            stream = new StringIO(stream);
        }
        return new Reader(stream, simple, useHarmonyMap, binary).unserialize();
    }

    global.hprose.Formatter = createObject(null, {
        serialize: { value: serialize },
        unserialize: { value: unserialize },
    });

    global.hprose.serialize = serialize;
    global.hprose.unserialize = unserialize;

})(this);
