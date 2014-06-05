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
 * hproseHttpClient.js                                    *
 *                                                        *
 * hprose http client for Javascript.                     *
 *                                                        *
 * LastModified: Mar 30, 2014                             *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

/*global HproseResultMode */
/*global HproseException */
/*global HproseFilter */
/*global HproseHttpRequest */
/*global HproseStringInputStream */
/*global HproseStringOutputStream */
/*global HproseReader */
/*global HproseWriter */
/*global HproseTags */
/*jshint es3:true, unused:false, eqeqeq:true */
var HproseHttpClient = (function () {
    'use strict';
    /* Reference of global Class */
    var HResultMode = HproseResultMode;
    var HException = HproseException;
    var HFilter = HproseFilter;
    var HHttpRequest = HproseHttpRequest;
    var HStringInputStream = HproseStringInputStream;
    var HStringOutputStream = HproseStringOutputStream;
    var HReader = HproseReader;
    var HWriter = HproseWriter;
    var HTags = HproseTags;
    var NOOP = function(){};

    var s_boolean = 'boolean';
    var s_string = 'string';
    var s_number = 'number';
    var s_function = 'function';
    var s_OnError = '_OnError';
    var s_onError = '_onError';
    var s_onerror = '_onerror';
    var s_Callback = '_Callback';
    var s_callback = '_callback';
    var s_OnSuccess = '_OnSuccess';
    var s_onSuccess = '_onSuccess';
    var s_onsuccess = '_onsuccess';

    function HproseHttpClient(url, functions) {
        // private members
        var m_url;
        var m_ready    = false;
        var m_header = {'Content-Type': 'text/plain'};
        var m_timeout = 30000;
        var m_byref = false;
        var m_simple = false;
        var m_filters = [];
        var m_batch = false;
        var m_batches = [];

        var self = this;
        // public methods
        self.useService = function (url, functions, create) {
            if (typeof(functions) === s_boolean && create === undefined) {
                create = functions;
            }
            var stub = self;
            if (create) {
                stub = {};
            }
            m_ready = false;
            if (url === undefined) {
                return new HException('You should set server url first!');
            }
            m_url = url;
            if (typeof(functions) === s_string ||
                (functions && functions.constructor === Object)) {
                functions = [functions];
            }
            if (Array.isArray(functions)) {
                setFunctions(stub, functions);
            }
            else {
                useService(stub);
            }
            return stub;
        };
        self.invoke = function () {
            var args = arguments;
            var func = Array.prototype.shift.apply(args);
            return invoke(self, func, args);
        };
        self.setHeader = function (name, value) {
            if (name.toLowerCase() !== 'content-type') {
                if (value) {
                    m_header[name] = value;
                }
                else {
                    delete m_header[name];
                }
            }
        };
        self.setTimeout = function (timeout) {
            m_timeout = timeout;
        };
        self.getTimeout = function () {
            return m_timeout;
        };
        self.getReady = function () {
            return m_ready;
        };
        self.getByRef = function () {
            return m_byref;
        };
        self.setByRef = function (value) {
            if (value === undefined) value = true;
            m_byref = value;
        };
        self.getFilter = function () {
            if (m_filters.length === 0) {
                return null;
            }
            return m_filters[0];
        };
        self.setFilter = function (filter) {
            m_filters.length = 0;
            if (filter !== undefined && filter !== null) {
                m_filters.push(filter);
            }
        };
        self.addFilter = function (filter) {
            m_filters.push(filter);
        };
        self.removeFilter = function (filter) {
            var i = m_filters.indexOf(filter);
            if (i === -1) {
                return false;
            }
            m_filters.splice(i, 1);
            return true;
        };
        self.getSimpleMode = function () {
            return m_simple;
        };
        self.setSimpleMode = function (value) {
            if (value === undefined) value = true;
            m_simple = value;
        };
        self.beginBatch = function () {
            m_batch = true;
        };
        self.endBatch = function () {
            m_batch = false;
            if (m_batches.length) {
                invoke();
            }
        };
        // property
        self.useHarmonyMap = false;
        // events
        self.onReady = NOOP;
        self.onError = NOOP;/*name, error*/
        // private methods
        function useService(stub) {
            HHttpRequest.post(m_url, m_header, HTags.TagEnd, function (response) {
                var error = null;
                try {
                    var stream = new HStringInputStream(response);
                    var reader = new HReader(stream, true);
                    var tag = stream.getc();
                    switch (tag) {
                        case HTags.TagError:
                            error = new HException(reader.readString());
                            break;
                        case HTags.TagFunctions:
                            var functions = reader.readList();
                            reader.checkTag(HTags.TagEnd);
                            setFunctions(stub, functions);
                            break;
                        default:
                            error = new HException('Wrong Response:\r\n' + response);
                            break;
                    }
                }
                catch (e) {
                    error = e;
                }
                if (error !== null) {
                    self.onError('useService', error);
                }
            }, m_timeout, m_filters, self);
        }
        function setFunction(stub, func) {
            return function () {
                return invoke(stub, func, arguments);
            };
        }
        function setMethods(stub, obj, namespace, name, methods) {
            if (obj[name] !== undefined) return;
            obj[name] = {};
            if (typeof(methods) === s_string || methods.constructor === Object) {
                methods = [methods];
            }
            if (Array.isArray(methods)) {
                for (var i = 0; i < methods.length; i++) {
                    var m = methods[i];
                    if (typeof(m) === s_string) {
                        obj[name][m] = setFunction(stub, namespace + name + '_' + m);
                    }
                    else {
                        for (var n in m) {
                            setMethods(stub, obj[name], name + '_', n, m[n]);
                        }
                    }
                }
            }
        }
        function setFunctions(stub, functions) {
            for (var i = 0; i < functions.length; i++) {
                var f = functions[i];
                if (typeof(f) === s_string) {
                    if (stub[f] === undefined) {
                        stub[f] = setFunction(stub, f);
                    }
                }
                else {
                    for (var name in f) {
                        setMethods(stub, stub, '', name, f[name]);
                    }
                }
            }
            m_ready = true;
            self.onReady();
        }
        function invoke(stub, func, args) {
            var resultMode = HResultMode.Normal, stream, errorHandler, callback;
            if (!m_batch && !m_batches.length || m_batch) {
                var byref = m_byref;
                var simple = m_simple;
                var lowerCaseFunc = func.toLowerCase();
                errorHandler = stub[func + s_OnError] ||
                               stub[func + s_onError] ||
                               stub[func + s_onerror] ||
                               stub[lowerCaseFunc + s_OnError] ||
                               stub[lowerCaseFunc + s_onError] ||
                               stub[lowerCaseFunc + s_onerror] ||
                               self[func + s_OnError] ||
                               self[func + s_onError] ||
                               self[func + s_onerror] ||
                               self[lowerCaseFunc + s_OnError] ||
                               self[lowerCaseFunc + s_onError] ||
                               self[lowerCaseFunc + s_onerror];
                callback = stub[func + s_Callback] ||
                           stub[func + s_callback] ||
                           stub[func + s_OnSuccess] ||
                           stub[func + s_onSuccess] ||
                           stub[func + s_onsuccess] ||
                           stub[lowerCaseFunc + s_Callback] ||
                           stub[lowerCaseFunc + s_callback] ||
                           stub[lowerCaseFunc + s_OnSuccess] ||
                           stub[lowerCaseFunc + s_onSuccess] ||
                           stub[lowerCaseFunc + s_onsuccess] ||
                           self[func + s_Callback] ||
                           self[func + s_callback] ||
                           self[func + s_OnSuccess] ||
                           self[func + s_onSuccess] ||
                           self[func + s_onsuccess] ||
                           self[lowerCaseFunc + s_Callback] ||
                           self[lowerCaseFunc + s_callback] ||
                           self[lowerCaseFunc + s_OnSuccess] ||
                           self[lowerCaseFunc + s_onSuccess] ||
                           self[lowerCaseFunc + s_onsuccess];
                var count = args.length;
                var tArg5 = typeof(args[count - 5]);
                var tArg4 = typeof(args[count - 4]);
                var tArg3 = typeof(args[count - 3]);
                var tArg2 = typeof(args[count - 2]);
                var tArg1 = typeof(args[count - 1]);
                if (tArg1 === s_boolean &&
                    tArg2 === s_number &&
                    tArg3 === s_boolean &&
                    tArg4 === s_function &&
                    tArg5 === s_function) {
                    simple = args[count - 1];
                    resultMode = args[count - 2];
                    byref = args[count - 3];
                    errorHandler = args[count - 4];
                    callback = args[count - 5];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    delete args[count - 4];
                    delete args[count - 5];
                    args.length -= 5;
                }
                else if (tArg1 === s_boolean &&
                         tArg2 === s_number &&
                         tArg3 === s_function &&
                         tArg4 === s_function) {
                    simple = args[count - 1];
                    resultMode = args[count - 2];
                    errorHandler = args[count - 3];
                    callback = args[count - 4];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    delete args[count - 4];
                    args.length -= 4;
                }
                else if (tArg1 === s_number &&
                         tArg2 === s_boolean &&
                         tArg3 === s_function &&
                         tArg4 === s_function) {
                    resultMode = args[count - 1];
                    byref = args[count - 2];
                    errorHandler = args[count - 3];
                    callback = args[count - 4];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    delete args[count - 4];
                    args.length -= 4;
                }
                else if (tArg1 === s_boolean &&
                         tArg2 === s_boolean &&
                         tArg3 === s_function &&
                         tArg4 === s_function) {
                    simple = args[count - 1];
                    byref = args[count - 2];
                    errorHandler = args[count - 3];
                    callback = args[count - 4];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    delete args[count - 4];
                    args.length -= 4;
                }
                else if (tArg1 === s_boolean &&
                         tArg2 === s_function &&
                         tArg3 === s_function) {
                    byref = args[count - 1];
                    errorHandler = args[count - 2];
                    callback = args[count - 3];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    args.length -= 3;
                }
                else if (tArg1 === s_number &&
                         tArg2 === s_function &&
                         tArg3 === s_function) {
                    resultMode = args[count - 1];
                    errorHandler = args[count - 2];
                    callback = args[count - 3];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    args.length -= 3;
                }
                else if (tArg1 === s_function &&
                         tArg2 === s_function) {
                    errorHandler = args[count - 1];
                    callback = args[count - 2];
                    delete args[count - 1];
                    delete args[count - 2];
                    args.length -= 2;
                }
                else if (tArg1 === s_boolean &&
                         tArg2 === s_number &&
                         tArg3 === s_boolean &&
                         tArg4 === s_function) {
                    simple = args[count - 1];
                    resultMode = args[count - 2];
                    byref = args[count - 3];
                    callback = args[count - 4];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    delete args[count - 4];
                    args.length -= 4;
                }
                else if (tArg1 === s_boolean &&
                         tArg2 === s_number &&
                         tArg3 === s_function) {
                    simple = args[count - 1];
                    resultMode = args[count - 2];
                    callback = args[count - 3];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    args.length -= 3;
                }
                else if (tArg1 === s_number &&
                         tArg2 === s_boolean &&
                         tArg3 === s_function) {
                    resultMode = args[count - 1];
                    byref = args[count - 2];
                    callback = args[count - 3];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    args.length -= 3;
                }
                else if (tArg1 === s_boolean &&
                         tArg2 === s_boolean &&
                         tArg3 === s_function) {
                    simple = args[count - 1];
                    byref = args[count - 2];
                    callback = args[count - 3];
                    delete args[count - 1];
                    delete args[count - 2];
                    delete args[count - 3];
                    args.length -= 3;
                }
                else if (tArg1 === s_boolean &&
                         tArg2 === s_function) {
                    byref = args[count - 1];
                    callback = args[count - 2];
                    delete args[count - 1];
                    delete args[count - 2];
                    args.length -= 2;
                }
                else if (tArg1 === s_number &&
                         tArg2 === s_function) {
                    resultMode = args[count - 1];
                    callback = args[count - 2];
                    delete args[count - 1];
                    delete args[count - 2];
                    args.length -= 2;
                }
                else if (tArg1 === s_function) {
                    callback = args[count - 1];
                    delete args[count - 1];
                    args.length--;
                }
                stream = new HStringOutputStream(HTags.TagCall);
                var writer = new HWriter(stream, simple);
                writer.writeString(func);
                if (args.length > 0 || byref) {
                    writer.reset();
                    writer.writeList(args);
                    if (byref) {
                        writer.writeBoolean(true);
                    }
                }

                if (m_batch) {
                    m_batches.push({args: args, fn: func, call: stream.toString(),
                                    cb: callback, eh: errorHandler});
                }
                else {
                    stream.write(HTags.TagEnd);
                }
            }

            if (!m_batch) {
                var batchSize = m_batches.length;
                var batch = !!batchSize;
                var request = '';
                if (batch) {
                    for (var i = 0, item; i < batchSize; ++i) {
                        item = m_batches[i];
                        request += item.call;
                        delete item.call;
                    }
                    request += HTags.TagEnd;
                }
                else {
                    request = stream.toString();
                }

                var batches = m_batches.slice(0);
                m_batches.length = 0;

                HHttpRequest.post(m_url, m_header, request, function (response) {
                    var result = null;
                    var error = null;
                    var i;
                    var item;
                    if (resultMode === HResultMode.RawWithEndTag) {
                        result = response;
                    }
                    else if (resultMode === HResultMode.Raw) {
                        result = response.substr(0, response.length - 1);
                    }
                    else {
                        var stream = new HStringInputStream(response);
                        var reader = new HReader(stream, false, self.useHarmonyMap);
                        var tag;
                        i = -1;
                        try {
                            while ((tag = stream.getc()) !== HTags.TagEnd) {
                                switch (tag) {
                                case HTags.TagResult:
                                    if (resultMode === HResultMode.Serialized) {
                                        result = reader.readRaw().toString();
                                    }
                                    else {
                                        reader.reset();
                                        result = reader.unserialize();
                                    }
                                    if (batch) {
                                        batches[++i].rs = result;
                                        batches[i].ex = null;
                                    }
                                    break;
                                case HTags.TagArgument:
                                    reader.reset();
                                    args = reader.readList();
                                    if (batch) {
                                        batches[i].args = args;
                                    }
                                    break;
                                case HTags.TagError:
                                    reader.reset();
                                    error = new HException(reader.readString());
                                    if (batch) {
                                        batches[++i].ex = error;
                                    }
                                    break;
                                default:
                                    error = new HException('Wrong Response:\r\n' + response);
                                    if (batch) {
                                        batches[++i].ex = error;
                                    }
                                    break;
                                }
                            }
                        }
                        catch (e) {
                            error = e;
                            if (batch) {
                                batches[i < 0 ? 0 : i >= batchSize ? i - 1 : i].ex = error;
                            }
                        }
                    }

                    if (!batch) {
                        batchSize  = 1;
                        batches = [{args: args, fn: func, rs: result, cb: callback,
                                    eh: errorHandler, ex: error}];
                    }
                    for (i = 0; i < batchSize; ++i) {
                        item = batches[i];
                        error = item.ex;
                        callback = item.cb;
                        if (error !== null) {
                            errorHandler = item.eh;
                            func = item.fn;
                            if (errorHandler) {
                                errorHandler(func, error);
                            }
                            else {
                                self.onError(func, error);
                            }
                        }
                        else if (callback) {
                            callback(item.rs, item.args);
                        }
                    }
                }, m_timeout, m_filters, self);

            }
        }
        /* constructor */ {
            if (typeof(url) === s_string) {
                self.useService(url, functions);
            }
        }
    }
    HproseHttpClient.create = function (url, functions) {
        return new HproseHttpClient(url, functions);
    };

    return HproseHttpClient;
})();
