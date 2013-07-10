/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SearchFormController                                                      */

/**
 * SimpleSearch search form controller.
 * @param $scope
 * @param SolrSearchService
 * @param Utils
 * @constructor
 */
function SearchFormController($scope, $element, $attrs, $transclude, SolrSearchService, Utils) {
    // the field name where search hints are taken from
    $scope.field = 'hints';

    // the list of all search hints
    $scope.hints = [];

    // the subset of hints displayed to the user
    $scope.hintlist = [];

    // the maximum number of hints to display at any moment
    $scope.maxHints = 10;

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    $scope.minSearchLength = 3;

    // the URL to the search results page
    $scope.presenter = 'results.html';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the url to the solr search service
    $scope.source = undefined;

    // the query string provided by the user
    $scope.userquery = "";

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
            var result = results.facet_fields[$scope.field];
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
        // set attribute values
        if ($attrs.field) {
            $scope.field = $attrs.field;
        }
        if ($attrs.presenter) {
            $scope.presenter = $attrs.presenter;
        }
        if ($attrs.source) {
            $scope.source = $attrs.source;
        }
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery($scope.source);
        query.setOption("rows","0");
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.field);
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
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // build the redirect URL
        var url = window.location.href;
        var i = url.lastIndexOf('/');
        url = url.substring(0,i+1);
        url += $scope.presenter + "#/" + $scope.userquery;
        // change the browser location
        window.location.href = url;
    };

    // configure the element
    $scope.init();

}

/*---------------------------------------------------------------------------*/
/* SearchResultsController                                                   */

/**
 * Search results controller. Presents search results for a named query.
 * @param $scope
 * @param $element
 * @param $attrs
 * @param $transclude
 * @param $route
 * @param $routeParams
 * @param SolrSearchService
 * @param Utils
 */
function SearchResultsController($scope, $element, $attrs, $transclude, $location, $route, $routeParams, SolrSearchService, Utils) {

    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.source = undefined;          // url to solr core
    $scope.start = 0;                   // zero based document index for first record
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Document search result item.
     * @param Title
     * @param Uri
     * @param Location
     * @param Abstract
     */
    function Document(Title, Uri, Location, Abstract) {
        var setIfDefined = function(Val) {
            if (Val) {
                return Val;
            }
            return '';
        };
        this.title = setIfDefined(Title);
        this.uri = setIfDefined(Uri);
        this.location = setIfDefined(Location);
        this.abstract = setIfDefined(Abstract);
    }

    /**
     * A page in a pagination list
     * @param Name Page name
     * @param Num Page number
     */
    function Page(Name,Num) {
        this.name = Name;
        this.number = Num;
        this.isActive = false;
        this.isDisabled = false;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // configure the controller with specified attribute value
        if ($attrs.source) {
            $scope.source = $attrs.source;
        }
        // handle location change event
        $scope.$on("$routeChangeSuccess", function() {
                $scope.userquery = ($routeParams.userquery || "");
                $scope.page = ($routeParams.page || 1);
                $scope.start = ($scope.page - 1) * $scope.itemsPerPage;
                // update the query
                var query = SolrSearchService.createQuery($scope.source);
                query.setUserQuery($scope.userquery);
                query.setOption("start", $scope.start);
                // update the presentation
                SolrSearchService.setQuery($scope.queryname, query);
                SolrSearchService.updateQuery($scope.queryname);
            }
        );
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleUpdate();
        });
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                // add to result list
                $scope.documents.push(results.docs[i]);
            }
        } else {
            $scope.documents = [];
            $scope.totalResults = 0;
            $scope.totalPages = 1;
            $scope.totalSets = 1;
        }
        // update the page index
        $scope.updatePageIndex();
    };

    /**
     * Update page index for navigation of search results. Pages are presented
     * to the user and are one-based, rather than zero-based as the start
     * value is.
     */
    $scope.updatePageIndex = function() {
        // the default page navigation set
        $scope.pages = [];
        // determine the current zero based page set
        var currentSet = Math.floor($scope.page / $scope.pagesPerSet);
        // determine the first and last page in the set
        var firstPageInSet = (currentSet * $scope.pagesPerSet) + 1;
        var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
        if (lastPageInSet > $scope.totalPages) {
            lastPageInSet = $scope.totalPages;
        }
        // link to previous set
        if ($scope.totalSets > 1 && currentSet != 0) {
            var previousSet = firstPageInSet - $scope.pagesPerSet - 1;
            var prevPage = new Page("«", previousSet + 1);
            $scope.pages.push(prevPage);
        }
        // page links
        for (var i=firstPageInSet;i<=lastPageInSet;i++) {
            var page = new Page(i,i);
            if (page.number==$scope.page) {
                page.isActive = true;
            }
            $scope.pages.push(page);
        }
        // link to next set
        if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
            var nextSet = lastPageInSet + 1;
            var nextPage = new Page("»",nextSet);
            $scope.pages.push(nextPage);
        }
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
SearchFormController.$inject = ['$scope','$element','$attrs','$transclude','SolrSearchService','Utils'];
SearchResultsController.$inject = ['$scope','$element','$attrs','$transclude','$location','$route','$routeParams','SolrSearchService','Utils'];

