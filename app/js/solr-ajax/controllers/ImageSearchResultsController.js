/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* ImageSearchResultsController                                              */

/**
 * Image based search controller. Present search results for a named query.
 *
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService Solr search service.
 */
function ImageSearchResultsController($scope, $attrs, $location, $route, $routeParams, $window, SolrSearchService) {

    // the number of items per page
    $scope.documentsPerPage = 16;

    // the number of items per row
    $scope.documentsPerRow = 4;

    // fields to retrieve from solr
    $scope.fields = '*';

    // flag for when the controller has submitted a query and is waiting on a
    // response
    $scope.loading = false;

    // the current search results page
    $scope.page = 0;

    // list of pages in the current navigation set
    $scope.pages = [];

    // the number of pages in a navigation set
    $scope.pagesPerSet = 10;

    // document search results
    $scope.rows = [];

    // the query name
    $scope.queryname = SolrSearchService.defaultQueryName;

    // url to solr core
    $scope.source = undefined;

    // zero based start page index
    $scope.startPage = 0;

    // count of the total number of result pages
    $scope.totalPages = 1;

    // count of the total number of result pages
    $scope.totalResults = 0;

    // count of the number of search result sets
    $scope.totalSets = 1;

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
     * Handle update on image search results.
     */
    $scope.handleUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.documentsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.documentsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.documentsPerRow || i==results.docs.length - 1) {
                    count = 0;
                    $scope.rows.push(row);
                    row = [];
                }
            }
        } else {
            $scope.rows = [];
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
                if (key == 'documentsPerPage' || key == 'documentsPerRow' || key == 'pagesPerSet') {
                    $scope[key] = parseInt($attrs[key]);
                } else if ($attrs[key] == 'true' || $attrs[key] == 'false') {
                    $scope[key] = $attrs[key] == "true";
                } else {
                    $scope[key] = $attrs[key];
                }
            }
        }
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleUpdate();
        });
        // handle location change event, update query results
        $scope.$on("$routeChangeSuccess", function() {
            // if there is a query in the current location
            $scope.query = ($routeParams.query || "");
            if ($scope.query) {
                // get the current query
                var query = SolrSearchService.getQueryFromHash($scope.query, $scope.source);
                // if there is a data source specified, override the default
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
        });
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

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService'];