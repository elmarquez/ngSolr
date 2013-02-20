/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 */
function FacetSelectionController($scope, SolrSearchService) {
	// fields
    $scope.facets = [];         // list of facets
    $scope.target = 'default';  // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet at the specified index.
     * @param Index Index of facet to remove.
     */
    $scope.remove = function(Index) {
        var facet = $scope.facets[Index];
        var query = SolrSearchService.getQuery($scope.target);
        if (query && facet) {
            query.removeFacet(facet);
        }
        $scope.update();
    };

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            for (var i=0;i<query.facets.length;i++) {
                $scope.facets.push(query.facets[i]);
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on('update', function () {
        $scope.update();
    });

};

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
