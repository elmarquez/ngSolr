/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

function FacetResult(Name,Score) {
    this.name = Name;
    this.score = Score;
}

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/**
 * Parse result list into a format that is easier to present.
 */
function parse(FacetList) {
    var items = new Array();
    if (FacetList) {
        for (var i=0;i<FacetList.length;i+=2) {
            var result = new FacetResult(FacetList[i],FacetList[i+1]);
            items.push(result);
        }
    }
    return items;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Facet Controller
 * @todo Consider renaming this a FieldFacetCtrl, then implementing Range, etc. facet controls 
 */
function facetCtrl($scope, $http, CONSTANTS) {
    // parameters
    $scope.items = [];      // list of all facet values for the specified field
    $scope.facets = [];     // list of current query facets
    $scope.field = '';      // facet field name
    $scope.maxresults = 7;  // max number of results to display

    // query
    var query = new SearchQuery(CONSTANTS.SOLR_BASE);
    query.setOption("facet","true");
    query.setOption("wt","json");

    // Add the selected facet to the facet constraint list.
    $scope.add = function(Index) {
      if ($scope.facets && $scope.facets instanceof Array) {
        // check to see if the facet is already in the list
        var facet = new Facet($scope.items[Index]);
        // add the facet
        $scope.facets.push(facet);
        // update the results
        // $scope.$parent.updateResults();
      }
    }

    // Get the facet list
    $scope.update = function() {
        query.setOption("facet.field",$scope.field);
        query.setOption("facet.limit",$scope.maxresults);
        console.log("GET " + query.getQuery());
        $http.get(query.getQuery())
            .success(function(data) {
                $scope.items = parse(data.facet_counts.facet_fields[$scope.field]);
            })
            .error(function(data,status,headers,config) {
                console.log("Could not load facet results for '" + $scope.field + "'");
            });
    }

}
facetCtrl.$inject = ['$scope','$http','CONSTANTS'];
