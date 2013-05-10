/**
 * Directive to support Bootstrap typeahead.
 * @see http://twitter.github.io/bootstrap/javascript.html#typeahead
 * @see http://jsfiddle.net/DNjSM/17/
 */
angular.module('Directives',[]).directive('typeahead', function($timeout) {
    return function (scope, iElement, iAttrs) {
        var typeahead = iElement.typeahead();
        scope.$watch(iAttrs. uiItems, function(values) {
            typeahead.data('typeahead').source = values;
        }, true);
    };
});
