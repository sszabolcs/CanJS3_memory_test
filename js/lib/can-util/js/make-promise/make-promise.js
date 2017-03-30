/*can-util@3.3.3#js/make-promise/make-promise*/
define(function (require, exports, module) {
    var isPromiseLike = require('can-util/js/is-promise-like/is-promise-like');
    var isPromise = require('can-util/js/is-promise/is-promise');
    module.exports = function (obj) {
        if (isPromiseLike(obj) && !isPromise(obj)) {
            return new Promise(function (resolve, reject) {
                obj.then(resolve, reject);
            });
        } else {
            return obj;
        }
    };
});