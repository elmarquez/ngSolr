/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Register Directives                                                       */

var directives = angular.module('Directives',[]);

/**
 * Directive to support Bootstrap typeahead.
 * @see http://twitter.github.com/bootstrap/javascript.html#typeahead
 * @see http://jsfiddle.net/DNjSM/17/
 */
directives.directive('autoComplete', function ($timeout) {
    return function (scope, iElement, iAttrs) {
        var autocomplete = iElement.typeahead();
        scope.$watch(iAttrs.uiItems, function(values) {
            autocomplete.data('typeahead').source = values;
            // console.log(values);
        }, true);
    };
});

directives.directive('imagegrid', function() {
   return function (scope, element, attrs) {

   }
});