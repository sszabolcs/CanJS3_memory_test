"use strict";

requirejs.config({
    baseUrl: "js/lib",
    paths: {
        app: "../app",
        can: "can/legacy"
    }
});

require([
    "app/memory_test"
], function() {
    "use strict";
});
