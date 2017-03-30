/*can-connect@1.3.8#helpers/set-add*/
define(function (require, exports, module) {
    var canSet = require('can-set/src/set');
    module.exports = function (connection, setItems, items, item, algebra) {
        var index = canSet.index(setItems, items, item, algebra);
        if (index === undefined) {
            index = items.length;
        }
        var copy = items.slice(0);
        copy.splice(index, 0, item);
        return copy;
    };
});