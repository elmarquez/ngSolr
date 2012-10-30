/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */


/*---------------------------------------------------------------------------*/
/* Functions                                                                 */


/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * EAC facet selection controller. Manages the current set 
 * of user selected facets, filters.
 */
function facetSelectionCtrl($scope, $http, CONSTANTS) {
    // public
    $scope.items = [];
    // private
    var fieldname = "function";
    var query = new SearchQuery(CONSTANTS.SOLRBASE);
    query.setOption("wt","json");
    query.setOption("facet","true");
    // update the result set
    $scope.update = function() {
        $scope.error = null;
        $scope.message = null;
        $scope.results.facets = [];
        console.log("GET " + query.getQuery());
        $http.get(query.getQuery())
          .success(function(data) {
                $scope.items = facet_counts.facet_fields[fieldname];
            })
          .error(function(data,status,headers,config) {
            // could not load facet list
          });
    }

}
facetSelectionCtrl.$inject = ['$scope','$http','CONSTANTS'];
