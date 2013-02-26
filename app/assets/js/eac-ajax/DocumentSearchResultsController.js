/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

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

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 */
function DocumentSearchResultsController($scope, SolrSearchService) {

    // parameters
    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.maxFieldLength = 256;        // maximum length of string for presentation
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
    $scope.view = 'list';               // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Convert month index to common name.
     * @param Index
     */
    function convertMonthIndexToName(Index) {
        var months = {
            '01':"January",
            '02':"February",
            '03':"March",
            '04':"April",
            '05':"May",
            '06':"June",
            '07':"July",
            '08':"August",
            '09':"September",
            '10':"October",
            '11':"November",
            '12':"December"
        };
        return months[Index];
    }

    /**
     * Format date to convert it to the form MMM DD, YYYY.
     * @param Date
     */
    function formatDate(DateField) {
        if (DateField) {
            var i = DateField.indexOf("T");
            if (i) {
                var d = DateField.substring(0,i);
                var parts = d.split("-");
                var year = parts[0];
                var month = convertMonthIndexToName(parts[1]);
                var day = parts[2];
                // return month + " " + day + ", " + year;
                return month + " " + year;

            }
        }
    }

    /**
     * Trim whitespace from start and end of string.
     * @param Val String to trim
     */
    function trim(Val) {
      if (Val) {
        // remove preceding white space
        while (Val.length >= 1 && Val[0] == ' ') {
          Val = Val.substring(1,Val.length-1);
        }
        // remove trailing white space
        while (Val.length >= 1 && Val[Val.length-1] == ' ') {
          Val = Val.substring(0,Val.length-2);
        }
      } 
      return Val;
    }

    /**
     * Truncate the field to the specified length.
     * @param Document Document
     * @param FieldName Field name to truncate
     * @param Length Maximum field length
     */
    function truncateField(Document,FieldName,Length) {
        if (Document && Document[FieldName]) {
            if (Document[FieldName] instanceof Array) {
                Document[FieldName] = Document[FieldName][0];
            }
            if (Document[FieldName].length > Length) {
                // remove start/end whitespace
                Document[FieldName] = trim(Document[FieldName]);
                // truncate the document to the specified length
                Document[FieldName] = Document[FieldName].substring(0,Math.min(Length,Document[FieldName].length));
                // find the last word and truncate after that
                var i = Document[FieldName].lastIndexOf(" ");
                if (i != -1) {
                    Document[FieldName] = Document[FieldName].substring(0,i) + " ...";
                }
            }
        }
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
            // calculate the total number of pages
            $scope.totalPages = results.docs.length;
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
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.update();
        });
        // update the search results
        $scope.update();
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
    $scope.update = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.docs.length;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = formatDate(results.docs[i].toDate);
                truncateField(results.docs[i],'abstract',$scope.maxFieldLength);
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
        updatePageIndex();
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService'];
