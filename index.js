/* eslint-disable */
'use strict';

// chatGPT
// @todo: support any number of sources
Object.deepCopy = function (obj, obj2 = null) {

    const jsonString = JSON.stringify(obj2 || obj);

    const result = JSON.parse(jsonString, (key, value) => {
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
            return new Date(value);
        } else {
            return value;
        }
    });

    if (obj2) {
        Object.sync(obj, result)
    }

    return result;
}

//todo: make deep sync
Object.sync = function (dst, src) {
    Object.clear(dst);
    Object.assign(dst, src);
    return dst;
}

Object.clear = function (obj) {
    for (const prop in obj) {
        delete obj[prop];
    }
    return dst;
};

String.prototype.cast = function () {

    if (!isNaN(this)) {
        return parseFloat(this);
    }

    if (this === 'true') {
        return true;
    }

    if (this === 'false') {
        return false;
    }

    if (this === 'undefined') {
        return undefined;
    }

    if (this === 'null') {
        return null;
    }

    return this;

}

String.prototype.interpolate = function () {

    const args = [].copy(arguments);

    return this.replaceAll(/%[%d]?/mg, m => {
        if (!args.length) {
            return m;
        }
        if (m === '%d' || typeof m === 'number') {
            return parseInt(args.shift());
        }
        if (m === '%f' || typeof m === 'number') {
            return parseFloat(args.shift()).toFixed(3);
        }
        if (m === '%%') {
            return args.shift();
        }
        return '"' + args.shift() + '"';

    });

}

Error.throw = function (msg, ...args) {

    let type = Error;
    if (args.last.prototype instanceof Error) {
        type = args.pop();
    }

    throw new type(msg.interpolate(...args));
}

// calls and resolves functions in 'items' array with only 'parallelCount' functions active at a moment
// todo: better name?

Promise.ABORT === {};

Promise.allLimit = function (parallelCount, items) {

    items = items.copy();
    let length = items.length;
    let count = 0;

    return new Promise((resolve, reject) => {

        fillQueue();

        function fillQueue() {

            while (count < parallelCount) {

                if (!items.length) {
                    if (!length) {
                        resolve(true);
                    }
                    return;
                }

                items.shift()().then(out => {
                    count--;
                    length--;
                    fillQueue();
                    return out;
                }).catch(e => {
                    if (e === Promise.ABORT) {
                        items.length = length = 0;
                        reject(new Error('Promise::allLimit - cancelled'));
                    }
                });
                count++;
            }
        }

    });


};

// Promises
{
    let _all = Promise.all;
    Promise.all = function (...args) {

        let arr = [];

        for (let arg of args) {

            if (arg && typeof arg[Symbol.iterator] === 'function') {
                arr.append(arg);
            } else {
                arr.push(arg);
            }
        }

        return _all.call(Promise, arr);
    };
}

globalThis.Promise.timeout = async function (delay = 0) {
    return new Promise(resolve => setTimeout(resolve, delay));
};

globalThis.Promise.queue = function () {

    return new function PromiseQueue() {

        const self = this;

        let queue = [];
        let running = false;


        self.push = function (...args) {
            queue.push(...args);
            return self;
        };

        self.run = function () {

            if (running) {
                return self;
            }

            running = true;

            runNext();

            return self;

            function runNext() {

                if (!queue.length) {
                    return;
                }

                let next = queue.shift();
                next().then(runNext);
            }

        };


    };
};

// Objects

if (!Object.values) {

    Object.values = function (obj) {

        var out = [];

        for (var k in obj) {
            out.push(obj[k]);
        }

        return out;
    };
}
{
    const accessors = {};

    Object.get = function (obj, path) {

        let accessor = accessors[path];

        if (!accessor) {
            let del = path[0] === '[' ? '' : '.';
            try {
                accessors[path] = accessor = new Function('obj', 'try{return obj' + del + path + '}catch(e){return undefined}');
            } catch (e) {
                accessors[path] = accessor = () => e.message;
            }
        }

        return accessor(obj);

    };
}

Object.toUrlParams = function (obj) {
    let str = [];
    for (let p in obj) {
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(getVal(obj[p])));
        }
    }
    return str.join('&');

    function getVal(v) {
        if (v instanceof Date) {
            return JSON.stringify(v).replace(/"/g, '');
        }
        return v;
    }
};

Object.set = function (obj, path, value) {

    let keys = path.split(/\.|\]\.|\[/g);
    let key;

    while (key = keys.shift()) {

        if (!keys.length) {
            obj[key] = value;
            break;
        }
        if (!is_.obj(obj[key])) {
            if (is_.num(keys[0])) {
                obj[key] = [];
            } else {
                obj[key] = {};
            }
        }

        obj = obj[key];
    }

    return obj;

};

Object.hasAllProperties = function (obj, props) {
    return props.words.intersect(Object.keys(obj)).length == props.length;
};

Object.appendMethod = function (obj, prop, func) {

    if (is_.obj(prop)) {
        for (let name in prop) {
            Object.appendMethod(obj, name, prop[name]);
        }
        return obj;
    }

    if (!obj[prop]) {
        obj[prop] = func;
        return obj;
    }

    obj[prop] = function (...args) {
        obj[prop](...args);
        func(...args);
    };
};

Object.defineProperty(Object.prototype, 'each', {
    enumerable: false,
    writable: true,
    value: function (cb) {

        var i = 0;

        for (var k in this) {
            if (false === cb(k, this[k], i++)) {
                break;
            }
        }
    },
});

/*Object.defineProperty(Object.prototype, 'extend', {
    enumerable: false,
    writable: true,
    value: function(obj, props, flags) {
        return Object.extend(this, obj, props, flags);
    },
});*/

Object.ensureProperty = function (obj, name, value) {

    if (!obj.hasOwnProperty(name)) {
        Object.defineProperty(obj, name, {
            writable: true,
            value: value,
        });
    }

    return obj[name];
};

Object.map = function (obj, cb) {

    var out = [];

    for (var k in obj) {

        out.push(cb(k, obj[k]));

    }

    return out;
};

