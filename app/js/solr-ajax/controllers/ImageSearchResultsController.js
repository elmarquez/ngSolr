/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

 'use strict';

/*---------------------------------------------------------------------------*/
/* ImageSearchResultsController                                              */

/**
 * Image based search controller.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param CONSTANTS Application constants
 */
function ImageSearchResultsController($scope, SolrSearchService, CONSTANTS) {

	// parameters
    $scope.itemsPerPage = 16;           // the number of items per page
    $scope.itemsPerRow = 4;             // the number of items per row
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.rows = [];                   // document search results
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
	$scope.query = '';

	///////////////////////////////////////////////////////////////////////////

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

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
	$scope.init = function() {
        // redefine the default search query to ensure that only records with
        // digital objects show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setUserQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter("imageQuery","+dobj_type:*");
            return query;
        };
        var query = SolrSearchService.createQuery();
        query.setOption("rows",$scope.itemsPerPage);
        SolrSearchService.setQuery($scope.queryname,query);
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
	};

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
	$scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.itemsPerRow) {
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
        updatePageIndex();
	};

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','SolrSearchService','CONSTANTS'];