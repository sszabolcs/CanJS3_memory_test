/*can-util@3.3.3#js/base-url/base-url*/
define(function (require, exports, module) {
    (function (global) {
        var getGlobal = require('can-util/js/global/global');
        var setBaseUrl;
        module.exports = function (setUrl) {
            if (setUrl !== undefined) {
                setBaseUrl = setUrl;
            }
            if (setBaseUrl !== undefined) {
                return setBaseUrl;
            }
            var global = getGlobal();
            if (global.location) {
                var href = global.location.href;
                var lastSlash = href.lastIndexOf('/');
                return lastSlash !== -1 ? href.substr(0, lastSlash) : href;
            } else if (typeof process !== 'undefined') {
                return process.cwd();
            }
        };
    }(function () {
        return this;
    }()));
});