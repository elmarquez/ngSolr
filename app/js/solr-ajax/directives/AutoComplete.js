/**
 * Directive to add JQuery UI AutoComplete to element
 * @see http://jqueryui.com/autocomplete/
 */
angular.module('Directives',[]).directive('searchhints', function() {
    return {
        restrict: "A",
        link: function(scope, element) {
            element.autocomplete({
                delay: 500,
                minLength: 3,
                source: function(request, response) {
                    var results = $.ui.autocomplete.filter(scope.hints, request.term);
                    response(results.slice(0, 10));
                }
            });
        }
    }
});
