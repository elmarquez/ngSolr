/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Responsible for handling initialization activities, to ensure that the
 * application components all start correctly.
 * @param $scope Controller scope
 * @param $routeProvider Route provider
 * @param SolrSearchService Apache Solr search service interface
 */
function DocumentSearchController($scope, $routeProvider, SolrSearchService) {

    $scope.hash = $routeParams.query;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Determine if the current location URL has a query. We use a simple
     * text here to see if the hash starts with some standard chars.
     * @returns {Boolean} True if the location contains a query, false otherwise.
     */
    function windowLocationHasQuery() {
        var hash = window.location.hash;
        if (hash.indexOf('#/q=') != -1) {
            return true;
        }
        return false;
    };

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller. If there is a search query specified in the
     * URL when the controller initializes then use that as the initial query,
     * otherwise use the default.
     */
    $scope.init = function() {
        if (windowLocationHasQuery()) {
            var query = SolrSearchService.getQueryFromHash(window.location.hash);
        } else {
            var query =
            svc.queries[defaultQueryName] = SolrSearchService.createQuery();
        }
    };

}

// inject controller dependencies
DocumentSearchController.$inject = ['$scope','$routeProvider','SolrSearchService'];
