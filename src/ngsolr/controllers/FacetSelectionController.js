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

    var hash, key, query;

    // facets
    $scope.items = [];

    // URL to Solr core
    $scope.source = undefined;

    // target query name
    $scope.target = SolrSearchService.defaultQueryName;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet constraint from the target query.
     * @param Index Index of facet in the list
     */
    $scope.remove = function(Index) {
        query = SolrSearchService.getQuery($scope.target);
        query.removeFacetByIndex(Index);
        // change window location
        hash = query.getHash();
        $location.path(hash);
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        hash = ($routeParams.query || '');
        query = SolrSearchService.getQueryFromHash(hash, $scope.source);
        if (query) {
            $scope.items = query.getFacets();
        }
    };

    /**
     * Initialize the controller
     */
    $scope.init = function() {
        // apply configured attributes
        for (key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // update the list of facets on route change
        $scope.$on('$routeChangeSuccess', function() {
            $scope.handleUpdate();
        });
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService'];
