/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * A page in a pagination list
 * @param Name
 * @param Num
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
};

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/**
 * Build a page index for navigation of search results.
 * @param $scope Controller scope
 */
function buildPageIndex($scope) {
  // define the page navigation set
  var index = [];
  var firstPageInSet = 0;
  var lastPageInSet = $scope.pagesPerSet;
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
  makePageLinks(index,firstPageInSet,lastPageInSet,$scope.page);
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
};

/**
 * Reformat a collection of document records for presentation. Truncate each 
 * field to the maximum length specified.
 * @param Items
 * @param Length
 * @todo consider merging this into a single function that can handle one or more objects. 
 */
function format(Items,Length) {
  // if the item is an array
  if (Items) {
    for (var i=0;i<Items.length;i++) {
      truncateField(Items[i],'text',Length);
    }
  }
  // if an item is an object
  return Items;
};

/**
 * Parse the current query URL to determine the initial view, search query and
 * facet parameters. Valid view values are list, map, graph.
 * @param $scope Controller scope
 * @param Url Current window location
 * @param CONSTANTS Application constants
 */
// http://dev02.internal:8080/eac-search/#/view/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json&&fq=identity_entityType:corporateBody&abc=xyz&zyx=abc&&fq=something:value&abc=xyz=xyz=abc
// http://dev02.internal:8080/eac-search/#/view/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json&&fq=identity_entityType:corporateBody
// http://example.com/#/[view]/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json
function getCurrentQuery($scope,Url,CONSTANTS) {
  // get the query portion of the path
  var i = Url.indexOf(CONSTANTS.QUERY_DELIMITER);
  if (i != -1) {
    // get the view component of the URL fragment
    var view = Url.substring(1,i);
    view = view.replace(new RegExp('/','g'),'');
    // get the query component of the URL fragment
    var frag = Url.substring(i+1);
    var elements = frag.split(CONSTANTS.FACET_DELIMITER);
    if (elements.length > 0) {
      // the first element is the query
      var query = new SearchQuery(CONSTANTS.SOLR_BASE,CONSTANTS.SOLR_CORE);
      query.setOption("explainOther","");
      query.setOption("fl","uri,title,text");
      query.setOption("hl.fl",$scope.highlightingParameters);
      query.setOption("indent","on");
      query.setOption("rows",$scope.itemsPerPage);
      query.setOption("start",0);
      query.setOption("version",CONSTANTS.SOLR_VERSION);
      query.setOption("wt","json");
      query.setOption("q",CONSTANTS.DEFAULT_QUERY);  
      query.setOptionsFromQuery(elements[0]);
      // subsequent elements are facets
      for (var j=1;j<elements.length;j++) {
        var q = elements[j];
        var facet = new Facet();
        facet.setOptionsFromQuery(q);
        // add facet
        query.facets.push(facet);
      }
    }
    // return query
    return query;
  }
};

/**
 * Build a default query object.
 * @param $scope Controller scope
 * @param CONSTANTS Application constants
 */
function getDefaultQuery($scope,CONSTANTS) {
  var query = new SearchQuery(CONSTANTS.SOLR_BASE,CONSTANTS.SOLR_CORE);
  query.setOption("explainOther","");
  query.setOption("fl","uri,title,text");
  query.setOption("hl.fl",$scope.highlightingParameters);
  query.setOption("indent","on");
  query.setOption("rows",$scope.itemsPerPage);
  query.setOption("start",0);
  query.setOption("version",CONSTANTS.SOLR_VERSION);
  query.setOption("wt","json");
  query.setOption("q",CONSTANTS.DEFAULT_QUERY);  
  return query;
};

/**
 * Determine if the current location URL has a query.
 * @param Url Fragment portion of url
 * @param Delimiter Query delimiter
 */
function hasQuery(Url,Delimiter) {
  var i = Url.indexOf(Delimiter);
  if (i == -1) {
    return false;
  }
  return true;
};

/**
 * Determine if the query string is valid.
 * @todo Develop this further
 */
function isValidQuery(Val) {
   // if there is some content to the string
   for (var i=0;i<Val.length;i++) {
     if (Val[i] != null && Val[i]!= ' ') {
      return true;
     }
   }
   return false;
};

/**
 * Make result set page links in a pagination list. Highlight the current page.
 * @param Pages The list of pages in the pagination set.
 * @param Start The first page number.
 * @param Finish The last page number.
 * @param Current The current page number.
 */
