/*can-util@3.3.3#dom/events/events*/
define(function (require, exports, module) {
    var assign = require('can-util/js/assign/assign');
    var _document = require('can-util/dom/document/document');
    module.exports = {
        addEventListener: function () {
            this.addEventListener.apply(this, arguments);
        },
        removeEventListener: function () {
            this.removeEventListener.apply(this, arguments);
        },
        canAddEventListener: function () {
            return this.nodeName && (this.nodeType === 1 || this.nodeType === 9) || this === window;
        },
        dispatch: function (event, args, bubbles) {
            var doc = _document();
            var ret;
            var dispatchingOnDisabled = this.disabled;
            var ev = doc.createEvent('HTMLEvents');
            var isString = typeof event === 'string';
            ev.initEvent(isString ? event : event.type, bubbles === undefined ? true : bubbles, false);
            if (!isString) {
                assign(ev, event);
            }
            ev.args = args;
            if (dispatchingOnDisabled) {
                this.disabled = false;
            }
            ret = this.dispatchEvent(ev);
            if (dispatchingOnDisabled) {
                this.disabled = true;
            }
            return ret;
        }
    };
});