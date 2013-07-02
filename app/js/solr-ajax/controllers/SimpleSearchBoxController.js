/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SearchBoxController                                                       */

/**
 * Provides auto-complete and extended search support aids. When the user
 * submits the query, it redirects them to the specified page.
 * @param $scope Controller scope
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SimpleSearchBoxController($scope, SolrSearchService, Utils) {

    // the list of all search hints
    $scope.hints = [];

    // the subset of hints displayed to the user
    $scope.hintlist = [];

    // the maximum number of hints to display at any moment
    $scope.maxHints = 10;

    // the URL to the search results page
    $scope.resultsPage = 'results.html';

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title_city'; // @todo change to hints by default for all sites

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    $scope.minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var hintlist = [];
        if ($scope.userquery.length >= $scope.minSearchLength) {
            for (var i=0;i<$scope.hints.length, hintlist.length<$scope.maxHints;i++) {
                var token = $scope.hints[i];
                try {
                    if (token.indexOf($scope.userquery) > -1) {
                        hintlist.push(token);
                    }
                } catch (err) {
                    continue;
                }
            }
        }
        return hintlist;
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
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

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("rows","0");
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery($scope.searchHintsQuery,query);
        // handle update events from the search service
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // close the autocomplete dropdown hints list
        $("#simplesearch-input").autocomplete("close");
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // build the redirect URL
        var url = window.location.href;
        var i = url.lastIndexOf('/');
        url = url.substring(0,i+1);
        url += $scope.resultsPage + "#/" + $scope.userquery;
        // change the browser location
        window.location.href = url;
    };

}

// inject controller dependencies
SimpleSearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];