function makePageLinks(Pages,Start,Finish,Current) {
  for (var i=Start;i<Finish;i++) {
    var page = new Page(i+1,i);
    if (i==Current) {
      page.isActive = true;
    }
    Pages.push(page);
  }
};

/**
 * Set the fragment portion of the window location to reflect the current 
 * search query.
 * @param View View
 * @param Query Search query
 */
function setLocation(location,scope,QueryDelimiter) {
  var url = "/";
  if (scope.view) {
    url = scope.view;
  }
  if (scope.query) {
    url = url + "/" + QueryDelimiter + scope.query.getHash();
  }
  // set the hash
  console.log("Setting hash as: " + url);
  window.location.hash = url;
  // var loc = location.hash(url);
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
 * Truncate the field to the specified length. If the field does not exist, 
 * add it and assign an empty value to ensure other operations do not fail.
 * @param Document Document
 * @param FieldName Field name to truncate
 * @param Length Maximum field length
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
};

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Executes a search against a Solr index.
 * @param $http HTTP service
 * @param $scope Controller scope
 * @param CONSTANTS Application constants
 * @todo invoke an update when a change occurs to any of the key parameters or query facet list
 */
function SearchController($http,$location,$scope,CONSTANTS) {
    // parameters
    $scope.error = null;                // error message to user
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
    $scope.sidebar = true;              // show the sidebar panel
    $scope.totalPages = 1;              // total number of result pages
    $scope.totalSets = 1;               // total number of page sets
    $scope.view = 'list';               // view type

    /**
     * Initialize the controller. If there is a search query specified in the 
     * URL when the controller initializes then use that as the initial query, 
     * otherwise use the default.
     */
    $scope.init = function() {
      // if there is a query encoded in the starting url
      if (hasQuery(window.location.hash,CONSTANTS.QUERY_DELIMITER)) {
        // use that to start the search
        $scope.query = getCurrentQuery($scope,window.location.hash,CONSTANTS);
        $scope.userQuery = $scope.query.getUserQuery();
      } else {
        // use a default
        $scope.userQuery = CONSTANTS.DEFAULT_QUERY;
        $scope.query = getDefaultQuery($scope,CONSTANTS);
      }
      // update the search results
      this.updateResults();
    };

    /**
     * Update the search results.
     */
    $scope.updateResults = function() {
        // reset messages
        $scope.error = null;
        $scope.message = null;
        // if the query is invalid query return a default
        if (!isValidQuery($scope.userQuery)) {
          // $scope.message = "Invalid query '" + $scope.userQuery + "'. Using default '" + CONSTANTS.DEFAULT_QUERY + "'";
          $scope.query = getDefaultQuery($scope,CONSTANTS);
          $scope.previousQuery = $scope.query;
        } 
        // there is a previous query and the query has changed
        else if ($scope.previousQuery && $scope.userQuery != $scope.previousQuery.getUserQuery()) {
          $scope.previousQuery = $scope.query;
          $scope.query = getDefaultQuery($scope,CONSTANTS);
          $scope.query.setOption("hl.fl",$scope.highlightingParameters);
          $scope.query.setOption("q",$scope.userQuery);
          $scope.query.setOption("rows",$scope.itemsPerPage);
        } 
        // there is a previous query and the query has not changed
        else if ($scope.previousQuery && $scope.userQuery == $scope.previousQuery.getUserQuery()) {
          $scope.query.setOption("rows",$scope.itemsPerPage);
          $scope.query.setOption("start",$scope.page);
        } 
        // else use the current query
        else {
          $scope.previousQuery = $scope.query;
        }
        // update the browser location to reflect the query
        setLocation($location,$scope,CONSTANTS.QUERY_DELIMITER);
        // query.setOption("callback","JSON_CALLBACK");
        // log the current query
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
              $scope.pages = [];
              $scope.queryMaxScore = 0;
              $scope.queryNumFound = 0;
              $scope.queryTime = 0;
              $scope.results = [];
              $scope.totalPages = 0;
              $scope.totalSets = 0;
            	$scope.message = "No results found for query '" + $scope.query.getUserQuery() + "'.";
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

// inject controller dependencies
SearchController.$inject = ['$http','$location','$scope','CONSTANTS'];
