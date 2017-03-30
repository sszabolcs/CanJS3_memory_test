/*can-view-live@3.0.6#lib/attr*/
define(function (require, exports, module) {
    var attr = require('can-util/dom/attr/attr');
    var live = require('can-view-live/lib/core');
    live.attr = function (el, attributeName, compute) {
        live.listen(el, compute, function (ev, newVal) {
            attr.set(el, attributeName, newVal);
        });
        attr.set(el, attributeName, compute());
    };
});