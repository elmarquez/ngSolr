/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results.
 * @param $scope Controller scope
 * @param CONSTANTS Application constants
 */
function DocumentSearchResultsController($scope,CONSTANTS) {

    // parameters
    $scope.items = [];       // presentation items
    $scope.sidebar = true;   // show the sidebar panel
    $scope.view = 'list';    // view type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Build a page index for navigation of search results.
     * @param $scope Controller scope
     */
    function buildPageIndex($scope) {
      // the default page navigation set
      var pages = [];
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
        pages.push(prevPage);
      }
      // page links
      for (var i=firstPageInSet;i<=lastPageInSet;i++) {
        var page = new Page(i+1,i*$scope.itemsPerPage);
        if (page.number==$scope.page) {
          page.isActive = true;
        }
        pages.push(page);
      }
      // link to next set
      if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
        var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
        var nextPage = new Page("»",nextSet);
        pages.push(nextPage);
      }
      // return results
      return pages;
    };

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

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
      $scope.update();
    };

    /**
     * Update the controller state.
     */
    $scope.update = function(newValue,oldValue) {
      $scope.pages = buildPageIndex($scope);
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$http','$location','$scope','CONSTANTS'];
