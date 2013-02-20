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
 * Facet field query controller. Fetches a list of facet values from the
 * search index. When a facet value is selected by the user, it adds a facet
 * constraint to a named query, If a named query is not specified, it adds
 * and removes the constraint from the default query.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function FieldFacetController($scope, $http, SolrSearchService, CONSTANTS) {
    // parameters
    $scope.facets = [];         // list of current query facets
    $scope.field = '';          // facet field name and name of query
    $scope.items = [];          // list of facet values for the specified field
    $scope.maxItems = 7;        // max number of results to display
    $scope.target = 'default';  // the target search results query

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add the selected facet to the facet constraint list.
     * @param Index Index of user selected facet. This facet will be added to the search list.
     * @see https://github.com/angular/angular.js/issues/1179
     */
    $scope.add = function($event,Index) {
        // create a new facet constraint
        var facet = new SolrFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list!
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                query.addFacet(facet);
            }
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Initialize the controller.
     * @param FieldName Facet field name
     * @param QueryName Name of target search query
     */
    $scope.init = function(FieldName,QueryName) {
        $scope.field = FieldName;
        if (QueryName) {
            $scope.target = QueryName;
        }
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