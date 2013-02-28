/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param SolrSearchService Document search service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 * @see http://jsfiddle.net/DNjSM/17/
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
        var query = SolrSearchService.createQuery();
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
        // create a new query
        var query = SolrSearchService.createQuery();
        query.setUserQuery($scope.userquery);
        SolrSearchService.setQuery(query,$scope.target);
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        var results = SolrSearchService.getFacetCounts($scope.queryname);
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the term list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[fieldname];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    tokens.push(item);
                }
            }
        }
    };

};

// inject controller dependencies
SearchBoxController.$inject = ['$scope','$http','SolrSearchService', 'Utils', 'CONSTANTS'];
