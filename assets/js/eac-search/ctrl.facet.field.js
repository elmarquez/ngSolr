/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Facet result
 * @param Name Facet field name
 * @param Score Facet score
 */
function FacetResult(Value,Score) {
    this.value = Value;
    this.score = Score;
}

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/**
 * Parse result list into a format that is easier to present.
 * @param FacetList List of facets
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
 * Field facet controller.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function FieldFacetController($scope, $http, CONSTANTS) {
    // parameters
    $scope.facets = [];         // list of current query facets
    $scope.field = '';          // facet field name
    $scope.isSelected = false;  // a facet from this controller is selected
    $scope.items = [];          // list of facet values for the specified field
    $scope.maxresults = 7;      // max number of results to display

    // query to get list of facet values
    var query = new SearchQuery(CONSTANTS.SOLR_BASE,CONSTANTS.SOLR_CORE);
    query.setOption("facet","true");
    query.setOption("wt","json");

    /**
     * Add the selected facet to the facet constraint list.
     * @param Index Index of user selected facet. This facet will be added to the search list.
     */
    $scope.add = function(Index) {
      // @todo check to see if the selected facet is already in the list!
      // @todo once a facet from this controller has been added to a list, the controller should disappear
      if ($scope.facets && $scope.facets instanceof Array) {
        // check to see if the facet is already in the list
        var facet = new Facet($scope.field,$scope.items[Index].value);
        // add the facet
        $scope.facets.push(facet);
        // update the search results
        // @todo the search controller should probably watch the facet list for changes and invoke an update when it changes
        $scope.$parent.updateResults();
      }
    }

    /**
     * Initialize the controller.
     * @param FieldName Facet field name
     * @param FacetList List of current query facets 
     */
    $scope.init = function(FieldName,FacetList) {
        $scope.field = FieldName;
        $scope.facets = FacetList;
        $scope.update();
    }

    /**
     * Update the list of facet values.
     */
    $scope.update = function() {
        query.setOption("facet.field",$scope.field);
        query.setOption("facet.limit",$scope.maxresults);
        console.log("GET " + query.getUrl());
        $http.get(query.getUrl())
            .success(function(data) {
                $scope.items = parse(data.facet_counts.facet_fields[$scope.field]);
            })
            .error(function(data,status,headers,config) {
                console.log("Could not load facet results for '" + $scope.field + "'");
            });
    }

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','CONSTANTS'];