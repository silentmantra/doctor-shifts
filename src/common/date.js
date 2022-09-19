var iso8601DateTimeZ = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))|(\d{4}-[01]\d-[0-3]\d)$/;
var iso8601Date = /^\d{4}-[01]\d-[0-3]\d$/;
var iso8601DateTimeNoZone = /^\d{4}-[01]\d-[0-3]\d[\sT]\d{2}:\d{2}:\d{2}$/;

Date.prototype.dayPercent = function (day, decimals = 2) {

    const days = -this.daysTo(day);

    const hour = this.getHours();
    const minutes = this.getMinutes();
    const seconds = this.getSeconds();

    const decimal = hour + (minutes / 60) + (seconds / 3600);

    if (decimals) {
        return ((days + decimal / 24) * 100).toFixed(decimals);
    }

    return (days + decimal / 24) * 100;

};

Date.reviver = function (k, v) {

    if (typeof v === 'string') {

        let noZone;

        if (iso8601DateTimeZ.test(v) || iso8601Date.test(v) || (noZone = iso8601DateTimeNoZone.test(v))) {

            if (noZone) {
                v += 'Z';
            }

            return Date.parseUTC(v);

        }

    }

    return v;

}

var stdTimeZoneOffset = (function () {

    var jan = new Date(new Date().getFullYear(), 0, 1);
    var jul = new Date(new Date().getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

})();

/**
 * @class
 * Creates a date range from an array-like of dates [start, end]
 */
function DateRange(from, to) {

    var self = this;

    if (!(from instanceof Date)) {

        self.push(from[0]);
        self.push(from[1]);

    } else {

        self.push(from);
        self.push(to);
    }

}

DateRange.prototype = Object.create(Array.prototype);
DateRange.prototype.constructor = DateRange;

/**
 * overlaps([date, date]) : bool
 * > Checks whether the range overlaps another range
 *
 * overlaps([item], 'start end') : [item]
 * > Given an array of items returns items that overlap the range.
 * > Provide start and end field names in an item
 *
 * overlaps([item], cb(item) : [date, date]) : [item]
 * > Given an array of items returns items that overlap the range.
 * > Return a range in the callback
 */

DateRange.prototype.overlaps = function (range, fields) {

    var self = this;

    if (typeof fields === 'string') {

        var names = fields.words();

        if (names.length != 2) {
            throw 'DateRange::overlaps() - wrong field number for an item';
        }

        return this.overlaps(range, function (item) {
            return item.extract(names);
        });
    }

    if (typeof fields === 'function') {
        return range.filter(function (item) {
            return self.overlaps(fields(item));
        });
    }

    return self.includes(range[0]) || self.includes(range[1]);
};

//todo: add format param
DateRange.prototype.toString = function () {
    return this[0].format('DD.MM.YYYY') + ' - ' + this[1].format('DD.MM.YYYY');
};

/**
 * Returns the range's duration in days or weeks
 * @param {('weeks'|'days')} [what=days] - 'days' or 'weeks'
 * @returns {int} number of days or weeks
 */
//todo: dump name, rename durationInDays or/and add other units
DateRange.prototype.duration = function (what) {

    what = what || 'days';

    if (what == 'days') {
        return this[0].durationInDays(this[1]);
    }
    if (what == 'weeks') {
        return this[0].durationInDays(this[1]) / 7;
    }
};

/**
 * eachDay(cb(date) : *) : cb>[]
 * > Calls the callback for each day in the range.
 */
DateRange.prototype.eachDay = function (cb) {
    return this[0].eachDayTo(this[1], cb);
};

/**
 * @methodOf DateRange
 * includes(date) : bool
 * > Checks whether a date is within the range
 *
 * includes([date, date]) : bool
 * > Checks whether a range is within the range
 */
DateRange.prototype.includes = function (...args) {

    const dates = args.flatMap(arg => arg instanceof Array ? [...arg] : arg);

    for (let i = 0, len = dates.length; i < len; i++) {
        if (!dates[i].isBetween(this)) {
            return false;
        }
    }

    return true;
};


DateRange.prototype.move = function (time) {
    return new DateRange(self[0].addTime(time), self[1].addTime(time));
};

DateRange.prototype.isSame = function (range) {
    return this[0].isSame(range[0]) && this[1].isSame(range[1]);
};

DateRange.prototype.set = function (from, to) {
    if (from instanceof Array || from instanceof DateRange) {

        this[0] = from[0];
        this[1] = from[1];

    } else {

        this[0] = from;
        this[1] = to;
    }
};

/**
 * Returns a copy of the range
 */
DateRange.prototype.copy = function () {
    return new DateRange(this);
};

/**
 * Returns a copy of the range
 */
DateRange.prototype.clone = function () {
    return new DateRange(this);
};

//todo: optimize?
DateRange.prototype.compare = function (compareWith, fnAddRange, fnDeleteRange) {

    if (!compareWith) {
        fnAddRange(this);
        return this;
    }

    if (!this.overlaps(compareWith)) {
        fnDeleteRange(compareWith);
        fnAddRange(this);
        return this;
    }

    //overlapping cases

    var ops = [];

    if (this[0] < compareWith[0]) {
        ops.push({
            sort: 1,
            fn: fnAddRange,
            args: [this[0], compareWith[0], 'before'],
        });
    } else if (this[0] > compareWith[0]) {
        ops.push({
            sort: 0,
            fn: fnDeleteRange,
            args: [compareWith[0], this[0]],
        });
    }

    if (this[1] > compareWith[1]) {
        ops.push({
            sort: 1,
            fn: fnAddRange,
            args: [compareWith[1], this[1], 'after'],
        });
    } else if (this[1] < compareWith[1]) {
        ops.push({
            sort: 0,
            fn: fnDeleteRange,
            args: [this[1], compareWith[1]],
        });
    }

    ops.sortBy('sort').each(function (op) {
        var args = op.args;
        var range = new DateRange(args[0], args[1]);
        args.shift();
        args.shift();
        args.unshift(range);
        op.fn.apply(this, args);
    });


    return this;

};

window.DateRange = DateRange;

// support empty param list
const _UTC = Date.UTC;

Date.UTC = function () {

    if (arguments.length) {
        return _UTC.apply(Date, arguments);
    }

    let date = new Date;

    return _UTC.call(Date, ...date.toArray());

};

let locale = 'en';

Date.setLocale = function (value) {
    locale = value;
};

Date.prototype.toArray = function () {
    return [this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getSeconds(), this.getMilliseconds()];
};

{
    let parseObjectCbs = [];

    Date.addParseObjectCb = function (val) {
        parseObjectCbs.push(val);
    };

    Date.parseObject = function (data, objectCallback, convertFn = Date.parseUTC) {

        if (parseObjectCbs.length) {

            let cs;

            if (objectCallback) {
                cs = parseObjectCbs.copy();
                cs.push(objectCallback);
            } else {
                cs = parseObjectCbs;
            }

            objectCallback = data => {
                for (let i = 0, len = cs.length; i < len; i++) {
                    cs[i](data);
                }
            };
        }

        process(data);
        return data;

        function process(data) {

            if (data instanceof Array) {
                data.each(process);
            } else if (typeof data === 'object' && data !== null) {

                var keys = Object.keys(data);

                for (var i = 0, len = keys.length; i < len; i++) {

                    var k = keys[i];
                    var v = data[k];

                    if (!v) {

                        continue;

                    } else if (typeof v === 'string') {

                        if (v === '0000-00-00') {

                            data[k] = null;

                        } else {

                            var noZone;

                            if (iso8601DateTimeZ.test(v) || iso8601Date.test(v) || (noZone = iso8601DateTimeNoZone.test(v))) {

                                if (noZone) {
                                    v += 'Z';
                                }

                                data[k] = convertFn(v);

                                // probably it's a bad idea to remove invalid dates (could cause failure in the client code)
                                /*if (!data[k].valid()) {
                                    // delete all invalid dates (f.e. with time zones)
                                    delete data[k];
                                }*/
                            }
                        }

                    } else {
                        process(v);
                    }


                }

                if (objectCallback) {
                    objectCallback(data);
                }
            }

        }

    };

    Date.parseObjectDirect = function (data, objectCallback) {

        if (parseObjectCbs.length) {

            let cs;

            if (objectCallback) {
                cs = parseObjectCbs.copy();
                cs.push(objectCallback);
            } else {
                cs = parseObjectCbs;
            }

            objectCallback = data => {
                for (let i = 0, len = cs.length; i < len; i++) {
                    cs[i](data);
                }
            };
        }

        process(data);
        return data;

        function process(data) {

            if (data instanceof Array) {
                data.each(process);
            } else if (typeof data === 'object' && data !== null) {

                var keys = Object.keys(data);

                for (var i = 0, len = keys.length; i < len; i++) {

                    var k = keys[i];
                    var v = data[k];

                    if (!v) {
                        continue;
                    } else if (typeof v === 'string' && iso8601DateTimeZ.test(v)) {
                        data[k] = new Date(v);
                    } else {
                        process(v);
                    }

                }

                if (objectCallback) {
                    objectCallback(data);
                }
            }

        }

    };

}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function removeLastChar(str) {
    return str.slice(0, -1);
}

Date.fromTime = function (time) {

    if (time instanceof Date) {
        return time.clone();
    }

    var out = new Date();
    var ts = time.split(':');
    out.setHours(ts[0], ts[1], ts[2] || 0);
    out.setMilliseconds(0);
    return out;
};

Date.parseUTC = function (from) {

    var len = from.length;

    if (len === 10) {
        from += 'T00:00:00Z';
    }

    var out = new Date(from);

    if (out.valid()) {
        return new Date(out.getTime() + out.getTimezoneOffset() * 1000 * 60);
    }

    return $moment(from).toDate();


};

Date.prototype.addTimezoneOffset = function () {

    return new Date(this.getTime() - this.getTimezoneOffset() * 1000 * 60);

};

Date.prototype.removeTimezoneOffset = function () {

    return new Date(this.getTime() + this.getTimezoneOffset() * 1000 * 60);

};

const usFormatReplacementsCache = {};

const usFormatReplacements = [
    [/(d{1,2})\.(m{1,2})\.(y{1,4})/i, '$2/$1/$3'],
    [/(d{1,2})\.(m{1,2})/i, '$2/$1'],
];

Date.prototype.format = function (format) {

    //todo: add support locales

    if (format == 'humanDate') {
        if (this.isToday()) {
            return 'Today';
        }

        if (this.isYesterday()) {
            return 'Yesterday';
        }

        if (this.isTomorrow()) {
            return 'Tomorrow';
        }

        format = 'shortDate';
    }

    if (locale === 'en_US') {

        if (format === 'short') {
            return usDate(this) + ' ' + usTime(this);
        }
        if (format === 'shortDate') {
            return usDate(this);
        }
        if (format === 'shortTime') {
            return usTime(this);
        }

        let formatted = usFormatReplacementsCache[format];
        if (!formatted) {

            let replaced;

            for (let i = 0, len = usFormatReplacements.length; i < len; i++) {

                replaced = format.replace.apply(format, usFormatReplacements[i]);
                if (replaced !== format) {
                    break;
                }

            }

            format = usFormatReplacementsCache[format] = replaced || format;

        } else {

            format = formatted;
        }


    } else {

        if (format === 'short') {
            return pad(this.getDate()) + '.' + pad(this.getMonth() + 1) + '.' +
                this.getFullYear().toString().substr(2, 2) + ' ' + pad(this.getHours()) + ':' + pad(this.getMinutes());
        }
        if (format === 'shortDate') {
            return pad(this.getDate()) + '.' + pad(this.getMonth() + 1) + '.' +
                this.getFullYear().toString().substr(2, 2);
        }
        if (format === 'shortTime') {
            return pad(this.getHours()) + ':' + pad(this.getMinutes());
        }

    }

    return $moment(this).format(format);

    function usDate(date) {
        let y = date.getFullYear().toString().substr(2, 2);
        let m = pad(date.getMonth() + 1);
        let d = pad(date.getDate());
        return m + '/' + d + '/' + y;
    }

    function usTime(date) {

        let h = date.getHours(), m = date.getMinutes();

        return pad(h) + ':' + pad(m);

        // no support for 12h format yet;

        /*

        if (h === 0) {
            return '12:' + pad(m) + 'am';
        }
        if (h < 12) {
            return pad(h) + ':' + pad(m) + 'am';
        }
        if (h === 12) {
            return '12:' + pad(m) + 'pm';
        }
        return pad(h - 12) + ':' + pad(m) + 'pm';

         */
    }

    function pad(input) {
        if (input < 10) {
            return '0' + input;
        }
        return input;
    }

};

Date.prototype.valid = function () {
    return !isNaN(this.getTime());
};

Date.prototype.ifNull = function () {
    return this.valid() ? new Date(this) : null;
};

Date.prototype.isSame = function (date) {
    return this.getTime() == date.getTime();
};


Date.prototype.isDST = function () {
    return this.getTimezoneOffset() < stdTimeZoneOffset;
};

Date.prototype.getDSTOffset = function () {
    return this.getTimezoneOffset() - stdTimeZoneOffset;
};

//todo: cache?
Date.prototype.getDSTAdjustment = function () {
    return this.addDay().getDSTOffset() - this.getDSTOffset();
};

Date.prototype.copyTime = function (from) {

    var out = this.clone();

    out.setHours(from.getHours());
    out.setMinutes(from.getMinutes());
    out.setSeconds(from.getSeconds());
    out.setMilliseconds(from.getMilliseconds());

    var adjust = out.getDSTAdjustment();
    adjust && out.addMinutes(adjust);

    return out;

};

Date.uniqueTimes = function (arr) {

    //todo: optimize, milliseconds?

    var times = {};
    arr.each(function (time) {
        times[time ? time.format('HH:mm:ss') : 'null'] = true;
    });

    var out = [];

    for (var k in times) {
        out.push(k == 'null' ? null : Date.fromTime(k));
    }

    return out;

};

Date.prototype.isSameDate = function (date) {
    return this.date().isSame(date.date());
};

//todo: optimize isSameXXX

Date.prototype.isSameHour = function (date) {
    return this.format('HHDDMMYYYY') == date.format('HHDDMMYYYY');
};

Date.prototype.isSameDay = function (date) {
    return this.format('DDMMYYYY') == date.format('DDMMYYYY');
};

Date.prototype.isSameMonth = function (date) {
    return this.format('MMYYYY') == date.format('MMYYYY');
};

Date.prototype.isSameYear = function (date) {
    return this.getFullYear() == date.getFullYear();
};

Date.prototype.isSameWeekDay = function (date) {

    if (date instanceof Date) {
        return this.getDay() == date.getDay();
    } else if (typeof date == 'number') {
        return this.getDay() == date;
    }

    return this.getDay() == $moment().day(date).day();

};

Date.prototype.getYearDay = function () {
    return this.durationInDays(new Date(this.getFullYear(), 0, 1)) + 1;
};

Date.fromDay = function (day) {
    return $moment().day(day).toDate();
};

Date.prototype.isSameTime = function (date, format) {
    format = format || 'HH:mm:ss';
    return $moment(this).format(format) == moment(date).format(format);
};

Date.prototype.clone = function () {
    return new Date(this.getTime());
};

Date.prototype.set = function () {

    var out = this.clone();

    var methods = 'setYear setMonth setDate setHours setMinutes setSeconds setMilliseconds'.words();
    arguments.each(function (idx, v) {
        if (v === null) {
            return;
        }
        if (v === undefined) {
            return false;
        }

        var m = methods[parseInt(idx)];
        out[m](v);
    });

    return out;
};

Date.prototype.date = function () {
    return new Date(this.toDateString());
};

Date.prototype.toDate = Date.prototype.date;

Date.prototype.isLeapYear = function () {
    var dt = new Date(this.getFullYear(), 0, 1);
    var diff = dt.daysTo(dt.addYear());
    return diff == 366;
};

Date.prototype.snapDayNearest = function (day) {

    var prev = this.snapDayBack(day);

    var next = prev.addDay(7);

    if (this.getTime() - prev.getTime() > next.getTime() - this.getTime()) {
        return next;
    }

    return prev;

};

Date.prototype.snapDayForward = function (day) {

    var cur = this.getDay();

    if (typeof day != 'number') {
        day = Date.fromDay(day).getDay();
    }

    if (cur == day) {
        return this.toDate();
    }

    if (day < cur) {
        return this.toDate().addDay(((7 - cur) + day));
    } else {
        return this.toDate().addDay(day - cur);
    }

};

Date.prototype.snapDayBack = function (day) {

    var cur = this.getDay();

    if (typeof day != 'number') {
        day = Date.fromDay(day).getDay();
    }

    if (cur == day) {
        return this.toDate();
    }

    if (day > cur) {
        return this.toDate().addDay(-((7 - day) + cur));
    } else {
        return this.toDate().addDay(-(cur - day));
    }

};

Date.today = function () {
    //var now=Date.now();
    //var dt=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    var dt = new Date(new Date(Date.now()).toDateString());
    return dt.getTime();
};

Date.yesterday = function () {
    return Date.Yesterday().getTime();
};

Date.tomorrow = function () {
    return Date.Tomorrow().getTime();
};

Date.Tomorrow = function () {
    return Date.Today().addDay();
};

Date.Yesterday = function () {
    return Date.Today().addDay(-1);
};

Date.Today = function () {
    const out = new Date;
    out.setHours(0, 0, 0, 0);
    return out;
};

Date.prototype.addMonth = function (months) {
    months = arguments.length ? months : 1;
    return $moment(this).add(months, 'months').toDate();
};

Date.prototype.addYear = function (years) {
    years = arguments.length ? years : 1;
    return $moment(this).add(years, 'years').toDate();
};

Date.prototype.getDayTime = function () {
    return this.getTime() - this.clone().setHours(0, 0, 0, 0);
};

Date.prototype.addTime = function (time) {
    return new Date(this.getTime() + time);
};

Date.prototype.addWeek = function (weeks) {
    weeks = arguments.length ? weeks : 1;
    return this.addWeeks(weeks);
};

Date.prototype.addWeeks = function (weeks) {
    return new Date(this.getTime() + weeks * 7 * 24 * 3600 * 1000);
};

Date.prototype.daysTo = function (dt) {
    //fixme: should use date methods to ensure DTS & leap years
    return parseInt(Math.ceil((dt.getTime() - this.getTime() + this.timezoneOffsetDiff(dt)) / 1000 / 3600 / 24));
};

Date.prototype.timezoneOffsetDiff = function (dt) {

    var offset1 = this.getTimezoneOffset();
    var offset2 = dt.getTimezoneOffset();

    return (offset1 - offset2) * 60 * 1000;

};

Date.prototype.durationInDays = function (dt) {
    return Math.abs(this.daysTo(dt));
};

Date.prototype.eachDayOf = function (len, cb) {

    var out = [];

    for (var i = 0; i < len; i++) {
        var dd = this.addDays(i);
        out.push(cb(dd));
    }

    return out;
};

Date.prototype.eachWeekOf = function (len, cb) {

    var out = [];

    for (var i = 0; i < len; i++) {
        var dd = this.addWeek(i);
        out.push(cb(dd));
    }

    return out;
};


Date.prototype.eachDayTo = function (dt, cb) {

    var out = [];

    var len = this.daysTo(dt);
    for (var i = 0; i <= len; i++) {
        var dd = this.addDays(i);
        out.push(cb(dd), i);
    }

    return out;
};

Date.prototype.eachDayBefore = function (dt, cb) {

    var out = [];

    var len = this.daysTo(dt);
    for (var i = 0; i < len; i++) {
        var dd = this.addDays(i);
        out.push(cb(dd));
    }

    return out;
};

Date.prototype.isBetween = function (dt1, dt2) {

    if (dt1 instanceof Array) {
        return this >= dt1[0] && this <= dt1[1];
    }

    return this >= dt1 && this <= dt2;
};

Date.prototype.addDay = function (days = 1) {
    return this.addDays(days);
};

Date.prototype.addDays = function (days) {
    var date = new Date(this.getTime());
    date.setDate(this.getDate() + days);
    return date;
};

Date.prototype.addHour = function (hours = 1) {
    return new Date(this.getTime() + hours * 3600 * 1000);
};

Date.prototype.addHours = function (hours) {
    return new Date(this.getTime() + hours * 3600 * 1000);
};

Date.prototype.addMinutes = function (minutes) {
    return new Date(this.getTime() + minutes * 60 * 1000);
};

Date.prototype.isToday = function () {
    //fixme : optimize
    return this.date().isSame(Date.Today().date());
};

Date.prototype.isYesterday = function () {
    return this.toDate().isSame(Date.Yesterday());
};

Date.prototype.isTomorrow = function () {
    return this.toDate().isSame(Date.Tomorrow());
};

Date.prototype.isWeekend = function () {
    return [0, 6].contains(this.getDay());
};

Date.prototype.getWeek = function (dowOffset) {
    /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

    dowOffset = /* typeof (dowOffset) === 'number' ? dowOffset :*/ 0; //default dowOffset to zero
    var newYear = new Date(this.getFullYear(), 0, 1);
    var day = newYear.getDay() - dowOffset; //the day of week the year begins on
    day = (day >= 0 ? day : day + 7);
    var daynum = Math.floor((this.getTime() - newYear.getTime() -
        (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
    var weeknum;
    //if the year starts before the middle of a week
    if (day < 4) {
        weeknum = Math.floor((daynum + day - 1) / 7) + 1;
        if (weeknum > 52) {
            var nYear = new Date(this.getFullYear() + 1, 0, 1);
            var nday = nYear.getDay() - dowOffset;
            nday = nday >= 0 ? nday : nday + 7;
            /*if the next year starts before the middle of
              the week, it is week #1 of that year*/
            weeknum = nday < 4 ? 1 : 53;
        }
    } else {
        weeknum = Math.floor((daynum + day - 1) / 7);
    }
    return weeknum;
};


/**
 * Max date value for events.
 * Purpose is to provide a placeholder for events without an end date
 * while still allowing queries and filtering to happen normally.
 */
const MAX_EVENT_DATE = new Date(2100, 0, 1);

Date.maxEventDate = function () {
    return new Date(MAX_EVENT_DATE);
};

Date.prototype.isMaxEventDate = function () {
    return this.isSameDate(MAX_EVENT_DATE);
};


