/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Document search result item.
 * @constructor
 */
function Document(Title, Url, Location, Summary) {
    var setifdefined = function(Val) {
        if (Val) {
            return Val;
        }
        return '';
    };
    this.title = setifdefined(Title);
    this.url = setifdefined(Url);
    this.location = setifdefined(Location);
    this.summary = setifdefined(Summary);
};

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
};

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param CONSTANTS Application constants
 */
function DocumentSearchResultsController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.queryname = "documents"; // the name of the search query

    $scope.documents = [];          // document search results
    $scope.itemsPerPage = 10;       // the number of search results per page
    $scope.page = 0;                // the current search result page
    $scope.pages = [];              // list of pages in the current navigation set
    $scope.pagesPerSet = 10;        // the number of pages in a navigation set
    $scope.startPage = 0;           // zero based start page index
    $scope.totalPages = 1;          // count of the total number of result pages
    $scope.totalResults = 0;        // count of the total number of search results
    $scope.totalSets = 1;           // count of the number of search result sets
    $scope.view = 'list';           // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Reformat a collection of document records for presentation. Truncate each 
     * field to the maximum length specified.
     * @param Items
     * @param FieldName
     * @param Length
     * @todo consider merging this into a single function that can handle one or more objects. 
     */
    function format(Items,FieldName,Length) {
      // if the item is an array
      if (Items) {
        for (var i=0;i<Items.length;i++) {
          truncateField(Items[i],FieldName,Length);
        }
      }
      // if an item is an object
      return Items;
    };

    /**
     * Return property value if present in the object. Otherwise, return an empty string.
     * @param Obj
     * @param Prop
     * @return {*}
     */
    function getIfPresent(Obj,Prop) {
        if (Obj && Prop in Obj) {
            return Obj[Prop];
        }
        return '';
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
    };

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
          // truncate the document to the specified length
          Document[FieldName] = Document[FieldName].substring(0,Math.min(Length,Document[FieldName].length));
          // find the last word and truncate after that
          var i = Document[FieldName].lastIndexOf(" ");
          if (i != -1) {
            Document[FieldName] = Document[FieldName].substring(0,i) + " ...";
          }
        }
      }
    };

    /**
     * Update page index for navigation of search results.
     * @param $scope Controller scope
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // calculate the total number of pages
        $scope.totalPages = SolrSearchService.getQueryResults().length;
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
    };

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {

    };

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getQueryResults();
        $scope.totalResults = results.length;
        $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
        $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
        // add new results
        for (var i=0;i<$scope.itemsPerPage;i++) {
            var title = getIfPresent(results[i],'title');
            var url = getIfPresent(results[i],'url');
            var location = getIfPresent(results[i],'location');
            var summary = getIfPresent(results[i],'summary');
            var doc = new Document(title,url,location,summary);
            $scope.documents.push(doc);
        }
        // update the page index
        updatePageIndex();
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on('update', function () {
        $scope.update();
    });

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService','CONSTANTS'];
