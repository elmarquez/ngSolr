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
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // private

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var items = [];
        if ($scope.userquery.length >= minSearchLength) {
            for (var i=0;i<$scope.hints.length;i++) {
                var token = $scope.hints[i];
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
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery(query,$scope.searchHintsQuery);
        // handle update events from the search service.
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleFacetListUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // if we need to reset the query parameters
        if ($scope.resetOnChange) {
            // create a new query and set the user query property
            // to the value provided by the user
            var query = SolrSearchService.createQuery();
            query.setUserQuery($scope.userquery);
            SolrSearchService.setQuery(query,$scope.target);
        } else {
            // keep the existing search query but change the current user query
            // value and set the starting document number to 0
            var query = SolrSearchService.getQuery($scope.target);
            query.setUserQuery($scope.userquery);
            query.setOption("start","0");
        }
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];