Object.flatten = function (obj) {

    var out = {};

    for (var n in obj) {

        var prop = obj[n];

        if (typeof prop == 'object') {

            var val = Object.flatten(prop);

            for (var k in val) {
                out[n + '.' + k] = val[k];
            }

        } else if (is_.arr(prop)) {
            for (var i = 0, len = prop.length; i < len; i++) {
                out[n + '.' + i] = prop[i];
            }
        } else {
            out[n] = obj[n];
        }
    }

    return out;
};

Object.removeNulls = function (obj) {

    var out = {};

    for (var k in obj) {
        if (obj[k] === null || obj[k] === undefined) {
            continue;
        }

        out[k] = obj[k];
    }

    return out;
};

Object.copy = function (obj, props, flags) {

    var out = {};

    if (!props) {
        for (var k in obj) {
            out[k] = obj[k];
        }
        return out;
    }

    if (is_.str(props) && props[0] == '!') {
        var not = props.substring(1).words;
        for (var k in obj) {
            if (not.contains(k)) {
                continue;
            }
            out[k] = obj[k];
        }
        return out;
    }

    for (const prop of props.words) {
        if (obj.hasOwnProperty(prop)) {
            if (flags != 'no-false') {
                out[prop] = obj[prop];
            } else if (obj[prop]) {
                out[prop] = obj[prop];
            }
        }
    }

    return out;
};

Object.extend = function (dst, src, props, flags) {

    var src = Object.copy(src, props, flags);
    for (var k in src) {
        dst[k] = src[k];
    }

    return dst;
};

Object.clear = function (obj, props) {

    var out = {};

    if (!props) {
        Object.keys(obj).each(function (prop) {
            out[prop] = obj[prop];
            delete obj[prop];
        });

        return out;
    }

    props.eachWord(function (prop) {
        if (obj.hasOwnProperty(prop)) {
            out[prop] = obj[prop];
            delete obj[prop];
        }
    });

    return out;
};


// Numbers

(function () {

    var padding = '00000000000000000000000000000000000000000000000000000';

    Number.prototype.pad = function (len) {
        return (padding + this).slice(-len);
    };

})();

Number.prototype.ceil = function () {
    return Math.ceil(this);
};


// Strings

