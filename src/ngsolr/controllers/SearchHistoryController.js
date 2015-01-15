/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 */
angular.module('ngSolr').controller('SearchHistoryController',
    ['$scope', '$attrs', 'SolrSearchService', function ($scope, $attrs, SolrSearchService) {

    var key, newquery, query;

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // Handle update events from the search service.
        $scope.$on($scope.queryName, function() {
            $scope.handleUpdate();
        });
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        // get the new query
        newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new user query is different from the last one, add it to
            // the top of the queue
            if (newquery.getUserQuery() !== $scope.queries[0].getUserQuery()) {
                $scope.queries.unshift(newquery);
                // if there are more than maxItems in the list, remove the first item
                if ($scope.queries.length > $scope.maxItems) {
                    $scope.queries.pop();
                }
            }
        } else {
            $scope.queries = [];
            $scope.queries.push(newquery);
        }
    };

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.setQuery = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            query = $scope.queries[QueryIndex];
            //if (query) {
            //    // set the query in the search service, then force it to update
            //}
        }
    };

    // initialize the controller
    $scope.init();

}]);
