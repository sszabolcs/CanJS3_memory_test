/*can@3.5.1#legacy*/
define(function (require, exports, module) {
    var can = require('can-util/namespace');
    require('can-component/can-component');
    require('can-route/can-route');
    require('can-stache/can-stache');
    require('can-stache-bindings/can-stache-bindings');
    require('can-compute/can-compute');
    require('can-event/can-event');
    require('can-view-model/can-view-model');
    require('can-define/map/map');
    require('can-define/list/list');
    require('can-set/src/set');
    require('can-fixture/fixture');
    require('can-map/can-map');
    require('can-list/can-list');
    require('can-map-backup/can-map-backup');
    require('can-map-define/can-map-define');
    require('can-connect/can/model/model');
    require('can-jquery/can-jquery');
    can.view.attr = can.view.callbacks.attr;
    can.view.tag = can.view.callbacks.tag;
    module.exports = can;
});