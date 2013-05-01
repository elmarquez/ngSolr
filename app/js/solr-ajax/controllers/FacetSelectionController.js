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
    $scope.facets = [];              // list of facets
    $scope.target = 'defaultQuery';  // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet at the specified index.
     * @param Index Index of facet to remove.
     */
    $scope.remove = function(Index) {
        var facet = $scope.facets[Index];
        var query = SolrSearchService.getQuery($scope.target);
        if (query && facet) {
            query.removeFacet(facet.field);
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var facets = query.getFacets();
            for (var i=0;i<facets.length;i++) {
                $scope.facets.push(facets[i]);
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on($scope.target, function() {
        $scope.handleFacetListUpdate();
    });

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
