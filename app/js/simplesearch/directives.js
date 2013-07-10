/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SimpleSearch Directives                                                   */

/**
 * searchform element directive.
 */
app.directive("searchform", function() {
   return {
       controller: 'SearchFormController',
       restrict: "E",
       template: "<form ng-transclude></form> ",
       transclude: true
   }
});

/**
 * searchbox attribute provides a JQuery UI based autocomplete, search hints
 * drop down box. The box is populated with search hints from the parent
 * searchbox element scope.
 */
app.directive('searchbox', function() {
    return {
        link: function(scope, element, attrs) {
            // update the user query
            element.bind("keyup", function(event) {
                if (event.keyCode == 13) {
                    // enter key: submit query
                    if (scope.$parent.userquery != '') {
                        scope.$parent.submit();
                    }
                } else {
                    // all other keys: update user query
                    scope.$parent.userquery = event.target.value;
                }
            });
            // display autocomplete hints
            element.autocomplete({
                delay: 500,
                minLength: 3,
                source: function(request, response) {
                    var hints = scope.hints;
                    var results = $.ui.autocomplete.filter(hints, request.term);
                    response(results.slice(0, 10));
                }
            });
        },
        restrict: "A",
        scope: true
    }
});

/**
 * searchbutton attribute attaches a click handler to the button element that
 * calls the searchbox parent scope submit() method.
 */
app.directive('searchbutton', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind("click", function() {
                if (scope.$parent.userquery != '') {
                    scope.$parent.submit();
                }
            });
        },
        restrict: "A",
        scope: true
    }
});

/**
 * searchresults element directive.
 */
app.directive("searchresults", function($route, $routeParams, SolrSearchService, Utils) {
    return {
        controller: 'SearchResultsController',
        restrict: "E",
        scope: false,
        template: "<div ng-transclude></div> ",
        transclude: true
    }
});
