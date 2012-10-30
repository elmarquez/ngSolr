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

	$scope.items = [];

    // remove the facet at the specified index
    $scope.remove = function(Index) {
        
    }

    /**
     * Update the list of facets displayed.
     */
    $scope.update = function() {
    	// delete all items from the list
    	$scope.items.splice(0,$scope.items.length);
    	// add items from list
    }

    /**
     * Watch the specified scope for changes on the named variable.
     */
    $scope.watch = function($myscope,variable) {
    	$myscope.$watch(variable,$scope.update);
    }
}
facetSelectionCtrl.$inject = ['$scope'];
