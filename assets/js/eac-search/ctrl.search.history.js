/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

// This should be removed and, instead, the original SearchQuery object
// should be available in the previous query list
function Query(UserQuery,Url) {
    this.userQuery = UserQuery;
    this.url = Url;
}

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries.
 * @todo The previous query variable should be a list of solr queries, rather 
 *       than just the search string. Otherwise, we can not recover the 
 *       actual query URL that produced the results.
 */
function searchHistoryCtrl($scope) {
    // fields
    $scope.maxQueries = 5;          // the maximum number of items to display
    $scope.queries = new Array();   // list of prior queries
    // update the result set
    $scope.update = function() {
        var query = new Query("Query","http://www.example.com");
        $scope.queries.push(query);
        if ($scope.queries.length > $scope.maxQueries) {
            $scope.queries = $scope.queries.splice(0,1);
        }
    }
    // watch the specified variable for chanages
    $scope.watch = function(scope,variable) {
        scope.$watch(variable,$scope.update);
    }
}
searchHistoryCtrl.$inject = ['$scope'];