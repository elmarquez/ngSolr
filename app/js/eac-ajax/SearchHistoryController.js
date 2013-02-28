/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.load = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            var query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        // get the new query
        var newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new query is the same as the last query, ignore it
            if (newquery != $scope.queries[0]) {
                // add new query to the top of the queue
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
     * Handle update events from the search service.
     */
    $scope.$on($scope.queryName, function() {
        $scope.update();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];