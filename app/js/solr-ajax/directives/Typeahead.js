/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* TypeAhead                                                                 */

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
