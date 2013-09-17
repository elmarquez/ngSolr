/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SearchBoxController                                                       */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param $location
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, $location, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // the subset of hints displayed to the user
    $scope.hintlist = [];

    // the maximum number of hints to display at any moment
    $scope.maxHints = 10;

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'hints';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////

    $scope.getHintList = function() {
        $scope.hintlist = $scope.hints.splice(0,10);
    };

    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var hintlist = [];
        if ($scope.userquery.length >= minSearchLength) {
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
     * Handle submit click event. Construct a valid Solr query URL from the
     * user input data, then execute a GET call with that URL.
     * https://web/ECOMt/solr/FACP/select?q=BONDI+(fromDate:[* TO 1980-12-31T23:59:59Z] AND toDate:[1970-01-01T00:00:00Z TO *])&fq=region:(NSW)&wt=json
     */
    $scope.handleSubmit = function() {
        // close the autocomplete dropdown hints list
        $("#search-box-input").autocomplete("close");
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // build the query string
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        if (query) {
            query.setOption("rows", 10);
            query.setOption("start", 0);
        } else {
            query = SolrSearchService.createQuery();
        }
        query.setUserQuery($scope.userquery);
        // log the query
        if (window.console) {
            console.log("QUERY " + query);
        }
        // update the window location
        var hash = query.getHash();
        $location.path(hash);
        // $scope.$apply();
        // prevent the default form submit behavior
        return false;
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
        // create a query
        var query = SolrSearchService.createQuery();
        query.setOption("rows","0");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery($scope.searchHintsQuery,query);
        // handle update events on the query
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleUpdate();
        });
        // update query results
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope', '$location', 'SolrSearchService', 'Utils'];
