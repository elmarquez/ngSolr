/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;            // the maximum number of items to display
    $scope.queries = [];            // list of user queries in reverse order
    $scope.queryName = 'default';   // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        // append the new query to the list
        var history = [];
        history.push(SolrSearchService.getQuery());
        // append the rest of the queries to the list
        for (var i=0;i<$scope.queries.length;i++) {
            history.push($scope.queries[i]);
        }
        $scope.queries = history;
        // if there are more than maxItems in the list, remove the first item
        if ($scope.queries.length > $scope.maxItems) {
            $scope.queries = $scope.queries.splice($scope.maxItems-1,1);
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on('update', function() {
        $scope.update();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];