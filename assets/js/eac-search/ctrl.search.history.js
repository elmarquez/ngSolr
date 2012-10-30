/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

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
    
    var fieldname = 'previousQuery';    // field to watch for queries
    var maxQueries = 5;                 // the maximum number of items to display
	$scope.queries = new Array();

    // update the result set
    $scope.update = function() {
        var query = new Query("Query","http://www.example.com");
        $scope.queries.push(query);
        if ($scope.queries.length > maxQueries) {
            $scope.queries = $scope.queries.splice(0,1);
        }
    }

    // watch the variable for chanages
    $scope.watch = function($myscope) {
        // @todo figure out how not to hard code the watched variable name into this
        $myscope.$watch(fieldname,$scope.update);
    }

}

searchHistoryCtrl.$inject = ['$scope'];
