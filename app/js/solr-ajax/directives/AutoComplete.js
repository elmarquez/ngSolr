/**
 * Directive to support Bootstrap typeahead.
 * @see http://twitter.github.com/bootstrap/javascript.html#typeahead
 * @see http://jsfiddle.net/DNjSM/17/
 */
angular.module('Directives',[]).directive('autoComplete', function($timeout) {
    return function (scope, iElement, iAttrs) {
        var autocomplete = iElement.typeahead();
        scope.$watch(iAttrs.uiItems, function(values) {
            autocomplete.data('typeahead').source = values;
            // console.log(values);
        }, true);
    };
});
