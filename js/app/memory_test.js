require([
    "can"
], function(can) {
    "use strict";

    var MyComponentVM = can.DefineMap.extend({
        testProperty: { type: "string", value: "init test property value" }       
    });

    can.Component.extend({
        tag: "my-component",
        view: can.stache.from("my-component"),
        ViewModel: MyComponentVM
    });

    var myCompRenderer = can.stache("<my-component />");

    var TestVM = can.DefineMap.extend({
        myCompInserted: { type: "boolean", value: false },

        insertMyComp: function () {
            var myCompFrag = myCompRenderer();
            $("#my-component-container").html(myCompFrag);
            this.myCompInserted = true;
        },

        removeMyComp: function () {
            $("#my-component-container").empty();
            this.myCompInserted = false;
        }
    });

    var template = can.stache.from("content-using-my-component");
    var frag = template(new TestVM());
    document.body.appendChild(frag);
});
