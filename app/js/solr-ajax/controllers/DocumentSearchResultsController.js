/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* DocumentSearchResultsController                                           */

/**
 * Search results controller. Presents search results for a named query.
 * @param $scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SelectionSetService
 * @param SolrSearchService
 * @param Utils
 */
function DocumentSearchResultsController($scope, $attrs, $location, $route, $routeParams, $window, SelectionSetService, SolrSearchService, Utils) {

    $scope.documents = [];                                  // document search results
    $scope.documentsPerPage = 10;                           // the number of search results per page
    $scope.page = 0;                                        // the current search result page
    $scope.pages = [];                                      // list of pages in the current navigation set
    $scope.pagesPerSet = 10;                                // the number of pages in a navigation set
    $scope.queryname = SolrSearchService.defaultQueryName;  // default query name
    $scope.source = undefined;                              // url to solr core
    $scope.start = 0;                                       // zero based document index for first record
    $scope.totalPages = 1;                                  // count of the total number of result pages
    $scope.totalResults = 0;                                // count of the total number of search results
    $scope.totalSets = 1;                                   // count of the number of search result sets
    $scope.userquery = '';                                  // user query

    ///////////////////////////////////////////////////////////////////////////

    /**
     * A page in a pagination list
     * @param Name Page name
     * @param Num Page number
     */
    function Page(Name,Num) {
        this.name = Name;
        this.number = Num;
        this.isCurrent = false;
    }


    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        try {
            SelectionSetService.remove(Id);
            SelectionSetService.clear();
        } catch (err) {
            if (window.console) {
                console.log(err.message);
            }
        }
    };

    /**
     * Set the results page number.
     * @param Start
     */
    $scope.handleSetPage = function(Start) {
        var query = SolrSearchService.getQuery($scope.queryname);
        query.setOption('start', Start * $scope.documentsPerPage);
        var hash = query.getHash();
        $location.path(hash);
        $window.scrollTo(0, 0);
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
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.documentsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.documentsPerPage;i++) {
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
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // handle location change event, update query results
        $scope.$on("$routeChangeSuccess", function() {
                $scope.query = ($routeParams.query || "");
                if ($scope.query) {
                    var query = SolrSearchService.getQueryFromHash($scope.query);
                    if ($scope.source) {
                        query.solr = $scope.source;
                    }
                    // set the display values to match those in the query
                    $scope.documentsPerPage = (query.getOption('rows') || 10);
                    $scope.page = (Math.ceil(query.getOption('start') / $scope.documentsPerPage) || 0);
                    $scope.userquery = query.getUserQuery();
                    // update results
                    SolrSearchService.setQuery($scope.queryname, query);
                    SolrSearchService.updateQuery($scope.queryname);
                }
            }
        );
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleUpdate();
        });
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        SelectionSetService.add(Id,null);
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
            var prevPage = new Page("«", previousSet);
            $scope.pages.push(prevPage);
        }
        // page links
        for (var i=firstPageInSet;i<=lastPageInSet;i++) {
            var page = new Page(i,i-1);
            if (page.number==$scope.page) {
                page.isCurrent = true;
            }
            $scope.pages.push(page);
        }
        // link to next set
        if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
            var nextSet = lastPageInSet;
            var nextPage = new Page("»", nextSet);
            $scope.pages.push(nextPage);
        }
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SelectionSetService','SolrSearchService','Utils'];
