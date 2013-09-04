/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* FacetSelectionController                                                  */

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @todo need to update this to read the facet list from the current query
 */
function FacetSelectionController($scope, SolrSearchService) {

    $scope.facetkeys = [];              // facet key from target query
    $scope.facets = [];                 // facets
    $scope.target = 'defaultQuery';     // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet constraint from the target query.
     * @param Index Index of facet in the facet list
     */
    $scope.remove = function(Index) {
        var key = $scope.facetkeys[Index];
        var query = SolrSearchService.getQuery($scope.target);
        query.removeFacet(key);
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        $scope.facetkeys = [];
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        var facets = query.getFacets();
        for (var key in facets) {
            $scope.facetkeys.push(key);
            $scope.facets.push(facets[key]);
        }
    };

    /**
     * Initialize the controller
     */
    $scope.init = function() {
        // Handle update events from the search service.
        $scope.$on($scope.target, function() {
            $scope.handleUpdate();
        });
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
