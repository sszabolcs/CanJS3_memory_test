/*can-util@3.3.3#dom/events/removed/removed*/
define(function (require, exports, module) {
    var makeMutationEvent = require('can-util/dom/events/make-mutation-event/make-mutation-event');
    makeMutationEvent('removed', 'removedNodes');
});