/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * This should be removed and, instead, the original SearchQuery object
 * should be available in the previous query list
 * @param UserQuery
 * @param Url
 */
function Query(UserQuery,Url) {
    this.userQuery = UserQuery;
    this.url = Url;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries.
 * @param $scope Controller scope
 * @param CONSTANTS Application constants
 * @todo The previous query variable should be a list of solr queries, rather 
 *       than just the search string. Otherwise, we can not recover the 
 *       actual query URL that produced the results.
 */
function SearchHistoryController($scope,CONSTANTS) {

    // parameters
    $scope.maxQueries = 5;          // the maximum number of items to display
    $scope.queries = new Array();   // reverse chronological list of prior queries

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
    }

    /**
     * Update the constroller state.
     * @param newValue
     * @param oldValue
     */
    $scope.update = function(newValue,oldValue) {
        // has the user query changed?
        $scope.previousQuery 
        $scope.queries[0]; // the previous query
        if ($scope.queries.length > $scope.maxQueries - 1) {
            // remove the last item
            $scope.queries = $scope.queries.splice($scope.maxQueries-1,1);
        }
        var previous = $scope.previousQuery;
        $scope.queries.splice(0,0,previous);
    }

    /**
     * Watch the specified variable for changes.
     * @param scope Variable scope
     * @param variable Variable to watch
     */
    $scope.watch = function(scope,variable) {
        $scope.$watch(variable,$scope.update(),true);
    }
}

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','CONSTANTS'];