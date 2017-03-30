/*can-event@3.1.1#batch/batch*/
define(function (require, exports, module) {
    'use strict';
    var canEvent = require('can-event/can-event');
    var last = require('can-util/js/last/last');
    var namespace = require('can-namespace/can-namespace');
    var canTypes = require('can-types/can-types');
    var canDev = require('can-util/js/dev/dev');
    var canLog = require('can-util/js/log/log');
    var batchNum = 1, collectionQueue = null, queues = [], dispatchingQueues = false, makeHandlerArgs = canEvent.makeHandlerArgs, getHandlers = canEvent.handlers;
    function addToCollectionQueue(item, event, args, handlers) {
        var handlerArgs = makeHandlerArgs(event, args);
        var tasks = [];
        for (var i = 0, len = handlers.length; i < len; i++) {
            tasks[i] = [
                handlers[i],
                item,
                handlerArgs
            ];
        }
        [].push.apply(collectionQueue.tasks, tasks);
    }
    var canBatch = {
        transactions: 0,
        start: function (batchStopHandler) {
            canBatch.transactions++;
            if (canBatch.transactions === 1) {
                var queue = {
                    number: batchNum++,
                    index: 0,
                    tasks: [],
                    batchEnded: false,
                    callbacksIndex: 0,
                    callbacks: [],
                    complete: false
                };
                if (batchStopHandler) {
                    queue.callbacks.push(batchStopHandler);
                }
                collectionQueue = queue;
            }
        },
        collecting: function () {
            return collectionQueue;
        },
        dispatching: function () {
            return queues[0];
        },
        stop: function (force, callStart) {
            if (force) {
                canBatch.transactions = 0;
            } else {
                canBatch.transactions--;
            }
            if (canBatch.transactions === 0) {
                queues.push(collectionQueue);
                collectionQueue = null;
                if (!dispatchingQueues) {
                    canEvent.flush();
                }
            }
        },
        flush: function () {
            dispatchingQueues = true;
            while (queues.length) {
                var queue = queues[0];
                var tasks = queue.tasks, callbacks = queue.callbacks;
                canBatch.batchNum = queue.number;
                var len = tasks.length, index;
                while (queue.index < len) {
                    index = queue.index++;
                    tasks[index][0].apply(tasks[index][1], tasks[index][2]);
                }
                if (!queue.batchEnded) {
                    queue.batchEnded = true;
                    canEvent.dispatchSync.call(canBatch, 'batchEnd', [queue.number]);
                }
                while (queue.callbacksIndex < callbacks.length) {
                    callbacks[queue.callbacksIndex++]();
                }
                if (!queue.complete) {
                    queue.complete = true;
                    canBatch.batchNum = undefined;
                    queues.shift();
                }
            }
            dispatchingQueues = false;
        },
        dispatch: function (event, args) {
            var item = this, handlers;
            if (!item.__inSetup) {
                event = typeof event === 'string' ? { type: event } : event;
                if (event.batchNum) {
                    canEvent.dispatchSync.call(item, event, args);
                } else if (collectionQueue) {
                    handlers = getHandlers.call(this, event.type);
                    if (handlers) {
                        event.batchNum = collectionQueue.number;
                        addToCollectionQueue(item, event, args, handlers);
                    }
                } else if (queues.length) {
                    handlers = getHandlers.call(this, event.type);
                    if (handlers) {
                        canBatch.start();
                        event.batchNum = collectionQueue.number;
                        addToCollectionQueue(item, event, args, handlers);
                        last(queues).callbacks.push(canBatch.stop);
                    }
                } else {
                    handlers = getHandlers.call(this, event.type);
                    if (handlers) {
                        canBatch.start();
                        event.batchNum = collectionQueue.number;
                        addToCollectionQueue(item, event, args, handlers);
                        canBatch.stop();
                    }
                }
            }
        },
        queue: function (task, inCurrentBatch) {
            if (collectionQueue) {
                collectionQueue.tasks.push(task);
            } else if (queues.length) {
                if (inCurrentBatch && queues[0].index < queues.tasks.length) {
                    queues[0].tasks.push(task);
                } else {
                    canBatch.start();
                    collectionQueue.tasks.push(task);
                    last(queues).callbacks.push(canBatch.stop);
                }
            } else {
                canBatch.start();
                collectionQueue.tasks.push(task);
                canBatch.stop();
            }
        },
        queues: function () {
            return queues;
        },
        afterPreviousEvents: function (handler) {
            this.queue([handler]);
        },
        after: function (handler) {
            var queue = collectionQueue || queues[0];
            if (queue) {
                queue.callbacks.push(handler);
            } else {
                handler({});
            }
        }
    };
    canEvent.flush = canBatch.flush;
    canEvent.dispatch = canBatch.dispatch;
    canBatch.trigger = function () {
        canLog.warn('use canEvent.dispatch instead');
        return canEvent.dispatch.apply(this, arguments);
    };
    canTypes.queueTask = canBatch.queue;
    module.exports = namespace.batch = canBatch;
});