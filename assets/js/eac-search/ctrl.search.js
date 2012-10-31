/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * A page in a pagination list
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
}

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/**
 * Build a page index for navigation of search results.
 */
function buildPageIndex($scope) {
  var index = [];
  var firstPageInSet = 0;
  var lastPageInSet = $scope.pagesPerSet;
  // define the page navigation set
  if ($scope.page!=0) {
      firstPageInSet = Math.floor($scope.page/$scope.pagesPerSet) * $scope.pagesPerSet;
  }
  if (lastPageInSet > $scope.totalPages) {
      lastPageInSet = $scope.totalPages;
  } else {
      lastPageInSet = firstPageInSet + $scope.pagesPerSet;
  }
  // previous set link
  if ($scope.totalPages>$scope.pagesPerSet) {
    if ($scope.page==0) {
      var prev = new Page("«","#");
      prev.isDisabled = true;
      index.push(prev);
    } else {
      var prev = new Page("«",firstPageInSet-$scope.pagesPerSet);
      index.push(prev);
    }
  }
  // current page set links
  makePages(index,firstPageInSet,lastPageInSet,$scope.page);
  // next set link
  if ($scope.totalPages>$scope.pagesPerSet) {
    if ($scope.page==lastPageInSet) {
      var next = new Page("»","#");
      next.isDisabled = true;
      index.push(next);
    } else {
      var next = new Page("»",lastPageInSet);
      index.push(next);
    }
  }
  // return results
  return index;
}

function format(Documents,Length) {
  if (Documents) {
    for (var i=0;i<Documents.length;i++) {
      truncateField(Documents[i],'text',Length);
    }
  }
  return Documents;
}

function getDefaultQuery($scope,CONSTANTS) {
  var query = new SearchQuery(CONSTANTS.SOLR_BASE);
  query.setOption("explainOther","");
  query.setOption("fl","uri,title,text");
  query.setOption("hl.fl",$scope.highlightingParameters);
  query.setOption("indent","on");
  query.setOption("q",$scope.userQuery);
  query.setOption("rows",$scope.itemsPerPage);
  query.setOption("start",0);
  query.setOption("version",CONSTANTS.SOLR_VERSION);
  query.setOption("wt","json");
  query.setOption("q",CONSTANTS.DEFAULT_QUERY);  
  return query;
}

/**
 * Determine if a user query is valid.
 * @todo this needs more development
 */
function isValidQuery(Val) {
  if (Val && Val != '' && Val != ' ') {
    return true;
  }
  return false;
}

/**
 * 
 */
function makePages(Pages,Start,Finish,Current) {
  for (var i=Start;i<Finish;i++) {
    var page = new Page(i+1,i);
    if (i==Current) {
      page.isActive = true;
    }
    Pages.push(page);
  }
}

/**
 * Truncate the text field to the specified length. If the text field does not
 * exist for the record, add it and assign an empty value to ensure other 
 * operations do not fail.
 */
function truncateField(Document,FieldName,Length) {
  if (Document) {
    if (Document[FieldName]) {
      if (Document[FieldName] instanceof Array) {
        Document[FieldName] = Document[FieldName][0].substring(0,Math.min(Length,Document[FieldName][0].length));
      } else {
        Document[FieldName] = Document[FieldName].substring(0,Math.min(Length,Document[FieldName].length));
      }
    } else {
      Document[FieldName] = " ";
    }
  }
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Executes a keyword search against a Solr index.
 */
function searchCtrl($scope, $http, CONSTANTS) {
    // public
    $scope.error = null;                // error message to user
    $scope.facets = [];                 // list of search facets
    $scope.highlighting = true;         // result highlighing on/off
    $scope.highlightingParameters = ""; // result highlighting parameters
    $scope.itemsPerPage = 10;           // number of search results per page
    $scope.message = null;              // info or warning message to user
    $scope.page = 0;                    // result page currently being displayed
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // number of pages in a navigation set
    $scope.previousQuery = '';          // previous query
    $scope.queryMaxScore = 1;           // maximum result score
    $scope.queryNumFound = 0;           // number of result items found
    $scope.queryParams = '';            // query parameters
    $scope.queryStatus = '';            // query result status code
    $scope.queryTime = 0;               // query execution time
    $scope.results = [];                // query results
    $scope.totalPages = 1;              // total number of result pages
    $scope.totalSets = 1;               // total number of page sets

    // set the default query
    $scope.userQuery = CONSTANTS.DEFAULT_QUERY;   // the user provided query string
    $scope.query = getDefaultQuery($scope,CONSTANTS); // solr query

    // update search results
    $scope.updateResults = function() {
        // reset
        $scope.error = null;
        $scope.message = null;
        // if the user query is not valid
        if (!isValidQuery($scope.userQuery)) {
          $scope.error = "Invalid search query";
        } 
        // there is no previous query 
        else if (!$scope.previousQuery) {
            $scope.query = getDefaultQuery($scope,CONSTANTS);
            $scope.previousQuery = $scope.query;
        } 
        // the query has changed
        else if ($scope.userQuery != $scope.previousQuery.getUserQuery()) {
            // set current query as previous
            $scope.previousQuery = $scope.query;
            // create a new query
            $scope.query = getDefaultQuery($scope,CONSTANTS);
            $scope.query.setOption("hl.fl",$scope.highlightingParameters);
            $scope.query.setOption("q",$scope.userQuery);
            $scope.query.setOption("rows",$scope.itemsPerPage);
        } else {
            // existing query - update the current page, other variables
            $scope.query.setOption("rows",$scope.itemsPerPage);
            $scope.query.setOption("start",$scope.page);
        }
        // query.setOption("callback","JSON_CALLBACK");
        console.log("GET " + $scope.query.getUrl());
        // fetch the search results
        $http.get($scope.query.getUrl()).success(
            function (data) {
                $scope.queryMaxScore = data.response.maxScore;
                $scope.queryNumFound = data.response.numFound;
                $scope.queryParams = data.responseHeader.params;
                $scope.queryStatus = data.responseHeader.status;
                $scope.queryTime = data.responseHeader.QTime;
                $scope.totalPages = Math.ceil($scope.queryNumFound/$scope.itemsPerPage);
                $scope.totalSets = Math.ceil($scope.totalPages/$scope.pagesPerSet);
                // if there are search results
                if (data.response && data.response.docs && data.response.docs.length > 0) {
                  	// reformat data for presenation, build page navigation index
                  	$scope.results = format(data.response.docs,CONSTANTS.MAX_FIELD_LENGTH);
                    $scope.pages = buildPageIndex($scope);
                } else {
                    $scope.queryMaxScore = 0;
                    $scope.queryNumFound = 0;
                    $scope.queryTime = 0;
                    $scope.totalPages = 0;
                    $scope.totalSets = 0;
                  	$scope.message = "No results found for query '" + $scope.query + "'";
                }
        }).error(
            function(data, status, headers, config) {
                $scope.queryMaxScore = 0;
                $scope.queryNumFound = 0;
                $scope.queryParams = '';
                $scope.queryStatus = status;
                $scope.queryTime = 0;
                $scope.totalPages = 0;
                $scope.totalSets = 0;
                $scope.error = "Could not get search results from server. Server responded with status code " + status + ".";
        });
    };

}
searchCtrl.$inject = ['$scope','$http','CONSTANTS'];
