/*can-util@3.3.3#js/cid/get-cid*/
define(function (require, exports, module) {
    var CID = require('can-cid/can-cid');
    var domDataCore = require('can-util/dom/data/core');
    module.exports = function (obj) {
        if (typeof obj.nodeType === 'number') {
            return domDataCore.cid.call(obj);
        } else {
            var type = typeof obj;
            var isObject = type !== null && (type === 'object' || type === 'function');
            return type + ':' + (isObject ? CID(obj) : obj);
        }
    };
});