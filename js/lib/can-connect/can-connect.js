/*can-connect@1.3.8#can-connect*/
define(function (require, exports, module) {
    var connect = require('can-connect/connect');
    var base = require('can-connect/base/base');
    var ns = require('can-namespace/can-namespace');
    connect.base = base;
    module.exports = ns.connect = connect;
});