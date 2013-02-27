/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides autocomplete and extended search support aids. This is a 
 * rudimentary, non-optimal implementation.
 * @param $scope Controller scope
 * @param SolrSearchService Document search service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 * @see http://jsfiddle.net/DNjSM/17/
 * @todo reimplement to use SolrSearchService to execute all queries
 */
function SearchBoxController($scope, $http, SolrSearchService, Utils, CONSTANTS) {

    $scope.queryname = "searchHintsQuery";
    $scope.target = "defaultQuery";
    $scope.userquery = "";

    // private
    var fieldname = "title";
    var tokens = new Array();
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @param userQuery Current user query fragment
     */
    $scope.getHints = function() {
        var items = new Array();
        if ($scope.userquery.length>= minSearchLength) {
            for (var i=0;i<tokens.length;i++) {
                var token = tokens[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get the list of search hints
        var query = SolrSearchService.getDefaultQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",fieldname);
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events from the search service.
        $scope.$on($scope.queryname, function() {
            $scope.update();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        SolrSearchService.setUserQuery($scope.userquery);
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        var results = SolrSearchService.getFacetCounts($scope.queryname);
        if (results) {
            // get the term list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[fieldname];
            // transform all results to lowercase, add to list
            for (var i=0;i<result.length;i+=2) {
                var item = result[i].toLowerCase();
                tokens.push(item);
            }
        }
    };

};

// inject controller dependencies
SearchBoxController.$inject = ['$scope','$http','SolrSearchService', 'Utils', 'CONSTANTS'];
