/*can-define@1.0.17#define-helpers/define-helpers*/
define(function (require, exports, module) {
    var assign = require('can-util/js/assign/assign');
    var CID = require('can-cid/can-cid');
    var define = require('can-define/can-define');
    var canBatch = require('can-event/batch/batch');
    var canEvent = require('can-event/can-event');
    var hasMethod = function (obj, method) {
        return obj && typeof obj === 'object' && method in obj;
    };
    var defineHelpers = {
        extendedSetup: function (props) {
            assign(this, props);
        },
        toObject: function (map, props, where, Type) {
            if (props instanceof Type) {
                props.each(function (value, prop) {
                    where[prop] = value;
                });
                return where;
            } else {
                return props;
            }
        },
        defineExpando: function (map, prop, value) {
            var constructorDefines = map._define.definitions;
            if (constructorDefines && constructorDefines[prop]) {
                return;
            }
            var instanceDefines = map._instanceDefinitions;
            if (!instanceDefines) {
                instanceDefines = map._instanceDefinitions = {};
            }
            if (!instanceDefines[prop]) {
                var defaultDefinition = map._define.defaultDefinition || { type: define.types.observable };
                define.property(map, prop, defaultDefinition, {}, {});
                map._data[prop] = defaultDefinition.type ? defaultDefinition.type(value) : define.types.observable(value);
                instanceDefines[prop] = defaultDefinition;
                canBatch.start();
                canEvent.dispatch.call(map, {
                    type: '__keys',
                    target: map
                });
                if (map._data[prop] !== undefined) {
                    canEvent.dispatch.call(map, {
                        type: prop,
                        target: map
                    }, [
                        map._data[prop],
                        undefined
                    ]);
                }
                canBatch.stop();
                return true;
            }
        },
        getValue: function (map, name, val, how) {
            if (how === 'serialize') {
                var constructorDefinitions = map._define.definitions;
                var propDef = constructorDefinitions[name];
                if (propDef && typeof propDef.serialize === 'function') {
                    return propDef.serialize.call(map, val, name);
                }
                var defaultDefinition = map._define.defaultDefinition;
                if (defaultDefinition && typeof defaultDefinition.serialize === 'function') {
                    return defaultDefinition.serialize.call(map, val, name);
                }
            }
            if (hasMethod(val, how)) {
                return val[how]();
            } else {
                return val;
            }
        },
        serialize: function () {
            var serializeMap = null;
            return function (map, how, where) {
                var cid = CID(map), firstSerialize = false;
                if (!serializeMap) {
                    firstSerialize = true;
                    serializeMap = {
                        get: {},
                        serialize: {}
                    };
                }
                serializeMap[how][cid] = where;
                map.each(function (val, name) {
                    var result, isObservable = hasMethod(val, how), serialized = isObservable && serializeMap[how][CID(val)];
                    if (serialized) {
                        result = serialized;
                    } else {
                        result = defineHelpers.getValue(map, name, val, how);
                    }
                    if (result !== undefined) {
                        where[name] = result;
                    }
                });
                if (firstSerialize) {
                    serializeMap = null;
                }
                return where;
            };
        }()
    };
    module.exports = defineHelpers;
});