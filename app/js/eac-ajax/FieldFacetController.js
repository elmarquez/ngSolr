/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Facet field query controller. Fetches a list of facet values from the
 * search index for the specified field name. When a facet value is selected
 * by the user, it adds a facet constraint to the target named query, If a
 * named query is not specified, it adds and removes the constraint from the
 * default query. We assume here that the target and facet queries will not
 * change names during operation.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $http, SolrSearchService) {

    // parameters
    $scope.facets = [];             // list of current query facets
    $scope.field = '';              // facet field name and name of query
    $scope.items = [];              // list of facet values for the specified field
    $scope.maxItems = 7;            // max number of results to display
    $scope.queryname = '';          // query name
    $scope.target = 'defaultQuery'; // the target search query

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Facet result
     * @param Name Facet field name
     * @param Score Facet score
     */
    function FacetResult(Value,Score) {
        this.value = Value;
        this.score = Score;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add the selected facet to the facet constraint list.
     * @param Index Index of user selected facet. This facet will be added to the search list.
     */
    $scope.add = function($event,Index) {
        // create a new facet constraint
        var facet = SolrSearchService.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list!
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                query.addFacet(facet);
                SolrSearchService.updateQuery($scope.target);
            }
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Initialize the controller.
     * @param FieldName Facet field name
     * @param Target Name of target search query to constrain
     */
    $scope.init = function(FieldName,Target) {
        $scope.field = FieldName;
        if (Target) {
            $scope.target = Target;
        }
        // create a query to get the list of facets
        $scope.queryname = $scope.field + "Query";
        var query = SolrSearchService.createQuery();
        query.setOption("facet","true");
        query.setOption("facet.field",$scope.field);
        query.setOption("facet.limit",$scope.maxItems);
        query.setOption("facet.mincount","1");
        query.setOption("facet.sort","count");
        query.setOption("rows","0");
        query.setOption("wt","json");
        SolrSearchService.setQuery(query,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
        // handle update events on the query
        $scope.$on($scope.queryname, function () {
            $scope.update();
        });
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
        var results = SolrSearchService.getFacetCounts($scope.queryname);
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

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','SolrSearchService'];