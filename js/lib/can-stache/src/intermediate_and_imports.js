/*can-stache@3.0.20#src/intermediate_and_imports*/
define(function (require, exports, module) {
    var mustacheCore = require('can-stache/src/mustache_core');
    var parser = require('can-view-parser/can-view-parser');
    module.exports = function (source) {
        var template = mustacheCore.cleanLineEndings(source);
        var imports = [], dynamicImports = [], ases = {}, inImport = false, inFrom = false, inAs = false, isUnary = false, currentAs = '', currentFrom = '';
        var intermediate = parser(template, {
            start: function (tagName, unary) {
                isUnary = unary;
                if (tagName === 'can-import') {
                    inImport = true;
                } else if (inImport) {
                    inImport = false;
                }
            },
            attrStart: function (attrName) {
                if (attrName === 'from') {
                    inFrom = true;
                } else if (attrName === 'as' || attrName === 'export-as') {
                    inAs = true;
                }
            },
            attrEnd: function (attrName) {
                if (attrName === 'from') {
                    inFrom = false;
                } else if (attrName === 'as' || attrName === 'export-as') {
                    inAs = false;
                }
            },
            attrValue: function (value) {
                if (inFrom && inImport) {
                    imports.push(value);
                    if (!isUnary) {
                        dynamicImports.push(value);
                    }
                    currentFrom = value;
                } else if (inAs && inImport) {
                    currentAs = value;
                }
            },
            end: function (tagName) {
                if (tagName === 'can-import') {
                    if (currentAs) {
                        ases[currentAs] = currentFrom;
                        currentAs = '';
                    }
                }
            },
            close: function (tagName) {
                if (tagName === 'can-import') {
                    imports.pop();
                }
            }
        }, true);
        return {
            intermediate: intermediate,
            imports: imports,
            dynamicImports: dynamicImports,
            ases: ases,
            exports: ases
        };
    };
});