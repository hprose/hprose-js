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
 * LastModified: Nov 18, 2016                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

(function (hprose) {
    'use strict';

    var StringIO = hprose.StringIO;
    var Writer = hprose.Writer;
    var Reader = hprose.Reader;
    var createObject = hprose.createObject;

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

    hprose.Formatter = createObject(null, {
        serialize: { value: serialize },
        unserialize: { value: unserialize }
    });

    hprose.serialize = serialize;
    hprose.unserialize = unserialize;

})(hprose);
