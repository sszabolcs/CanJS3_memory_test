/*can-connect@1.3.8#can/model/model*/
define(function (require, exports, module) {
    var $ = require('jquery'), connect = require('can-connect/can-connect'), persist = require('can-connect/data/url/url'), constructor = require('can-connect/constructor/constructor'), instanceStore = require('can-connect/constructor/store/store'), parseData = require('can-connect/data/parse/parse'), CanMap = require('can-map/can-map'), CanList = require('can-list/can-list'), Observation = require('can-observation/can-observation'), canEvent = require('can-event/can-event'), ns = require('can-namespace/can-namespace');
    var each = require('can-util/js/each/each');
    var dev = require('can-util/js/dev/dev');
    var makeArray = require('can-util/js/make-array/make-array');
    var types = require('can-types/can-types');
    var isPlainObject = require('can-util/js/is-plain-object/is-plain-object');
    var callCanReadingOnIdRead = true;
    var getBaseValue = function (prop) {
        if (typeof prop === 'function' && 'base' in prop) {
            return prop.base;
        } else {
            return prop;
        }
    };
    var resolveSingleExport = function (originalPromise) {
        var promise = originalPromise.then(function (first) {
            return first;
        });
        promise.abort = function () {
            originalPromise.abort();
        };
        return promise;
    };
    var mapBehavior = connect.behavior(function (baseConnection) {
        var behavior = {
            id: function (inst) {
                var idProp = inst.constructor.id || 'id';
                if (inst instanceof CanMap) {
                    if (callCanReadingOnIdRead) {
                        Observation.add(inst, idProp);
                    }
                    return inst.__get(idProp);
                } else {
                    if (callCanReadingOnIdRead) {
                        return inst[idProp];
                    } else {
                        return Observation.ignore(function () {
                            return inst[idProp];
                        });
                    }
                }
            },
            listSet: function () {
                return undefined;
            },
            idProp: baseConnection.constructor.id || 'id',
            serializeInstance: function (instance) {
                return instance.serialize();
            },
            findAll: function (params, success, error) {
                var promise = resolveSingleExport(baseConnection.getList.call(this, params));
                promise.then(success, error);
                return promise;
            },
            findOne: function (params, success, error) {
                var promise = resolveSingleExport(baseConnection.get.call(this, params));
                promise.then(success, error);
                return promise;
            },
            parseInstanceData: function (props) {
                if (typeof this.parseModel === 'function') {
                    return this.parseModel.apply(this.constructor, arguments);
                } else {
                    return baseConnection.parseInstanceData.apply(baseConnection, arguments);
                }
            },
            parseListData: function (props) {
                if (typeof this.parseModels === 'function') {
                    return this.parseModels.apply(this.constructor, arguments);
                } else {
                    return baseConnection.parseListData.apply(baseConnection, arguments);
                }
            }
        };
        each([
            'created',
            'updated',
            'destroyed'
        ], function (funcName) {
            behavior[funcName + 'Instance'] = function (instance, attrs) {
                var constructor = instance.constructor;
                if (attrs && typeof attrs === 'object') {
                    instance.attr(typeof attrs.attr === 'function' ? attrs.attr() : attrs, this.constructor.removeAttr || false);
                }
                canEvent.dispatch.call(instance, {
                    type: funcName,
                    target: instance
                });
                canEvent.dispatch.call(constructor, funcName, [instance]);
            };
        });
        return behavior;
    });
    var CanModel = CanMap.extend({
        setup: function (base, fullName, staticProps, protoProps) {
            if (typeof fullName !== 'string') {
                protoProps = staticProps;
                staticProps = fullName;
            }
            if (!protoProps) {
                protoProps = staticProps;
            }
            this.store = {};
            CanMap.setup.apply(this, arguments);
            if (!CanModel) {
                return;
            }
            if (staticProps && staticProps.List) {
                this.List = staticProps.List;
                this.List.Map = this;
            } else {
                this.List = base.List.extend({ Map: this }, {});
            }
            var self = this;
            var staticMethods = [
                'findAll',
                'findOne',
                'create',
                'update',
                'destroy'
            ];
            var parseMethods = {
                parseModel: 'parseInstanceData',
                parseModels: 'parseListData'
            };
            var connectionOptions = {
                url: {
                    getListData: getBaseValue(this.findAll),
                    getData: getBaseValue(this.findOne),
                    createData: getBaseValue(this.create),
                    updateData: getBaseValue(this.update),
                    destroyData: getBaseValue(this.destroy),
                    resource: this.resource
                },
                idProp: this.id,
                parseInstanceProp: typeof getBaseValue(this.parseModel) === 'string' ? getBaseValue(this.parseModel) : undefined,
                parseListProp: typeof getBaseValue(this.parseModels) === 'string' ? getBaseValue(this.parseModels) : undefined,
                instance: function (values) {
                    return new self(values);
                },
                list: function (listData) {
                    var list = new self.List(listData.data);
                    each(listData, function (val, prop) {
                        if (prop !== 'data') {
                            list.attr(prop, val);
                        }
                    });
                    return list;
                },
                constructor: this,
                parseModel: getBaseValue(this.parseModel),
                parseModels: getBaseValue(this.parseModels),
                ajax: function () {
                    var promiseLike = $.ajax.apply($, arguments);
                    return new Promise(function (resolve, reject) {
                        promiseLike.then(resolve, reject);
                    });
                }
            };
            this.connection = mapBehavior(instanceStore(constructor(parseData(persist(connectionOptions)))));
            this.store = this.connection.instanceStore;
            each(staticMethods, function (name) {
                if (self.connection[name]) {
                    var fn = self.connection[name].bind(self.connection);
                    fn.base = self[name];
                    CanMap._overwrite(self, base, name, fn);
                }
            });
            each(parseMethods, function (connectionName, name) {
                var fn = self.connection[connectionName].bind(self.connection);
                fn.base = self[name];
                CanMap._overwrite(self, base, name, fn);
            });
        },
        models: function (raw, oldList) {
            var args = makeArray(arguments);
            args[0] = this.connection.parseListData.apply(this.connection, arguments);
            var list = this.connection.hydrateList.apply(this.connection, args);
            if (oldList instanceof CanList) {
                return oldList.replace(list);
            } else {
                return list;
            }
        },
        model: function (raw) {
            var args = makeArray(arguments);
            args[0] = this.connection.parseInstanceData.apply(this.connection, arguments);
            var instance = this.connection.hydrateInstance.apply(this.connection, arguments);
            return instance;
        }
    }, {
        isNew: function () {
            var id = this.constructor.connection.id(this);
            return !(id || id === 0);
        },
        save: function (success, error) {
            var promise = resolveSingleExport(this.constructor.connection.save(this));
            promise.then(success, error);
            return promise;
        },
        destroy: function (success, error) {
            var promise;
            if (this.isNew()) {
                promise = Promise.resolve(this);
                this.constructor.connection.destroyedInstance(this, {});
            } else {
                promise = this.constructor.connection.destroy(this);
            }
            promise.then(success, error);
            return promise;
        },
        _eventSetup: function () {
            callCanReadingOnIdRead = false;
            this.constructor.connection.addInstanceReference(this);
            callCanReadingOnIdRead = true;
            return CanMap.prototype._eventSetup.apply(this, arguments);
        },
        _eventTeardown: function () {
            callCanReadingOnIdRead = false;
            this.constructor.connection.deleteInstanceReference(this);
            callCanReadingOnIdRead = true;
            return CanMap.prototype._eventTeardown.apply(this, arguments);
        },
        ___set: function (prop, val) {
            CanMap.prototype.___set.call(this, prop, val);
            if (prop === (this.constructor.id || 'id') && this._bindings) {
                this.constructor.connection.addInstanceReference(this);
            }
        }
    });
    CanModel.List = CanList.extend({
        _bubbleRule: function (eventName, list) {
            var bubbleRules = CanList._bubbleRule(eventName, list);
            bubbleRules.push('destroyed');
            return bubbleRules;
        }
    }, {
        setup: function (params) {
            if (isPlainObject(params) && !Array.isArray(params)) {
                CanList.prototype.setup.apply(this);
                this.replace(types.isPromise(params) ? params : this.constructor.Map.findAll(params));
            } else {
                CanList.prototype.setup.apply(this, arguments);
            }
            this._init = 1;
            this.bind('destroyed', this._destroyed.bind(this));
            delete this._init;
        },
        _destroyed: function (ev, attr) {
            if (/\w+/.test(attr)) {
                var index;
                while ((index = this.indexOf(ev.target)) > -1) {
                    this.splice(index, 1);
                }
            }
        }
    });
    if (!ns.Model) {
        ns.Model = CanModel;
    }
    module.exports = CanModel;
});