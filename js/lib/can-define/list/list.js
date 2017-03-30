/*can-define@1.0.17#list/list*/
define(function (require, exports, module) {
    var Construct = require('can-construct/can-construct');
    var define = require('can-define/can-define');
    var make = define.make;
    var canEvent = require('can-event/can-event');
    var canBatch = require('can-event/batch/batch');
    var Observation = require('can-observation/can-observation');
    var canLog = require('can-util/js/log/log');
    var defineHelpers = require('can-define/define-helpers/define-helpers');
    var assign = require('can-util/js/assign/assign');
    var each = require('can-util/js/each/each');
    var isArray = require('can-util/js/is-array/is-array');
    var makeArray = require('can-util/js/make-array/make-array');
    var types = require('can-types/can-types');
    var ns = require('can-namespace/can-namespace');
    var splice = [].splice;
    var identity = function (x) {
        return x;
    };
    var makeFilterCallback = function (props) {
        return function (item) {
            for (var prop in props) {
                if (item[prop] !== props[prop]) {
                    return false;
                }
            }
            return true;
        };
    };
    var DefineList = Construct.extend('DefineList', {
        setup: function (base) {
            if (DefineList) {
                var prototype = this.prototype;
                var result = define(prototype, prototype, base.prototype._define);
                var itemsDefinition = result.definitions['#'] || result.defaultDefinition;
                if (itemsDefinition) {
                    if (itemsDefinition.Type) {
                        this.prototype.__type = make.set.Type('*', itemsDefinition.Type, identity);
                    } else if (itemsDefinition.type) {
                        this.prototype.__type = make.set.type('*', itemsDefinition.type, identity);
                    }
                }
            }
        }
    }, {
        setup: function (items) {
            if (!this._define) {
                Object.defineProperty(this, '_define', {
                    enumerable: false,
                    value: { definitions: {} }
                });
                Object.defineProperty(this, '_data', {
                    enumerable: false,
                    value: {}
                });
            }
            define.setup.call(this, {}, false);
            this._length = 0;
            if (items) {
                this.splice.apply(this, [
                    0,
                    0
                ].concat(defineHelpers.toObject(this, items, [], DefineList)));
            }
        },
        __type: define.types.observable,
        _triggerChange: function (attr, how, newVal, oldVal) {
            canBatch.start();
            var index = +attr;
            if (!~('' + attr).indexOf('.') && !isNaN(index)) {
                var itemsDefinition = this._define.definitions['#'];
                if (how === 'add') {
                    if (itemsDefinition && typeof itemsDefinition.added === 'function') {
                        Observation.ignore(itemsDefinition.added).call(this, newVal, index);
                    }
                    canEvent.dispatch.call(this, how, [
                        newVal,
                        index
                    ]);
                    canEvent.dispatch.call(this, 'length', [this._length]);
                } else if (how === 'remove') {
                    if (itemsDefinition && typeof itemsDefinition.removed === 'function') {
                        Observation.ignore(itemsDefinition.removed).call(this, oldVal, index);
                    }
                    canEvent.dispatch.call(this, how, [
                        oldVal,
                        index
                    ]);
                    canEvent.dispatch.call(this, 'length', [this._length]);
                } else {
                    canEvent.dispatch.call(this, how, [
                        newVal,
                        index
                    ]);
                }
            } else {
                canEvent.dispatch.call(this, {
                    type: '' + attr,
                    target: this
                }, [
                    newVal,
                    oldVal
                ]);
            }
            canBatch.stop();
        },
        get: function (index) {
            if (arguments.length) {
                Observation.add(this, '' + index);
                return this[index];
            } else {
                return defineHelpers.serialize(this, 'get', []);
            }
        },
        set: function (prop, value) {
            if (typeof prop !== 'object') {
                prop = isNaN(+prop) || prop % 1 ? prop : +prop;
                if (typeof prop === 'number') {
                    if (typeof prop === 'number' && prop > this._length - 1) {
                        var newArr = new Array(prop + 1 - this._length);
                        newArr[newArr.length - 1] = value;
                        this.push.apply(this, newArr);
                        return newArr;
                    }
                    this.splice(prop, 1, value);
                } else {
                    var defined = defineHelpers.defineExpando(this, prop, value);
                    if (!defined) {
                        this[prop] = value;
                    }
                }
            } else {
                if (isArray(prop)) {
                    if (value) {
                        this.replace(prop);
                    } else {
                        this.splice.apply(this, [
                            0,
                            prop.length
                        ].concat(prop));
                    }
                } else {
                    each(prop, function (value, prop) {
                        this.set(prop, value);
                    }, this);
                }
            }
            return this;
        },
        _items: function () {
            var arr = [];
            this._each(function (item) {
                arr.push(item);
            });
            return arr;
        },
        _each: function (callback) {
            for (var i = 0, len = this._length; i < len; i++) {
                callback(this[i], i);
            }
        },
        splice: function (index, howMany) {
            var args = makeArray(arguments), added = [], i, len, listIndex, allSame = args.length > 2;
            index = index || 0;
            for (i = 0, len = args.length - 2; i < len; i++) {
                listIndex = i + 2;
                args[listIndex] = this.__type(args[listIndex], listIndex);
                added.push(args[listIndex]);
                if (this[i + index] !== args[listIndex]) {
                    allSame = false;
                }
            }
            if (allSame && this._length <= added.length) {
                return added;
            }
            if (howMany === undefined) {
                howMany = args[1] = this._length - index;
            }
            var removed = splice.apply(this, args);
            canBatch.start();
            if (howMany > 0) {
                this._triggerChange('' + index, 'remove', undefined, removed);
            }
            if (args.length > 2) {
                this._triggerChange('' + index, 'add', added, removed);
            }
            canBatch.stop();
            return removed;
        },
        serialize: function () {
            return defineHelpers.serialize(this, 'serialize', []);
        }
    });
    var getArgs = function (args) {
        return args[0] && Array.isArray(args[0]) ? args[0] : makeArray(args);
    };
    each({
        push: 'length',
        unshift: 0
    }, function (where, name) {
        var orig = [][name];
        DefineList.prototype[name] = function () {
            var args = [], len = where ? this._length : 0, i = arguments.length, res, val;
            while (i--) {
                val = arguments[i];
                args[i] = this.__type(val, i);
            }
            res = orig.apply(this, args);
            if (!this.comparator || args.length) {
                this._triggerChange('' + len, 'add', args, undefined);
            }
            return res;
        };
    });
    each({
        pop: 'length',
        shift: 0
    }, function (where, name) {
        DefineList.prototype[name] = function () {
            if (!this._length) {
                return undefined;
            }
            var args = getArgs(arguments), len = where && this._length ? this._length - 1 : 0;
            var res = [][name].apply(this, args);
            this._triggerChange('' + len, 'remove', undefined, [res]);
            return res;
        };
    });
    assign(DefineList.prototype, {
        indexOf: function (item, fromIndex) {
            for (var i = fromIndex || 0, len = this.length; i < len; i++) {
                if (this.get(i) === item) {
                    return i;
                }
            }
            return -1;
        },
        join: function () {
            Observation.add(this, 'length');
            return [].join.apply(this, arguments);
        },
        reverse: function () {
            var list = [].reverse.call(this._items());
            return this.replace(list);
        },
        slice: function () {
            Observation.add(this, 'length');
            var temp = Array.prototype.slice.apply(this, arguments);
            return new this.constructor(temp);
        },
        concat: function () {
            var args = [];
            each(arguments, function (arg) {
                if (types.isListLike(arg) || Array.isArray(arg)) {
                    var arr = types.isListLike(arg) ? makeArray(arg) : arg;
                    each(arr, function (innerArg) {
                        args.push(this.__type(innerArg));
                    }, this);
                } else {
                    args.push(this.__type(arg));
                }
            }, this);
            return new this.constructor(Array.prototype.concat.apply(makeArray(this), args));
        },
        forEach: function (cb, thisarg) {
            var item;
            for (var i = 0, len = this.length; i < len; i++) {
                item = this.get(i);
                if (cb.call(thisarg || item, item, i, this) === false) {
                    break;
                }
            }
            return this;
        },
        replace: function (newList) {
            this.splice.apply(this, [
                0,
                this._length
            ].concat(makeArray(newList || [])));
            return this;
        },
        filter: function (callback, thisArg) {
            var filteredList = [], self = this, filtered;
            if (typeof callback === 'object') {
                callback = makeFilterCallback(callback);
            }
            this.each(function (item, index, list) {
                filtered = callback.call(thisArg | self, item, index, self);
                if (filtered) {
                    filteredList.push(item);
                }
            });
            return new this.constructor(filteredList);
        },
        map: function (callback, thisArg) {
            var mappedList = [], self = this;
            this.each(function (item, index, list) {
                var mapped = callback.call(thisArg | self, item, index, self);
                mappedList.push(mapped);
            });
            return new this.constructor(mappedList);
        },
        sort: function (compareFunction) {
            var removed = Array.prototype.slice.call(this);
            Array.prototype.sort.call(this, compareFunction);
            var added = Array.prototype.slice.call(this);
            canBatch.start();
            canEvent.dispatch.call(this, 'remove', [
                removed,
                0
            ]);
            canEvent.dispatch.call(this, 'add', [
                added,
                0
            ]);
            canEvent.dispatch.call(this, 'length', [
                this._length,
                this._length
            ]);
            canBatch.stop();
            return this;
        }
    });
    for (var prop in define.eventsProto) {
        DefineList[prop] = define.eventsProto[prop];
        Object.defineProperty(DefineList.prototype, prop, {
            enumerable: false,
            value: define.eventsProto[prop],
            writable: true
        });
    }
    Object.defineProperty(DefineList.prototype, 'length', {
        get: function () {
            if (!this.__inSetup) {
                Observation.add(this, 'length');
            }
            return this._length;
        },
        set: function (newVal) {
            this._length = newVal;
        },
        enumerable: true
    });
    var oldIsListLike = types.isListLike;
    types.isListLike = function (obj) {
        return obj instanceof DefineList || oldIsListLike.apply(this, arguments);
    };
    DefineList.prototype.each = DefineList.prototype.forEach;
    DefineList.prototype.attr = function (prop, value) {
        canLog.warn('DefineMap::attr shouldn\'t be called');
        if (arguments.length === 0) {
            return this.get();
        } else if (prop && typeof prop === 'object') {
            return this.set.apply(this, arguments);
        } else if (arguments.length === 1) {
            return this.get(prop);
        } else {
            return this.set(prop, value);
        }
    };
    DefineList.prototype.item = function (index, value) {
        if (arguments.length === 1) {
            return this.get(index);
        } else {
            return this.set(index, value);
        }
    };
    DefineList.prototype.items = function () {
        canLog.warn('DefineList::get should should be used instead of DefineList::items');
        return this.get();
    };
    types.DefineList = DefineList;
    types.DefaultList = DefineList;
    module.exports = ns.DefineList = DefineList;
});