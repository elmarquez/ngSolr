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

/**
 * Get the current search parameters from the local portion of the location 
 * URL.
 * @todo should be using routes/views to manage this part
 */
function getLocation() {

}

/**
 * Determine if a user query is valid.
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

function truncateDocuments(Documents,Length) {
  if (Documents) {
    for (var i=0;i<Documents.length;i++) {
      truncateField(Documents[i],'text',Length);
    }
  }
  return Documents;
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

/**
 * Update the local portion of the browser URL to reflect the current search
 * parameters.
 */
function updateLocation($scope) {

}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Executes a keyword search against a Solr index.
 */
function searchCtrl($scope, $http, CONSTANTS) {
    // public
    $scope.facets = [];
    $scope.highlighting = true;
    $scope.highlightingParameters = "";
    $scope.itemsPerPage = 10;
    $scope.page = 0;
    $scope.pages = [];
    $scope.pagesPerSet = 10;
    $scope.previousQuery = '';
    $scope.queryMaxScore = 1;
    $scope.queryNumFound = 1;
    $scope.userQuery = CONSTANTS.DEFAULT_QUERY;

    // query
    var query = new SearchQuery(CONSTANTS.SOLR_BASE);
    query.setOption("start",$scope.page);
    query.setOption("rows",$scope.itemsPerPage);
    query.setOption("fl","uri,title,text");
    query.setOption("wt","json");
    query.setOption("explainOther","");
    query.setOption("hl.fl",$scope.highlightingParameters);
    query.setOption("indent","on");
    query.setOption("version",CONSTANTS.SOLR_VERSION);
    
    // update search results
    $scope.updateResults = function() {
      	// reset result state
      	$scope.error = null;
      	$scope.message = null;
      	$scope.pages = [];
      	$scope.results = [];
        // if the user query is valid
        if (isValidQuery($scope.userQuery)) {
            // if the query has changed, update query parameters
            if ($scope.userQuery != $scope.previousQuery) {
              query.setOption("q",$scope.userQuery);
              $scope.previousQuery = $scope.userQuery;
              $scope.page = 0;
              query.setOption("start",$scope.page);
            } else {
              // update the current page
              query.setOption("start",$scope.page);
              query.setOption("rows",$scope.itemsPerPage);
            }
        } else {
            // use the default search 
            query.setOption("q",CONSTANTS.DEFAULT_QUERY);
        }
        // query.setOption("callback","JSON_CALLBACK");
        console.log("GET " + query.getQuery());
        // fetch the search results
        $http.get(query.getQuery()).success(
            function (data) {
                $scope.queryTime = data.responseHeader.QTime;
                $scope.queryStatus = data.responseHeader.status;
                $scope.queryParams = data.responseHeader.params;
                $scope.queryNumFound = data.response.numFound;
                $scope.queryMaxScore = data.response.maxScore;
                $scope.totalPages = Math.ceil($scope.queryNumFound/$scope.itemsPerPage);
                $scope.totalSets = Math.ceil($scope.totalPages/$scope.pagesPerSet);
                $scope.queryURL = query.getQuery();
                // if there are search results
                if (data.response && data.response.docs && data.response.docs.length > 0) {
                  	// reformat data for presenation
                  	$scope.results = truncateDocuments(data.response.docs,CONSTANTS.MAX_FIELD_LENGTH);
                		// update the pagination index
                    $scope.pages = buildPageIndex($scope);
                } else {
                  	$scope.message = "No results found for query '" + $scope.query + "'";
                }
        }).error(
            function(data, status, headers, config) {
                $scope.error = "Could not get search results from server. Server responded with status code " + status + ".";
        });
    };

}

searchCtrl.$inject = ['$scope','$http','CONSTANTS'];
