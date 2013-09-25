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
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService
 * @param Utils Utility
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, $attrs, $location, $route, $routeParams, $window, SolrSearchService, Utils) {

    // the complete list of search hints
    $scope.hints = [];

    // the subset of hints displayed to the user
    // @todo is this actually used??
    $scope.hintlist = [];

    // the maximum number of hints to display at any moment
    $scope.maxHints = 10;

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    $scope.minSearchLength = 3;

    // the name of the main query
    $scope.queryName = SolrSearchService.defaultQueryName;

    // when the user submits the query, redirect to the specified URL, with the
    // query appended, to render the results
    $scope.redirect = undefined;

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'hints';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // url to solr core
    $scope.source = undefined;

    // the query string provided by the user
    $scope.userquery = "";

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Get the list of matching hints.
     */
    $scope.getHintList = function() {
        $scope.hintlist = $scope.hints.splice(0,10);
    };

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
     * Handle submit click event. Construct a valid Solr query URL from the
     * user input data, then execute a GET call with that URL.
     */
    $scope.handleSubmit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // build the query string
        var query = SolrSearchService.getQuery($scope.queryName);
        if (query == undefined) {
            query = SolrSearchService.createQuery($scope.source);
        }
        query.setUserQuery($scope.userquery);
        // update the window location
        var hash = query.getHash();
        if ($scope.redirect) {
            $window.location.href = $scope.redirect + '/#' + hash;
        } else {
            $location.path(hash);
        }
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
        // apply configured attributes
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                if (key == 'documentsPerPage' || key == 'pagesPerSet') {
                    $scope[key] = parseInt($attrs[key]);
                } else {
                    $scope[key] = $attrs[key];
                }
            }
        }
        // handle location change event, update query value
        $scope.$on("$routeChangeSuccess", function() {
            var hash = ($routeParams.query || "");
            var query = SolrSearchService.getQueryFromHash(hash);
            $scope.userquery = query.getUserQuery();
        });
        // create a query to fetch the list of search hints
        var query = SolrSearchService.createQuery($scope.source);
        query.setOption("rows", "0");
        query.setOption("facet", "true");
        query.setOption("facet.limit", "-1");
        query.setOption("facet.field", $scope.searchHintsField);
        SolrSearchService.setQuery($scope.searchHintsQuery,query);
        // handle update events on the hints query
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleUpdate();
        });
        // update the hints query
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService','Utils'];
