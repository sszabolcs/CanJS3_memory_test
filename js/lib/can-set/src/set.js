/*can-set@1.1.0#src/set*/
define(function (require, exports, module) {
    var set = require('can-set/src/set-core');
    var ns = require('can-namespace/can-namespace');
    var props = require('can-set/src/props');
    var clause = require('can-set/src/clause');
    set.comparators = props;
    set.props = props;
    set.helpers = require('can-set/src/helpers');
    set.clause = clause;
    module.exports = ns.set = set;
});