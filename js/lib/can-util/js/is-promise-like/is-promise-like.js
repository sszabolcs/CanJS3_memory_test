/*can-util@3.3.3#js/is-promise-like/is-promise-like*/
define(function (require, exports, module) {
    module.exports = function (obj) {
        return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
    };
});