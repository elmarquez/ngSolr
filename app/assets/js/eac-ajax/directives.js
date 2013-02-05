/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Register Directives                                                       */

var directives = angular.module('Directives', []);

directives.directive('map', ['SolrSearchService', function(SolrSearchService) {
	return {
        restrict: 'E',
        scope: {items:'='},
        replace: true,
        transclude: true,
        link: function($scope, lElement, attrs) {
             $scope.$watch('results',function() {
                console.log('Map update event fired');
            }, true);
        }
    }
  }]);
