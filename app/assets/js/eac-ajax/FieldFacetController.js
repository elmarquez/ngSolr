/**
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
/* Controller                                                                */

/**
 * Facet field query controller.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function FieldFacetController($scope, $http, SolrSearchService, CONSTANTS) {
    // parameters
    $scope.facets = [];         // list of current query facets
    $scope.field = '';          // facet field name and name of query
    $scope.isSelected = false;  // a facet from this controller is selected
    $scope.items = [];          // list of facet values for the specified field
    $scope.maxItems = 7;        // max number of results to display

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add the selected facet to the facet constraint list.
     * @param Index Index of user selected facet. This facet will be added to the search list.
     * @see https://github.com/angular/angular.js/issues/1179
     */
    $scope.add = function($event,Index) {
      // @todo check to see if the selected facet is already in the list!
      // @todo once a facet from this controller has been added to a list, the controller should disappear
      if ($scope.facets && $scope.facets instanceof Array) {
        // check to see if the facet is already in the list
        var facet = new SolrFacet($scope.field,$scope.items[Index].value);
        // add the facet
        $scope.facets.push(facet);
        // update the search results
        $scope.$parent.updateResults();
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
      }
    };

    /**
     * Initialize the controller.
     * @param FieldName Facet field name
     * @param FacetList List of current query facets 
     */
    $scope.init = function(FieldName,FacetList) {
        $scope.field = FieldName;
        $scope.facets = FacetList;
        // build the query
        var query = SolrSearchService.getDefaultQuery();
        query.setOption("facet","true");
        query.setOption("facet.field",$scope.field);
        query.setOption("facet.limit",$scope.maxItems);
        query.setOption("facet.mincount","1");
        query.setOption("facet.sort","count");
        query.setOption("fl", "title,function");
        query.setOption("q","*:*");
        query.setOption("wt","json");
        // set the query
        SolrSearchService.setQuery(query,$scope.field);
        // update the query
        $scope.update();
    };

    /**
     * Update the list of facet values.
     */
    $scope.update = function() {
        // clear current results
        $scope.items = [];
        // get new results
        var results = SolrSearchService.getFacetCounts($scope.field);
        if (results && results.facet_fields) {
            if (results.hasOwnProperty('facet_fields')) {
                for (var i = 0; i < results.facet_fields[$scope.field].length && i <$scope.maxItems; i+=2) {
                    var label = results.facet_fields[$scope.field][i];
                    var count = results.facet_fields[$scope.field][i+1];
                    var result = new FacetResult(label,count);
                    $scope.items.push(result);
                }
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on('update', function () {
        $scope.update();
    });

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','SolrSearchService','CONSTANTS'];