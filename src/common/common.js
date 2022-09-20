{

    const exp = /\S+/mg;

    Object.defineProperty(String.prototype, 'words', {
        get() {
            return this.match(exp) || [];
        }
    });
}

Object.defineProperty(Array.prototype, 'words', {
    get() {
        return this;
    }
});

//todo: add support for callbacks,fields
Array.prototype.max = function (what, outWhat) {

    let accessor = what;
    let outAccessor = outWhat;

    if (typeof what === 'string') {
        accessor = new Function('item', 'try { return item.' + what + '; } catch (e) { }');
        if (typeof outWhat === 'string') {
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

Array.prototype.remove = function (val) {

    let idx = this.indexOf(val);

    if (idx > -1) {
        this.splice(idx, 1);
    }

    return this;
};

Array.prototype.removeArray = function (val) {

    if (typeof val === 'string') {
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

{

    const _find = Array.prototype.find;

    Array.prototype.find = function () {

        arguments[0] = Array.prototype.createFilter.apply(this, arguments);

        return _find.apply(this, arguments);

    };
}
