/*can-util@3.3.3#js/diff/diff*/
define(function (require, exports, module) {
    var slice = [].slice;
    var defaultIdentity = function (a, b) {
        return a === b;
    };
    module.exports = exports = function (oldList, newList, identity) {
        identity = identity || defaultIdentity;
        var oldIndex = 0, newIndex = 0, oldLength = oldList.length, newLength = newList.length, patches = [];
        while (oldIndex < oldLength && newIndex < newLength) {
            var oldItem = oldList[oldIndex], newItem = newList[newIndex];
            if (identity(oldItem, newItem)) {
                oldIndex++;
                newIndex++;
                continue;
            }
            if (newIndex + 1 < newLength && identity(oldItem, newList[newIndex + 1])) {
                patches.push({
                    index: newIndex,
                    deleteCount: 0,
                    insert: [newList[newIndex]]
                });
                oldIndex++;
                newIndex += 2;
                continue;
            } else if (oldIndex + 1 < oldLength && identity(oldList[oldIndex + 1], newItem)) {
                patches.push({
                    index: newIndex,
                    deleteCount: 1,
                    insert: []
                });
                oldIndex += 2;
                newIndex++;
                continue;
            } else {
                patches.push({
                    index: newIndex,
                    deleteCount: oldLength - oldIndex,
                    insert: slice.call(newList, newIndex)
                });
                return patches;
            }
        }
        if (newIndex === newLength && oldIndex === oldLength) {
            return patches;
        }
        patches.push({
            index: newIndex,
            deleteCount: oldLength - oldIndex,
            insert: slice.call(newList, newIndex)
        });
        return patches;
    };
});