JSON.toQuoted = function () {
    let json = JSON.stringify.apply(JSON, arguments);
    return json.replace(/"/gm, '&quot;');
};

{
    const _compare = String.prototype.localeCompare;

    String.prototype.localeCompare = function (str, locale) {
        if (arguments.length === 2) {
            return _compare.call(this, str, locale.replace('_', '-'));
        }
        return _compare.call(this, str);
    };
}

{

    /*

    @todo: improve escaping but analyzing and conform to angularjs' escaping:

    // Regular Expressions for parsing tags and attributes
    var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
    // Match everything outside of normal chars and " (quote character)
    NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g;

    function encodeEntities(value) {
        return value.
        replace(/&/g, '&amp;').
        replace(SURROGATE_PAIR_REGEXP, function(value) {
            var hi = value.charCodeAt(0);
            var low = value.charCodeAt(1);
            return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
        }).
        replace(NON_ALPHANUMERIC_REGEXP, function(value) {
            return '&#' + value.charCodeAt(0) + ';';
        }).
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;');
    }

    */

    const escapes = {
        '<': ' ❮',
        '>': '❯',
        '&': '﹠',
        '"': '”',
        '\'': '‛',
        '/': '∕',
    };

    const escapee = new RegExp(/[<>&"'/]/gm);

    /*
        escapes untrusted text for treating it as a safe html according to
        https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
        the unsafe characters are escaped with their Unicode alternatives so a text could be safely escaped several times.
        the escaped text is used in angularjs templates so it's escaped the second time in that case.
     */

    globalThis.$escape = function (input) {

        if (input) {

            if (typeof input === 'string') {
                return input.replace(escapee, m => escapes[m[0]]);
            }

            return input;
        }

        // since we are expecting a string here, avoid undefines and nulls
        if (input === undefined || input === null) {
            return '';
        }

        return input;

    };
}

{
    const regexp = new RegExp('[-._](.)', 'g');
    String.prototype.camelize = function () {
        return this.replace(regexp, function (match, group1) {
            return group1.toUpperCase();
        });
    };
}
{
    const regexp = new RegExp('[A-Z]', 'g');
    String.prototype.kebabize = function () {
        return this.replace(regexp, function (m) {
            return '-' + m.toLowerCase();
        }).replace('_', '-');
    };
}

String.prototype.slugify = function () {
    return this.toLowerCase().trim()
        .replace(/[\s\W_]+/g, '-')  // remove invalid chars
        .replace(/-+/g, '-');       // collapse dashes
};

String.prototype.flags = function (transform = val => val.camelize()) {

    var out = {};

    for (const f of this.words) {
        out[transform(f)] = true;
    }

    return out;
};

{
    const exp = /\s*\n\s*/mg;

    Object.defineProperty(String.prototype, 'lines', {
        get() {
            return this.trim().split(exp) || [];
        }
    });

}

Object.defineProperty(String.prototype, 'capitalized', {
    get() {
        return this[0].toUpperCase() + this.slice(1);
    }
});

String.prototype.wordTree = function (delim = '()') {

    const BLOCK_START = delim[0];
    const BLOCK_END = delim[1];//, QUOTE = "'", DQUOTE = '"', COMMENT = '/', MCOMMENT = '*', ESCAPE = '\\';
    const WHITE_SPACE = ' ';
    const src = this
        .trim()
        .replace(new RegExp('\\s*[' + delim + ']\\s*', 'mg'), m => m.trim())
        .replace(/\s+/mg, ' ');

    let word = '';
    let idx = 0;

    const out = {};

    parse(out);

    return out;

    function next(c) {
        for (const scope of [WHITE_SPACE, BLOCK_START, BLOCK_END]) {
            if (scope === c) {
                return scope;
            }
        }
    }

    function parse(node) {

        while (src[idx] !== undefined) {

            const c = src[idx++];

            if (c === BLOCK_START) {

                const child = node[word] = {};
                word = '';
                parse(child);

            } else if (c === BLOCK_END) {
                return word && parseWord();

            } else if (c === WHITE_SPACE) {
                parseWord();
            } else {
                word += c;
            }

        }
        word && parseWord();

        function parseWord() {

            let [name, val] = word.split(':');

            if (val !== undefined) {

                if (!isNaN(parseFloat(val))) {
                    val = parseFloat(val);
                } else if (val === 'true') {
                    val = true;
                } else if (val === 'false') {
                    val = false;
                } else if (val === 'null') {
                    val = null;
                }

            } else {
                val = true;
            }

            node[name] = val;
            word = '';

        }

    }

};

{

    const exp = /\S+/mg;

    Object.defineProperty(String.prototype, 'words', {
        get() {
            return this.match(exp) || [];
        }
    });
}
{

    Object.defineProperty(String.prototype, 'quotedWords', {

        get() {

            const source = this.words;

            const words = [];
            let word = '';

            for (let i = 0, len = source.length; i < len; i++) {

                let chunk = source[i];

                if (word) {
                    if (chunk[chunk.length - 1] === '\'') {
                        word += ' ' + chunk.slice(0, chunk.length - 1);
                        words.push(word);
                        word = '';
                        continue;
                    }
                    word += chunk;
                    continue;
                }

                if (chunk[0] === '\'') {
                    word = chunk.slice(1);
                    continue;
                }

                words.push(chunk);

            }

            return words;

        }
    });
}


{
    const exp = /.{1}/mg;

    Object.defineProperty(String.prototype, 'chars', {
        get() {
            return this.match(exp) || [];
        }
    });
}

{
    const exp = /.$/mg;

    Object.defineProperty(String.prototype, 'lastChar', {
        get() {
            return this.match(exp)?.[0] || '';
        }
    });
}

String.prototype.cutEnd = function (len) {
    return this.slice(0, this.length - len);
}


String.prototype.reverse = function () {
    var out = '';
    for (var i = this.length - 1; i >= 0; i--) {
        out += this[i];
    }
    return out;
};

String.prototype.capitalize = function () {
    return this[0].toUpperCase() + this.slice(1);
};

String.prototype.hashCode = function () {
    let hash = 0;
    for (let i = 0, l = this.length; i < l; i++) {
        hash = ((hash << 5) - hash) + this.charCodeAt(i);
        hash |= 0;
    }
    return hash;
};


// Functions

Function.wrap

Function.prototype.clone = function () {
    var that = this;
    var temp = function temporary() {
        return that.apply(this, arguments);
    };
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            temp[key] = this[key];
        }
    }
    return temp;
};

Function.prototype.timeout = function (delay) {
    // FIXME: Utils is not declared
    var r = this.__timer; // this.__timer || new Utils.Timer(this);
    r.timeout(delay);
    this.__timer = r;
    return r;
};

Function.prototype.later = function () {

    let args = [].copy(arguments);
    let self = this;

    let func = function () {
        self.apply(null, args);
    };

    func.__originFunction = self;
    setTimeout(func);

};

Function.prototype.laterBind = function (context) {

    let args = [].copy(arguments);
    args.shift();
    let self = this;

    let func = function () {
        self.apply(context, args);
    };

    func.__originFunction = self;
    setTimeout(func);

};

Function.prototype.applyLater = function (args, cb) {

    var self = this;

    setTimeout(function () {
        var r = self.apply(null, args);
        cb && cb(r);
    });

};

//returns delayed callback with proper THIS
Function.prototype.laterCb = function () {

    var self = this;

    var out = function () {

        var args = $.makeArray(arguments);

        setTimeout(function () {
            self.apply(null, args);
        });

    };

    out.__originFunction = self;

    return out;

};

Function.prototype.interval = function (delay) {
    // FIXME: Utils is not declared
    var r = this.__timer; // this.__timer || new Utils.Timer(this);
    r.interval(delay);
    this.__timer = r;
    return r;
};

Function.prototype.stopTimer = function () {
    if (this.__timer) {
        this.__timer.clear();
    }
};

Function.prototype.cb = function () {

    var args = [].copy(arguments);
    var self = this;

    var out = function () {
        return self.apply(this, args.copy(arguments));
    };

    out._originFunction = self;
    return out;

};

//call later with the last args supplied
Function.prototype.laterLast = function () {
    this.call_timer_args = arguments;
    if (this.call_timer) {
        return;
    }
    var self = this;
    this.call_timer = setTimeout(function () {
        var args = $.makeArray(self.call_timer_args);
        self.apply(null, args);
        self.call_timer = null;
    }, 0);
};

Function.prototype.laterLastCb = function () {

    var self = this;
    var cb_args;
    if (arguments.length) {
        cb_args = arguments;
    }

    return function () {

        self.call_timer_args = arguments;

        if (self.call_timer) {
            return;
        }

        self.call_timer = setTimeout(function () {
            var args = cb_args || self.call_timer_args;
            self.apply(null, args);
            self.call_timer = null;
        }, 0);

    };
};


// Arrays

Array.prototype.sync = function (arr, idName, addedCb, removedCb) {

    const synced = [];
    const out = {
        added: [],
        removed: [],
    };

    for (let i = 0; i < arr.length; i++) {

        const item = arr[i];
        const found = this.find({ [idName]: item[idName] });

        if (!found && addedCb(item) !== false) {
            synced.push(item);
            out.added.push(item);
            continue;
        }
        found && synced.push(item);
    }

    for (let i = 0; i < this.length; i++) {
        const item = this[i];
        const found = arr.find({ [idName]: item[idName] });
        if (found) {
            continue;
        }

        if (removedCb(item) !== false) {
            out.removed.push(item);
            continue;
        }

        // try insert into the synced array in the previous place
        let inserted = false;

        for (let n = i - 1; i > 0; i--) {
            const prev = synced.find({ [idName]: this[n][idName] });
            if (prev) {
                synced.insertAfter(prev, item);
                inserted = true;
                break;
            }
        }

        inserted || synced.unshift(item);


    }

    this.replace(synced);

    return out;

};

Array.ensure = function (val) {

    if (is_.arr(val)) {
        return val;
    }

    if (val === undefined) {
        return [];
    }

    return [val];

};

Array.prototype.hasPromise = function () {
    return this.some(item => item && typeof item.then === 'function');
};

Array.hasPromise = function (arr) {
    return is_.arr(arr) && arr.hasPromise();
};

Array.prototype.next = function (item) {

    var self = this;

    var idx = self.indexOf(item);
    if (idx == self.length - 1) {
        return null;
    }

    return self[idx + 1];
};

Array.prototype.prev = function (item) {

    var self = this;

    var idx = self.indexOf(item);
    if (idx == 0) {
        return null;
    }

    return self[idx - 1];
};

/*
 returns compact string representation of an array
 if an array item is object - provides 'id' or 'name' or 'title' properties as the most respresentantive ones
 if an array item is function - provides function name with arguments
 */
Array.prototype.toCompactString = function () {

    var out = [];
    for (var i = 0; i < this.length; i++) {
        var e = this[i];
        if (is_.obj(e)) {

            var name = e.__proto__.constructor.name;
            if (name == 'Object') {

                name = '';

                for (const k of 'id title name'.words) {
                    if (e[k]) {
                        name = k + ':' + [e[k]].toCompactString();
                        return false;
                    }
                }

                if (!name) {
                    var keys = Object.keys(e);
                    if (keys.length) {
                        name = keys[0] + ':' + [e[keys[0]]].toCompactString();
                    }
                }

                name += '..';


            }

            out.push('{' + name + '}');
        } else if (is_.arr(e)) {
            out.push('Array(' + e.length + ')');
        } else if (is_.str(e)) {
            out.push('\'' + e + '\'');
        } else if (e === undefined) {
            out.push('undefined');
        } else if (is_.func(e)) {

            var name = e.name || 'function';
            var src = e.toString();

            // eslint-disable-next-line
            var match = src.match(/function\s*\w*(\(.*\))/ms);
            if (!match) { // arrow function

                match = src.match(/^(.*=>)\s*(\{?.*\}?)\s*$/ms);
                name = match[1].replace(/\s*=>/, '=>');
                if (match[2].length < 25) { // display short arrow function body
                    name += match[2];
                } else {
                    name += '{..}';
                }

            } else {
                name += match[1];
            }

            out.push(name);

        } else {
            out.push(e);
        }
    }

    return out.join(', ');
};

Array.slice = function (obj, from, count) {
    return Array.prototype.slice.call(obj, from, count);
};

Object.defineProperty(Array.prototype, 'words', {
    get() {
        return this;
    }
});

//todo: add support for callbacks,fields
Array.prototype.max = function (what, outWhat) {

    let accessor = what;
    let outAccessor = outWhat;

    if (is_.str(what)) {
        accessor = new Function('item', 'try { return item.' + what + '; } catch (e) { }');
        if (is_.str(outWhat)) {
            outAccessor = new Function('item', 'try { return item.' + outWhat + '; } catch (e) { }');
        }
    }

    let max = accessor ? accessor(this[0]) : this[0];
    let out;
    outAccessor && (out = outAccessor(this[0]));

    for (let i = 1; i < this.length; i++) {
        let val = accessor ? accessor(this[i]) : this[i];
        if (val !== undefined && max < val) {
            max = val;
            outAccessor && (out = outAccessor(this[i]));
        }
    }

    return out || max;
};

Array.prototype.min = function (what) {

    let accessor = what;

    if (is_.str(what)) {
        accessor = new Function('item', 'return item.' + what);
    }

    let min = accessor ? accessor(this[0]) : this[0];

    for (let i = 1; i < this.length; i++) {
        let val = accessor ? accessor(this[i]) : this[i];
        if (min > val) {
            min = val;
        }
    }

    return min;
};

Array.prototype.clear = function () {
    this.splice(0, this.length);
    return this;
};

{

    let map = Array.prototype.map;
    let pathTest = /[[.]/;

    Array.prototype.map = function (cb, thisArg) {

        if (!this.length) {
            return [];
        }

        if (typeof cb == 'string') {

            var props = cb.words;

            if (props.length == 1) {

                if (typeof this[0] != 'object') {
                    cb = function (item) {
                        var obj = {};
                        obj[props[0]] = item;
                        return obj;
                    };
                } else {

                    if (pathTest.test(props[0])) {

                        let fn = new Function('item', 'return item.' + props[0]);

                        cb = function (item) {
                            if (!item) {
                                return null;
                            }
                            return fn(item);
                        };

                    } else {

                        cb = function (item) {
                            if (!item) {
                                return null;
                            }
                            return item[props[0]];
                        };
                    }
                }

            } else {

                cb = function (item) {
                    var out = {};
                    for (var i = 0; i < props.length; i++) {

                        if (item[props[i]] !== undefined) {
                            out[props[i]] = item[props[i]];
                        }

                    }
                    return out;
                };
            }
        }

        return map.call(this, cb, thisArg);

    };
}

//todo: make it more smart, not iterating 2 times
Array.prototype.filterMap = function () {

    //each or map?
    return this.each.apply(this, arguments).filter(function (item) {
        return item !== undefined;
    });
};

{

    Array.prototype.createFilter = function (what) {

        let cb = what;

        if (typeof what === 'string') {

            what = what.replace(/\s*(\!?===?)\s?/gm, '$1');

            const conditions = [];

            for (let prop of what.words) {

                const compare = prop.match(/\!?===?/);

                if (compare) {

                    const args = prop.split(compare[0]);
                    conditions.push('d.' + args[0] + compare[0] + args[1]);

                } else if (prop[0] === '!') {

                    prop = prop.substring(1);
                    conditions.push(`!(typeof d.${prop} === 'function' ? d.${prop}() : d.${prop})`);

                } else {
                    conditions.push(`!!(typeof d.${prop} === 'function' ? d.${prop}() : d.${prop})`);
                }

            }

            cb = new Function('d', 'return ' + conditions.join('&&'));


        } else if (typeof what === 'object') {

            cb = function (d) {
                let matched = true;
                for (const k in what) {
                    if (getVal(d, k) !== getVal(what, k)) {
                        matched = false;
                        break;
                    }

                }
                return matched;
            };

            function getVal(d, what) { // eslint-disable-line no-inner-declarations
                if (typeof d[what] == 'function') {
                    return d[what]();
                }
                return d[what];
            }

        }

        return cb;

    }

}

{
    const wrap = (method) => {

        const _original = Array.prototype[method];

        Array.prototype[method] = function () {

            arguments[0] = Array.prototype.createFilter.apply(this, arguments);
            return _original.apply(this, arguments);

        };

    }

    'filter some every'.split(' ').forEach(wrap);

}

Object.defineProperty(Array.prototype, 'first', {
    get() {
        return this[0];
    },
    set(val) {
        if (!this.length) {
            this.push(val);
        } else {
            this[0] = val;
        }
    }
});

Object.defineProperty(Array.prototype, 'last', {
    get() {
        return this[this.length - 1];
    },
    set(val) {
        if (!this.length) {
            this.push(val);
        } else {
            this[this.length - 1] = val;
        }
    }
});

/**
 * Verify is n array is sorted.
 * Returns:
 * 0 not sorted.
 * 1 asc sorting.
 * -1 desc sorting.
 */
Array.prototype.isSorted = function () {

    return (function (direction) {
        return this.reduce(function (prev, next, i, arr) {
            if (direction === undefined) {
                return (direction = prev <= next ? 1 : -1) || true;
            } else {
                return (direction + 1 ?
                    (arr[i - 1] <= next) :
                    (arr[i - 1] > next));
            }
        }) ? Number(direction) : false;
    }).call(this);
};

Array.prototype.hasSameValues = function (compareWith) {

    if (this.length != compareWith.length) {
        return false;
    }

    for (var i = 0; i < this.length; i++) {
        if (compareWith.indexOf(this[i]) == -1) {
            return false;
        }
    }
    return true;
};

Array.prototype.copy = function () {

    //we can pass any number of arguments that will be passed to append()
    //make sure this works when 'this' is an array like object

    var out = Array.prototype.slice.call(this);

    if (arguments.length) {
        out.append.apply(out, arguments);
    }

    return out;

};

Array.prototype.add = function () {
    Array.prototype.push.apply(this, arguments);
};

Array.prototype.prepend = function () {

    var count = 0;

    var args = Array.prototype.copy.call(arguments);

    var lastArg = args.last;

    var filter;

    if (typeof lastArg == 'string') {// a unique field is provided to add only non-existing items
        args.pop();
        filter = {};
    }

    //dont rely on concat() - it doesn't treat well array-like objects

    for (var i = 0; i < args.length; i++) {

        var arr = args[i];

        var n = arr.length;

        while (--n > -1) {

            if (filter) {//add only unique values
                filter[lastArg] = arr[n][lastArg];
                if (!this.find(filter)) {
                    this.unshift(arr[n]);
                    count++;
                }
            } else {
                this.unshift(arr[n]);
                count++;
            }

        }
    }

    return this;

};
// @fixme: refactor with arguments to make it faster
Array.prototype.insertAfter = function (elem, ...items) {

    let idx = this.indexOf(elem);
    return this.splice(idx + 1, 0, ...items);

};

Array.prototype.insertBefore = function (elem, ...items) {

    let idx = this.indexOf(elem);
    return this.splice(idx, 0, ...items);

};


Array.prototype.append = function () {

    var count = 0;

    var args = Array.prototype.copy.call(arguments);

    var lastArg = args.last;

    var filter;

    if (typeof lastArg == 'string') {// a unique field is provided to add only non-existing items
        args.pop();
        filter = {};
    }

    //dont rely on concat() - it doesn't treat well array-like objects

    for (var i = 0; i < args.length; i++) {

        var arr = args[i];

        for (var n = 0; n < arr.length; n++) {

            if (filter) {//add only unique values
                filter[lastArg] = arr[n][lastArg];
                if (!this.find(filter)) {
                    this.push(arr[n]);
                    count++;
                }
            } else {
                this.push(arr[n]);
                count++;
            }

        }
    }

    return this;

};

(function () {

    var locale;

    Array.setLocale = function (val) {
        locale = val;
    };

    //todo: rename sortInlineBy to sortBy
    //todo: rename sortBy to sortCopyBy

    Array.prototype.sortInlineBy = function (sortFn, _order, arg3) {

        var currLocale = locale || navigator.language | 'en-US';

        //we use localeCompare only with strings

        //todo: optimize if else flow based on data type
        //todo: make sortFn inline and many sorting routines
        //todo: add support of sorting by several keys or function that returns array of values
        //todo: support weights for sortFn == callback

        var self = this;
        var order;

        if (!self.length) {
            return [];
        }

        var sortField = '';

        if (typeof sortFn == 'string') {
            if (sortFn[0] == '-') {
                order = 'desc';
                sortFn = sortFn.substr(1);
            }

            sortField = sortFn;

        } else if (!sortFn) {
            sortFn = function (d) {
                return d;
            };
        }

        if (sortField) {
            var val = self[0][sortField];
        } else {
            var val = sortFn(self[0]);
        }

        var comparable = typeof val == 'number' || typeof val == 'string' || (val instanceof Date);
        var isString = typeof val == 'string';
        var hasLocale = typeof ''.localeCompare == 'function';


        if (sortField) {

            if (typeof _order == 'object') {//sorted field values with weights

                var sortKeys = _order;

                if (sortKeys instanceof Array) {
                    sortKeys = (function () {

                        var out = {};
                        sortKeys.each(function (k, idx) {
                            out[k] = idx;
                        });

                        return out;

                    })();
                }

                order = arg3 || order || 1;

                //WE USE ONLY <> COMPARE!
                comparable = false;

                sortFn = (function (d) {
                    return sortKeys[d[sortField]];
                });

            } else {

                if (comparable) {

                    if (isString || !hasLocale) {

                        sortFn = (function (d) {
                            return (d[sortField] || '').toLowerCase();
                        });

                    } else {

                        sortFn = function (d) {
                            return d[sortField];
                        };

                    }

                } else {

                    if (val && typeof val.toString == 'function') {
                        sortFn = function (d) {
                            return (d[sortField] || '').toString().toLowerCase();
                        };
                    } else {
                        sortFn = function (d) {
                            return d[sortField];
                        };
                    }
                }
            }

        } else {

            var fn = sortFn;

            if (comparable) {

                if (isString && !hasLocale) {

                    sortFn = (function (d) {
                        return fn(d).toLowerCase();
                    });

                }

            } else {
                if (val && typeof val.toString == 'function') {
                    sortFn = function (d) {
                        return fn(d).toString().toLowerCase();
                    };
                } else {
                    sortFn = function (d) {
                        return fn(d);
                    };
                }
            }
        }

        if (order === undefined) {
            order = _order || 1;
        }

        if (order == 'desc') {
            order = -1;
        }

        var out = this;

        //we compare raw values in case of dates and numbers and non-strings

        if ((typeof val == 'number') || (val instanceof Date) || !comparable) {

            out.sort(function (_a, _b) {

                let a = sortFn(_a);
                let b = sortFn(_b);

                if (a > b) {
                    return 1 * order;
                }
                if (a < b) {
                    return -1 * order;
                }

                return 0;

            });

        } else {

            out.sort(function (a, b) {

                a = sortFn(a);
                b = sortFn(b);

                return a.localeCompare(b, currLocale);

            });

        }

        return out;

    };

    Array.prototype.sortBy = function (...args) {
        return this.copy().sortInlineBy(...args);
    };

})();

// returns common values for both arrays
Array.prototype.intersect = function (arr) {

    //according a benchmark the fastest is smallArray.intersect(bigArray);
    if (this.length > arr.length) {
        return arr.intersect(this);
    }

    let out = [];

    for (let i = 0, len = this.length; i < len; i++) {
        if (arr.includes(this[i])) {
            out.push(this[i]);
        }
    }

    return out;
};

// checks whether the array includes all values in any order
Array.prototype.includesAll = function (...values) {
    return this.includesArray(values);
};

// checks whether the array includes all values from other array
Array.prototype.includesArray = function (arr) {

    for (let i = 0, len = arr.length; i < len; i++) {
        if (!this.includes(arr[i])) {
            return false;
        }
    }

    return true;

};

// return array of values not found in the array 'arr' argument
Array.prototype.diff = function (arr) {

    let diff = [];
    for (let i = 0, len = this.length; i < len; i++) {
        let v = this[i];
        if (!arr.includes(v)) {
            diff.push(v);
        }
    }
    return diff;
};

Array.prototype.removeAll = function (val) {
    let idx;
    while ((idx = this.indexOf(val)) !== -1) {
        this.splice(idx, 1);
    }
    return this;
};

Array.prototype.remove = function (val) {

    let idx = this.indexOf(val);

    if (idx > -1) {
        this.splice(idx, 1);
    }

    return this;
};

Array.prototype.removeArray = function (val) {

    if (is_.str(val)) {
        val = val.words;
    }

    let idx;
    for (let i = 0, len = val.length; i < len; i++) {
        while ((idx = this.indexOf(val[i])) > -1) {
            this.splice(idx, 1);
        }
    }

    return this;
};

Array.prototype.removeBy = function (by) {

    var found;

    //todo: optimize by filter()

    while (found = this.find(by)) {
        this.remove(found);
    }

    return this;
};

Array.NotEmpty = function () {
};

Array.prototype.toggle = function (value, toggle) {

    if (toggle) {
        if (!this.includes(value)) {
            this.push(value);
            return this;
        }
    }
    this.remove(value);
    return this;
};

Array.prototype.replace = function () {
    this.splice(0, this.length);
    return this.append.apply(this, arguments);
};

Array.prototype.replaceBy = function (field, item, addIfNotFound) {

    var filter = {};
    filter[field] = item[field];

    var found = this.find(filter);

    if (found) {
        this.splice(this.indexOf(found), 1, item);
    } else {
        addIfNotFound && this.push(item);
    }

    return found;

};

if (!Array.prototype.includes) {
    Array.prototype.includes = function (val) {
        return this.indexOf(val) > -1;
    };
}

Array.prototype.contains = function (val) {
    return this.indexOf(val) >= 0;
};

if (!Array.prototype.includes) {
    Array.prototype.includes = Array.prototype.contains;
}

Array.each = function (arr) {

    var args = [].copy(arguments);
    args.shift();

    return Array.prototype.each.apply(arr, args);

};

Array.prototype.each = function (callback, type, idx, finish_cb) {

    var out = [];
    var self = this;

    if (type == 'callback') {

        if (typeof idx == 'function') {
            finish_cb = idx;
            idx = 0;
        }
        if (idx >= this.length || this.length == 0) {
            finish_cb();
            return;
        }
        callback(function () {
            self.each(callback, 'callback', idx + 1, finish_cb);
        }, this[idx], idx);
        return;
    }

    for (var i = 0; i < this.length; i++) {
        if (typeof callback == 'string') {
            var ps = [];
            for (var n = 1; n < arguments.length; n++) {
                if ([Array.NotEmpty].contains(arguments[n])) {
                    continue;
                }
                ps.push(arguments[n]);
            }
            if (typeof this[i][callback] == 'function') {
                var r = this[i][callback].apply(this[i], ps);
                if (type === Array.NotEmpty) {
                    if (r) {
                        out.push(r);
                    }
                } else {
                    out.push(r);
                }
            } else {
                out.push(this[i][callback]);
            }
            continue;
        }
        if (type === true) {
            out.push(new callback(this[i]));
            continue;
        }
        if (type == '!empty') {
            var r = callback(this[i], i);
            if (r !== undefined && r !== null) {
                out.push(r);
            }
        } else {

            var r = callback.call(this, this[i], i);

            if (false === r) {
                return false;
            } else {
                out.push(r);
            }
        }
    }
    return out;
};

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};

{

    const _find = Array.prototype.find;

    Array.prototype.find = function () {

        arguments[0] = Array.prototype.createFilter.apply(this, arguments);

        return _find.apply(this, arguments);

    };
}

// shallow 1 level merge of array of objects into 1 object
Array.prototype.collapse = function () {

    let out = {};

    for (let i = 0, len = this.length; i < len; i++) {
        for (let k in this[i]) {
            out[k] = this[i][k];
        }
    }
    return out;
};

Array.prototype.collect = function (field, uniqueField) {

    var out = [];
    var map = globalThis.WeakMap ? new WeakMap : null;
    var unique = [];

    //todo: support field func parameters

    for (var i = 0, len = this.length; i < len; i++) {

        var arr = if_.func(this[i][field]);

        for (var n = 0, nlen = arr.length; n < nlen; n++) {

            if (uniqueField) {
                var val = uniqueField === true ? arr[n] : if_.func(arr[n][uniqueField]);

                if (map) {
                    if (!map.get(val)) {
                        map.set(val, true);
                        out.push(val);
                    }
                } else {
                    if (!unique.contains(val)) {
                        unique.push(val);
                        out.push(val);
                    }
                }
            } else {
                out.push(arr[n]);
            }
        }
    }

    return out;
};

Array.prototype.update = function (val, field, method) {

    var findBy = {};
    findBy[field] = val[field];

    var found = this.find(findBy);

    if (found) {
        var index = this.indexOf(found);
        this.splice(index, 1, val);
    } else {
        this[method || 'push'](val);
    }

    return this;
};

Array.prototype.unique = function (accessor) {

    var arg1 = accessor;

    if (is_.str(accessor)) {
        accessor = function (item) {
            return if_.func(item[arg1]);
        };
    }

    var keys = {};
    var out = [];
    for (var i = 0, len = this.length; i < len; i++) {
        var val = this[i];
        var key = accessor ? accessor(val) : val;
        if (keys[key]) {
            continue;
        }
        keys[key] = val;
        out.push(val);
    }
    return out;
};

Array.prototype.uniqueCount = function (accessor) {

    var arg1 = accessor;

    if (is_.str(accessor)) {
        accessor = function (item) {
            return if_.func(item[arg1]);
        };
    }

    var keys = {};
    var out = [];
    for (var i = 0, len = this.length; i < len; i++) {
        var val = this[i];
        var key = accessor ? accessor(val) : val;
        if (keys[key]) {
            keys[key]++;
            continue;
        }
        keys[key] = 1;
    }

    for (let key in keys) {
        out.push({
            value: key,
            count: keys[key],
        });
    }

    return out;
};

Map.prototype.ensure = function (key, defaultVal) {
    let out = this.get(key);
    if (out === undefined) {
        if (!this.has(key)) {
            if (typeof defaultVal === 'function') {
                out = defaultVal();
            } else {
                out = defaultVal;
            }
            this.set(key, out);

        }
    }
    return out;
};

Map.prototype.pop = function (key) {
    let out = this.get(key);
    this.delete(key);
    return out;
};

globalThis.object = function (obj, publicInterface = {}) {

    const self = obj;

    for (const [method, func] of Object.entries(publicInterface)) {
        addMethod(method, func);
    }

    addMethod('extends', function (...args) {
        for (const arg of args) {
            mixreturn(arg, self);
        }
    });

    addMethod('mix', function () {
        const args = [].copy(arguments);
        args.unshift(self);
        mixreturn.apply(self, args);
        return self;
    });

    addMethod('addMethod', addMethod);
    addMethod('addReadonlyProperty', addReadonlyProperty);
    addMethod('addReadonlyPropertyCached', addReadonlyProperty);

    const objectMethods = 'mix extends add-method get-methods add-readonly-property add-readonly-property-cached'.flags();

    addMethod('getMethods', () => {

        const out = [];

        const defs = Object.getOwnPropertyDescriptors(self);
        for (const [name, def] of Object.entries(defs)) {

            if (typeof def.value !== 'function') {
                continue;
            }

            if (objectMethods[name]) {
                continue;
            }

            out.push([name, def.value]);
        }
        return out;
    });

    function addReadonlyProperty(name, value) {

        if (typeof name !== 'string') {
            for (const [prop, value] of Object.entries(name)) {
                addReadonlyProperty(prop, value);
            }
            return self;
        }

        if (typeof value === 'function') {

            Object.defineProperty(self, name, {
                get: value,
                enumerable: false,
            });
            return self;

        }

        Object.defineProperty(self, name, {
            writable: false,
            enumerable: false,
            value
        });
        return self;
    }

    function addReadonlyPropertyCached(name, value) {

        if (typeof name !== 'string') {
            for (const [prop, value] of Object.entries(name)) {
                addReadonlyPropertyCached(prop, value);
            }
            return self;
        }

        let cached;

        Object.defineProperty(self, name, {
            get: () => cached ??= value(),
            enumerable: false,
        });

        return self;

    }

    function addMethod(method, func) {

        if (typeof func === 'object') {

            if (typeof func.wait === 'function') {

                const self = this;

                let promise;
                let wait = func.wait;

                func = async function () {

                    let prev = promise;

                    promise = new Promise(async (resolve, reject) => {

                        await prev;

                        try {
                            await wait.apply(self, arguments);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }

                    });

                    return promise;

                }


            } else {
                throw new Error('Not supported method type');
            }

        }

        Object.defineProperty(self, method, {
            value: func,
            enumerable: false,
            writable: true,
        });

    }

    return self;
};

globalThis.object.create = function () {

    if (arguments.length == 1 && is_.arr(arguments[0])) {//several classes to create

        var as = arguments[0];

        var out = [];

        as.each(function (a) {
            out.push(object.create.apply(null, [a]));
        });

        return out;

    }

    if (is_.arr(arguments[0])) {

        var as = $.makeArray(arguments);
        var arr = as.shift();

        var out = [];

        arr.each(function (a) {
            var ps = as.copy();
            ps.push(a);
            out.push(object.create.apply(null, ps));
        });

        return out;
    }

    var args = $.makeArray(arguments);

    var factory = args.shift();

    if (factory.bind) {

        args.unshift(null);

        factory = factory.bind.apply(factory, args);

        var obj = new factory();

    } else {

        var obj = new Function();
        if (obj.__proto__) {
            obj.__proto__.constructor = factory;
        }
        factory.apply(obj, args);

    }

    return obj;

};


/*
    mixes 2 or more objects' methods together so their methods get shared between them
    dst -
 */
/*
    mixes 2 or more objects' methods together so their methods get shared between them
    dst -
 */
globalThis.mixreturn = function (dst, src) {

    //var out=[];//returns overrides;

    if (arguments.length > 2) {//multiple base classes
        var n = 1;
        for (; n < arguments.length; n++) {
            mixreturn(dst, arguments[n]);
        }
        return;
    }

    if (typeof (src) == 'function') {//shortcut: constructor passed as argument
        src = new src();
    }

    // collect class names for diagnostics
    // todo: warn if 2 same classes mixed together

    Object.ensureProperty(dst, '__mixed', [dst.__className || dst.__proto__.constructor.name])
        .push(src.__className || src.__proto__.constructor.name);

    src.hasOwnProperty('__mixed') && (dst.__mixed = dst.__mixed.append(src.__mixed).unique());

    Object.ensureProperty(src, '__mixed', [src.__className || src.__proto__.constructor.name])
        .push(dst.__className || dst.__proto__.constructor.name);

    dst.hasOwnProperty('__mixed') && (src.__mixed = src.__mixed.append(dst.__mixed).unique());

    $.each(src, function (x, func) {

        if (typeof func != 'function') {
            return;
        }

        if (x === 'mix') {
            return;
        }

        /*if (!dst.hasOwnProperty(x)) {//if doesn't exists, simply copy it
            Object.defineProperty(dst, x, {
                value: func.bind(dst),
                writable: true,
            });
            return;
        }*/

        if (!dst[x]) {
            dst[x] = func.bind(dst);
            return;
        }

        var overridden = dst[x];

        var prop = function () {

            var r = func.apply(dst, arguments);

            if (func.collectReturnValues) {

                if (!is_.arr(r)) {
                    r = [r];
                }

                var add = overridden.apply(dst, arguments);
                if (!is_.arr(add)) {
                    add = [add];
                }

                for (var i = 0; i < add.length; i++) {
                    r.push(add[i]);
                }
                return r;
            }

            if (r === undefined) {
                //trace("mixreturn: calling overridden method "+(overridden.name||overridden.source.name)+' of '+dst.__proto__.constructor.name);
                return overridden.apply(dst, arguments);
            }

            return r;

        };


        /*Object.defineProperty(dst, x, {
            value: prop,
            writable: true,
        });*/

        dst[x] = prop;

        // dst[x].overridden=overridden;//mark method for debug purposes
        //src[x]=dst[x];//assigning newly compiled method to source also

    });

    //copying members to source
    for (var x in dst) {
        if (typeof dst[x] == 'function'/*&&!src[x]*/) {
            src[x] = dst[x];
        }
    }

    /*if(document.all && !document.isOpera){
    var p = src.toString;
    if(typeof p == "function" && p != dst.toString && p != tobj.toString &&
      p != "\nfunction toString() {\n    [native code]\n}\n"){
      dst.toString = src.toString;
    }
  }*/

    //return out;
}


globalThis.parseArgs = function (as, flags) {

    flags = flags ? flags.flags() : {};

    var objectCopied = false;

    var out = {};

    for (var i = 0; i < as.length; i++) {
        var a = as[i];
        if (is_numeric(a)) {
            collect('scalar', a);
            collect('number', a);
        } else if (is_string(a)) {
            collect('scalar', a);
            collect('string', a);
            /*} else if (a.__proto__.constructor.name === 'jQuery') {
                collect('jquery', a);
            } else if (a === document || a === globalThis || a instanceof globalThis.Element) {
                collect('jquery', $(a));*/
        } else if (is_array(a)) {
            collect('array', a);
        } else if (typeof a == 'function') {
            collect('cb', a);
            /*} else if (a instanceof jQuery.Event) {
                collect('event', a, false);*/
        } else if (a instanceof globalThis.Error) {
            collect('error', a, false);
        } else if (is_object(a)) {
            collect('object', a);
        } else if (a === false) {
            collect('bool', false);
        } else if (a === true) {
            collect('bool', true);
        }
    }

    if (flags.flags && out.string && out.string.trim()) {//split string as flags
        out.string.trim().split(' ').each(function (n) {
            if (n) {
                out[n] = true;
            }
        });
    }

    return out;

    function collect(name, a, collectObject) {

        if (out[name]) {

            if (is_array(out[name])) {

                out[name].push(a);
                return;

            }

            if (is_object(out[name]) && collectObject !== false) {

                if (flags.noMerge) {
                    out[name] = [out[name], a];
                    return;
                }

                if (!objectCopied) {
                    var obj = out[name];
                    out[name] = {};
                    for (var k in obj) {
                        out[name][k] = obj[k];
                    }
                    objectCopied = true;
                }

                for (var k in a) {
                    out[name][k] = a[k];
                }
                return;

            }

            out[name] = [out[name], a];
            return;
        }

        out[name] = a;
    }

    function is_scalar(val) {
        return val !== null && val !== undefined && (typeof val != 'object') && (typeof val != 'function');
    }

    function is_func(a) {
        return typeof a == 'function';
    }

    function is_array(a) {
        return a instanceof Array;
    }

    function is_object(val) {
        return val !== null && (typeof val == 'object') && !(val instanceof Array);
    }

    function is_numeric(mixed_var) {
        return (typeof (mixed_var) === 'number' || typeof (mixed_var) === 'string') && mixed_var !== '' && !isNaN(mixed_var);
    }

    function is_string(val) {
        return typeof val == 'string';
    }


}


globalThis.iif_ = {

    // if 'fn' is function, executes it and returns true
    // otherwise returns false

    func: function (fn) {
        if (is_.func(fn)) {
            fn.apply(this, Array.slice(arguments, 1));
            return true;
        }
        return false;
    },

};

globalThis.if_ = {

    // if 'fn' is function, executes it and returns the result
    // otherwise returns 'fn' value

    func: function (fn) {
        return is_.func(fn) ? fn.apply(this, Array.slice(arguments, 1)) : fn;
    },
};

globalThis.is_ = {
    empty: function (val) {
        return val === null || val === undefined || val === '';
    },
    scalar: function (val) {
        return val !== null && val !== undefined && (typeof val != 'object') && (typeof val != 'function');
    },

    func: function (a) {
        return typeof a == 'function';
    },

    arr: function (a) {
        return a instanceof Array;
    },

    obj: function (val) {
        return val !== null && (typeof val == 'object') && !(val instanceof Array);
    },

    num: function (mixed_var) {
        return (typeof (mixed_var) === 'number' || typeof (mixed_var) === 'string') && mixed_var !== '' && !isNaN(mixed_var);
    },

    str: function (val) {
        return typeof val == 'string';
    },
};
