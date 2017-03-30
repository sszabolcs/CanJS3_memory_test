/*can-define@1.0.17#can-define*/
define(function (require, exports, module) {
    'use strict';
    'format cjs';
    var event = require('can-event/can-event');
    var eventLifecycle = require('can-event/lifecycle/lifecycle');
    var canBatch = require('can-event/batch/batch');
    var canEvent = require('can-event/can-event');
    var compute = require('can-compute/can-compute');
    var Observation = require('can-observation/can-observation');
    var isEmptyObject = require('can-util/js/is-empty-object/is-empty-object');
    var assign = require('can-util/js/assign/assign');
    var dev = require('can-util/js/dev/dev');
    var CID = require('can-cid/can-cid');
    var isPlainObject = require('can-util/js/is-plain-object/is-plain-object');
    var isArray = require('can-util/js/is-array/is-array');
    var types = require('can-types/can-types');
    var each = require('can-util/js/each/each');
    var defaults = require('can-util/js/defaults/defaults');
    var ns = require('can-namespace/can-namespace');
    var eventsProto, define, make, makeDefinition, replaceWith, getDefinitionsAndMethods, isDefineType, getDefinitionOrMethod;
    var defineConfigurableAndNotEnumerable = function (obj, prop, value) {
        Object.defineProperty(obj, prop, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: value
        });
    };
    var eachPropertyDescriptor = function (map, cb) {
        for (var prop in map) {
            if (map.hasOwnProperty(prop)) {
                cb(prop, Object.getOwnPropertyDescriptor(map, prop));
            }
        }
    };
    module.exports = define = ns.define = function (objPrototype, defines, baseDefine) {
        var dataInitializers = Object.create(baseDefine ? baseDefine.dataInitializers : null), computedInitializers = Object.create(baseDefine ? baseDefine.computedInitializers : null);
        var result = getDefinitionsAndMethods(defines, baseDefine);
        result.dataInitializers = dataInitializers;
        result.computedInitializers = computedInitializers;
        each(result.definitions, function (definition, property) {
            define.property(objPrototype, property, definition, dataInitializers, computedInitializers);
        });
        replaceWith(objPrototype, '_data', function () {
            var map = this;
            var data = {};
            for (var prop in dataInitializers) {
                replaceWith(data, prop, dataInitializers[prop].bind(map), true);
            }
            return data;
        });
        replaceWith(objPrototype, '_computed', function () {
            var map = this;
            var data = {};
            for (var prop in computedInitializers) {
                replaceWith(data, prop, computedInitializers[prop].bind(map));
            }
            return data;
        });
        for (var prop in eventsProto) {
            Object.defineProperty(objPrototype, prop, {
                enumerable: false,
                value: eventsProto[prop],
                configurable: true,
                writable: true
            });
        }
        Object.defineProperty(objPrototype, '_define', {
            enumerable: false,
            value: result,
            configurable: true,
            writable: true
        });
        if (!objPrototype[types.iterator]) {
            defineConfigurableAndNotEnumerable(objPrototype, types.iterator, function () {
                return new define.Iterator(this);
            });
        }
        return result;
    };
    define.extensions = function () {
    };
    var onlyType = function (obj) {
        for (var prop in obj) {
            if (prop !== 'type') {
                return false;
            }
        }
        return true;
    };
    define.property = function (objPrototype, prop, definition, dataInitializers, computedInitializers) {
        var propertyDefinition = define.extensions.apply(this, arguments);
        if (propertyDefinition) {
            definition = propertyDefinition;
        }
        var type = definition.type;
        if (type && onlyType(definition) && type === define.types['*']) {
            Object.defineProperty(objPrototype, prop, {
                get: make.get.data(prop),
                set: make.set.events(prop, make.get.data(prop), make.set.data(prop), make.eventType.data(prop)),
                enumerable: true
            });
            return;
        }
        definition.type = type;
        var dataProperty = definition.get ? 'computed' : 'data', reader = make.read[dataProperty](prop), getter = make.get[dataProperty](prop), setter = make.set[dataProperty](prop), getInitialValue;
        var typeConvert = function (val) {
            return val;
        };
        if (definition.Type) {
            typeConvert = make.set.Type(prop, definition.Type, typeConvert);
        }
        if (type) {
            typeConvert = make.set.type(prop, type, typeConvert);
        }
        var eventsSetter = make.set.events(prop, reader, setter, make.eventType[dataProperty](prop));
        if (definition.value !== undefined || definition.Value !== undefined) {
            getInitialValue = make.get.defaultValue(prop, definition, typeConvert, eventsSetter);
        }
        if (definition.get) {
            computedInitializers[prop] = make.compute(prop, definition.get, getInitialValue);
        } else if (getInitialValue) {
            dataInitializers[prop] = getInitialValue;
        }
        if (definition.get && definition.set) {
            setter = make.set.setter(prop, definition.set, make.read.lastSet(prop), setter, true);
        } else if (definition.set) {
            setter = make.set.setter(prop, definition.set, reader, eventsSetter, false);
        } else if (!definition.get) {
            setter = eventsSetter;
        }
        if (type) {
            setter = make.set.type(prop, type, setter);
        }
        if (definition.Type) {
            setter = make.set.Type(prop, definition.Type, setter);
        }
        Object.defineProperty(objPrototype, prop, {
            get: getter,
            set: setter,
            enumerable: 'serialize' in definition ? !!definition.serialize : !definition.get
        });
    };
    define.Constructor = function (defines) {
        var constructor = function (props) {
            define.setup.call(this, props);
        };
        define(constructor.prototype, defines);
        return constructor;
    };
    make = {
        compute: function (prop, get, defaultValueFn) {
            return function () {
                var map = this, defaultValue = defaultValueFn && defaultValueFn.call(this), computeFn;
                if (defaultValue) {
                    computeFn = defaultValue.isComputed ? defaultValue : compute.async(defaultValue, get, map);
                } else {
                    computeFn = compute.async(defaultValue, get, map);
                }
                return {
                    compute: computeFn,
                    count: 0,
                    handler: function (ev, newVal, oldVal) {
                        canEvent.dispatch.call(map, {
                            type: prop,
                            target: map
                        }, [
                            newVal,
                            oldVal
                        ]);
                    }
                };
            };
        },
        set: {
            data: function (prop) {
                return function (newVal) {
                    this._data[prop] = newVal;
                };
            },
            computed: function (prop) {
                return function (val) {
                    this._computed[prop].compute(val);
                };
            },
            events: function (prop, getCurrent, setData, eventType) {
                return function (newVal) {
                    var current = getCurrent.call(this);
                    if (newVal !== current) {
                        setData.call(this, newVal);
                        canEvent.dispatch.call(this, {
                            type: prop,
                            target: this
                        }, [
                            newVal,
                            current
                        ]);
                    }
                };
            },
            setter: function (prop, setter, getCurrent, setEvents, hasGetter) {
                return function (value) {
                    var self = this;
                    canBatch.start();
                    var setterCalled = false, current = getCurrent.call(this), setValue = setter.call(this, value, function (value) {
                            setEvents.call(self, value);
                            setterCalled = true;
                        }, current);
                    if (setterCalled) {
                        canBatch.stop();
                    } else {
                        if (hasGetter) {
                            if (setValue !== undefined) {
                                if (current !== setValue) {
                                    setEvents.call(this, setValue);
                                }
                                canBatch.stop();
                            } else if (setter.length === 0) {
                                setEvents.call(this, value);
                                canBatch.stop();
                                return;
                            } else if (setter.length === 1) {
                                canBatch.stop();
                            } else {
                                canBatch.stop();
                                return;
                            }
                        } else {
                            if (setValue !== undefined) {
                                setEvents.call(this, setValue);
                                canBatch.stop();
                            } else if (setter.length === 0) {
                                setEvents.call(this, value);
                                canBatch.stop();
                                return;
                            } else if (setter.length === 1) {
                                setEvents.call(this, undefined);
                                canBatch.stop();
                            } else {
                                canBatch.stop();
                                return;
                            }
                        }
                    }
                };
            },
            type: function (prop, type, set) {
                if (typeof type === 'object') {
                    return make.set.Type(prop, type, set);
                } else {
                    return function (newValue) {
                        return set.call(this, type.call(this, newValue, prop));
                    };
                }
            },
            Type: function (prop, Type, set) {
                if (isArray(Type) && types.DefineList) {
                    Type = types.DefineList.extend({ '#': Type[0] });
                } else if (typeof Type === 'object') {
                    if (types.DefineMap) {
                        Type = types.DefineMap.extend(Type);
                    } else {
                        Type = define.constructor(Type);
                    }
                }
                return function (newValue) {
                    if (newValue instanceof Type || newValue == null) {
                        return set.call(this, newValue);
                    } else {
                        return set.call(this, new Type(newValue));
                    }
                };
            }
        },
        eventType: {
            data: function (prop) {
                return function (newVal, oldVal) {
                    return oldVal !== undefined || this._data.hasOwnProperty(prop) ? 'set' : 'add';
                };
            },
            computed: function () {
                return function () {
                    return 'set';
                };
            }
        },
        read: {
            data: function (prop) {
                return function () {
                    return this._data[prop];
                };
            },
            computed: function (prop) {
                return function () {
                    return this._computed[prop].compute();
                };
            },
            lastSet: function (prop) {
                return function () {
                    var lastSetValue = this._computed[prop].compute.computeInstance.lastSetValue;
                    return lastSetValue && lastSetValue.get();
                };
            }
        },
        get: {
            defaultValue: function (prop, definition, typeConvert, callSetter) {
                return function () {
                    var value = definition.value;
                    if (value !== undefined) {
                        if (typeof value === 'function') {
                            value = value.call(this);
                        }
                        value = typeConvert(value);
                    } else {
                        var Value = definition.Value;
                        if (Value) {
                            value = typeConvert(new Value());
                        }
                    }
                    if (definition.set) {
                        var VALUE;
                        var sync = true;
                        var setter = make.set.setter(prop, definition.set, function () {
                        }, function (value) {
                            if (sync) {
                                VALUE = value;
                            } else {
                                callSetter.call(this, value);
                            }
                        }, definition.get);
                        setter.call(this, value);
                        sync = false;
                        return VALUE;
                    }
                    return value;
                };
            },
            data: function (prop) {
                return function () {
                    Observation.add(this, prop);
                    return this._data[prop];
                };
            },
            computed: function (prop) {
                return function () {
                    return this._computed[prop].compute();
                };
            }
        }
    };
    define.behaviors = [
        'get',
        'set',
        'value',
        'Value',
        'type',
        'Type',
        'serialize'
    ];
    var addDefinition = function (definition, behavior, value) {
        if (behavior === 'type') {
            var behaviorDef = value;
            if (typeof behaviorDef === 'string') {
                behaviorDef = define.types[behaviorDef];
                if (typeof behaviorDef === 'object') {
                    assign(definition, behaviorDef);
                    behaviorDef = behaviorDef[behavior];
                }
            }
            definition[behavior] = behaviorDef;
        } else {
            definition[behavior] = value;
        }
    };
    makeDefinition = function (prop, def, defaultDefinition) {
        var definition = {};
        each(def, function (value, behavior) {
            addDefinition(definition, behavior, value);
        });
        each(defaultDefinition, function (value, prop) {
            if (definition[prop] === undefined) {
                if (prop !== 'type' && prop !== 'Type') {
                    definition[prop] = value;
                }
            }
        });
        if (!definition.type && !definition.Type) {
            defaults(definition, defaultDefinition);
        }
        if (isEmptyObject(definition)) {
            definition.type = define.types['*'];
        }
        return definition;
    };
    getDefinitionOrMethod = function (prop, value, defaultDefinition) {
        var definition;
        if (typeof value === 'string') {
            definition = { type: value };
        } else if (typeof value === 'function') {
            if (types.isConstructor(value)) {
                definition = { Type: value };
            } else if (isDefineType(value)) {
                definition = { type: value };
            }
        } else if (isArray(value)) {
            definition = { Type: value };
        } else if (isPlainObject(value)) {
            definition = value;
        }
        if (definition) {
            return makeDefinition(prop, definition, defaultDefinition);
        } else {
            return value;
        }
    };
    getDefinitionsAndMethods = function (defines, baseDefines) {
        var definitions = Object.create(baseDefines ? baseDefines.definitions : null);
        var methods = {};
        var defaults = defines['*'], defaultDefinition;
        if (defaults) {
            delete defines['*'];
            defaultDefinition = getDefinitionOrMethod('*', defaults, {});
        } else {
            defaultDefinition = {};
        }
        eachPropertyDescriptor(defines, function (prop, propertyDescriptor) {
            var value;
            if (propertyDescriptor.get || propertyDescriptor.set) {
                value = {
                    get: propertyDescriptor.get,
                    set: propertyDescriptor.set
                };
            } else {
                value = propertyDescriptor.value;
            }
            if (prop === 'constructor') {
                methods[prop] = value;
                return;
            } else {
                var result = getDefinitionOrMethod(prop, value, defaultDefinition);
                if (result && typeof result === 'object') {
                    definitions[prop] = result;
                } else {
                    methods[prop] = result;
                }
            }
        });
        if (defaults) {
            defines['*'] = defaults;
        }
        return {
            definitions: definitions,
            methods: methods,
            defaultDefinition: defaultDefinition
        };
    };
    replaceWith = function (obj, prop, cb, writable) {
        Object.defineProperty(obj, prop, {
            configurable: true,
            get: function () {
                Object.defineProperty(this, prop, {
                    value: undefined,
                    writable: true
                });
                var value = cb.call(this, obj, prop);
                Object.defineProperty(this, prop, {
                    value: value,
                    writable: !!writable
                });
                return value;
            }
        });
    };
    eventsProto = assign({}, event);
    assign(eventsProto, {
        _eventSetup: function () {
        },
        _eventTeardown: function () {
        },
        addEventListener: function (eventName, handler) {
            var computedBinding = this._computed && this._computed[eventName];
            if (computedBinding && computedBinding.compute) {
                if (!computedBinding.count) {
                    computedBinding.count = 1;
                    computedBinding.compute.addEventListener('change', computedBinding.handler);
                } else {
                    computedBinding.count++;
                }
            }
            return eventLifecycle.addAndSetup.apply(this, arguments);
        },
        removeEventListener: function (eventName, handler) {
            var computedBinding = this._computed && this._computed[eventName];
            if (computedBinding) {
                if (computedBinding.count === 1) {
                    computedBinding.count = 0;
                    computedBinding.compute.removeEventListener('change', computedBinding.handler);
                } else {
                    computedBinding.count--;
                }
            }
            return eventLifecycle.removeAndTeardown.apply(this, arguments);
        }
    });
    eventsProto.on = eventsProto.bind = eventsProto.addEventListener;
    eventsProto.off = eventsProto.unbind = eventsProto.removeEventListener;
    delete eventsProto.one;
    define.setup = function (props, sealed) {
        defineConfigurableAndNotEnumerable(this, '_cid');
        defineConfigurableAndNotEnumerable(this, '__bindEvents', {});
        defineConfigurableAndNotEnumerable(this, '_bindings', 0);
        CID(this);
        var definitions = this._define.definitions;
        var instanceDefinitions = {};
        var map = this;
        each(props, function (value, prop) {
            if (definitions[prop]) {
                map[prop] = value;
            } else {
                var def = define.makeSimpleGetterSetter(prop);
                instanceDefinitions[prop] = {};
                Object.defineProperty(map, prop, def);
                map[prop] = define.types.observable(value);
            }
        });
        if (!isEmptyObject(instanceDefinitions)) {
            defineConfigurableAndNotEnumerable(this, '_instanceDefinitions', instanceDefinitions);
        }
    };
    define.replaceWith = replaceWith;
    define.eventsProto = eventsProto;
    define.defineConfigurableAndNotEnumerable = defineConfigurableAndNotEnumerable;
    define.make = make;
    define.getDefinitionOrMethod = getDefinitionOrMethod;
    var simpleGetterSetters = {};
    define.makeSimpleGetterSetter = function (prop) {
        if (!simpleGetterSetters[prop]) {
            var setter = make.set.events(prop, make.get.data(prop), make.set.data(prop), make.eventType.data(prop));
            simpleGetterSetters[prop] = {
                get: make.get.data(prop),
                set: function (newVal) {
                    return setter.call(this, define.types.observable(newVal));
                },
                enumerable: true
            };
        }
        return simpleGetterSetters[prop];
    };
    define.Iterator = function (obj) {
        this.obj = obj;
        this.definitions = Object.keys(obj._define.definitions);
        this.instanceDefinitions = obj._instanceDefinitions ? Object.keys(obj._instanceDefinitions) : Object.keys(obj);
        this.hasGet = typeof obj.get === 'function';
    };
    define.Iterator.prototype.next = function () {
        var key;
        if (this.definitions.length) {
            key = this.definitions.shift();
            var def = this.obj._define.definitions[key];
            if (def.get) {
                return this.next();
            }
        } else if (this.instanceDefinitions.length) {
            key = this.instanceDefinitions.shift();
        } else {
            return {
                value: undefined,
                done: true
            };
        }
        return {
            value: [
                key,
                this.hasGet ? this.obj.get(key) : this.obj[key]
            ],
            done: false
        };
    };
    isDefineType = function (func) {
        return func && func.canDefineType === true;
    };
    define.types = {
        'date': function (str) {
            var type = typeof str;
            if (type === 'string') {
                str = Date.parse(str);
                return isNaN(str) ? null : new Date(str);
            } else if (type === 'number') {
                return new Date(str);
            } else {
                return str;
            }
        },
        'number': function (val) {
            if (val == null) {
                return val;
            }
            return +val;
        },
        'boolean': function (val) {
            if (val == null) {
                return val;
            }
            if (val === 'false' || val === '0' || !val) {
                return false;
            }
            return true;
        },
        'observable': function (newVal) {
            if (isArray(newVal) && types.DefineList) {
                newVal = new types.DefineList(newVal);
            } else if (isPlainObject(newVal) && types.DefineMap) {
                newVal = new types.DefineMap(newVal);
            }
            return newVal;
        },
        'stringOrObservable': function (newVal) {
            if (isArray(newVal)) {
                return new types.DefaultList(newVal);
            } else if (isPlainObject(newVal)) {
                return new types.DefaultMap(newVal);
            } else {
                return define.types.string(newVal);
            }
        },
        'htmlbool': function (val) {
            return typeof val === 'string' || !!val;
        },
        '*': function (val) {
            return val;
        },
        'any': function (val) {
            return val;
        },
        'string': function (val) {
            if (val == null) {
                return val;
            }
            return '' + val;
        },
        'compute': {
            set: function (newValue, setVal, setErr, oldValue) {
                if (newValue && newValue.isComputed) {
                    return newValue;
                }
                if (oldValue && oldValue.isComputed) {
                    oldValue(newValue);
                    return oldValue;
                }
                return newValue;
            },
            get: function (value) {
                return value && value.isComputed ? value() : value;
            }
        }
    };
});