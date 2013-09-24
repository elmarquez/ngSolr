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
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService Solr search service
 */
function FacetSelectionController($scope, $attrs, $location, $route, $routeParams, $window,  SolrSearchService) {

    // facet key from target query
    $scope.facetkeys = [];

    // facets
    $scope.facets = [];

    // target query name
    $scope.target = SolrSearchService.defaultQueryName;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet constraint from the target query.
     * @param Index Index of facet in the facet list
     */
    $scope.remove = function(Index) {
        var key = $scope.facetkeys[Index];
        var query = SolrSearchService.getQuery($scope.target);
        query.removeFacet(key);
        // change window location
        var hash = query.getHash();
        $location.path(hash);
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
        // apply configured attributes
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // update the list of facets on route change
        $scope.$on("$routeChangeSuccess", function() {
            //
        });
        // handle updates on the query
        $scope.$on($scope.target, function() {
            $scope.handleUpdate();
        });
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService'];
