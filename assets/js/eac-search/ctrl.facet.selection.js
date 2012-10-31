/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */


/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Manages the current set of user selected facets, filters.
 */
function facetSelectionCtrl($scope) {
	// fields
    $scope.items = [];  // the display list
    // remove the facet at the specified index
    $scope.remove = function(Index) {
        $scope.facets.splice(Index,1);
        $scope.update();
    }
    // update the display when a change occurs to the facet list
    $scope.update = function() {
    	$scope.items.splice(0,$scope.items.length);
    	for (var i=0;i<$scope.facets.length;i++) {
    		$scope.items.push($scope.facets[i]);
    	}
    }
    // watch the specified variable for chanages
    $scope.watch = function(variable) {
        $scope.$watch(variable,$scope.update);
    }
}
facetSelectionCtrl.$inject = ['$scope'];
