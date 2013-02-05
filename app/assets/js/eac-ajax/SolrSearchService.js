/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Service                                                                   */

var services = angular.module('Services', []);

/**
 * Executes a document search against a Solr index.
 * @param $rootScope Application root scope
 * @param $http HTTP service
 * @param $location Location service
 * @param CONSTANTS Application constants
 */
services.factory('SolrSearchService',
    ['$rootScope', '$http', '$location', 'CONSTANTS', function ($rootScope, $http, $location, CONSTANTS) {

        // parameters
        var error = null;                // error message to user
        var highlighting = true;         // result highlighing on/off
        var highlightingParameters = ""; // result highlighting parameters
        var itemsPerPage = 10;           // number of search results per page
        var message = null;              // info or warning message to user
        var page = 0;                    // result page currently being displayed
        var pages = [];                  // list of pages in the current navigation set
        var pagesPerSet = 10;            // number of pages in a navigation set
        var previousQuery = '';          // previous query
        var query = null                 // the current query
        var queryMaxScore = 1;           // maximum result score
        var queryNumFound = 0;           // number of result items found
        var queryParams = '';            // query parameters
        var queryStatus = '';            // query result status code
        var queryTime = 0;               // query execution time
        var results = [];                // query results
        var sidebar = true;              // show the sidebar panel
        var totalPages = 1;              // total number of result pages
        var totalSets = 1;               // total number of page sets
        var userQuery = '';              // the user provided query string

        ///////////////////////////////////////////////////////////////////////////

        /**
         * Build a page index for navigation of search results.
         */
        var buildPageIndex = function () {
            // init
            pages = [];
            // determine the current page, current page set
            var currentPage = Math.floor(page / itemsPerPage);
            var currentSet = Math.floor(currentPage / pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * pagesPerSet;
            var lastPageInSet = firstPageInSet + pagesPerSet - 1;
            if (lastPageInSet >= totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - totalPages) - 1;
            }
            // link to previous set
            if (totalSets > 1 && currentSet != 0) {
                var previousSet = (currentSet - 1) * itemsPerPage;
                var prevPage = new Page("«", previousSet);
                pages.push(prevPage);
            }
            // page links
            for (var i = firstPageInSet; i <= lastPageInSet; i++) {
                var page = new Page(i + 1, i * itemsPerPage);
                if (page.number == page) {
                    page.isActive = true;
                }
                pages.push(page);
            }
            // link to next set
            if (totalSets > 1 && currentSet < totalSets - 1) {
                var nextSet = (lastPageInSet * itemsPerPage) + itemsPerPage;
                var nextPage = new Page("»", nextSet);
                pages.push(nextPage);
            }
        };

        /**
         * Reformat a collection of document records for presentation. Truncate each
         * field to the maximum length specified.
         * @param Items
         * @param FieldName
         * @param Length
         * @todo consider merging this into a single function that can handle one or more objects.
         */
        var format = function (Items, FieldName, Length) {
            // if the item is an array
            if (Items) {
                for (var i = 0; i < Items.length; i++) {
                    truncateField(Items[i], FieldName, Length);
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
         * http://dev02.internal:8080/eac-search/#/view/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json&&fq=identity_entityType:corporateBody&abc=xyz&zyx=abc&&fq=something:value&abc=xyz=xyz=abc
         * http://dev02.internal:8080/eac-search/#/view/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json&&fq=identity_entityType:corporateBody
         * http://example.com/#/[view]/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json
         */
        var getCurrentQuery = function () {
            // get the query portion of the path
            var i = Url.indexOf(CONSTANTS.QUERY_DELIMITER);
            if (i != -1) {
                // get the view component of the URL fragment
                var view = Url.substring(1, i);
                view = view.replace(new RegExp('/', 'g'), '');
                // get the query component of the URL fragment
                var frag = Url.substring(i + 1);
                var elements = frag.split(CONSTANTS.FACET_DELIMITER);
                if (elements.length > 0) {
                    // the first element is the query
                    var query = new SearchQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
                    query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
                    query.setOption("hl.fl", highlightingParameters);
                    query.setOption("indent", "on");
                    query.setOption("rows", itemsPerPage);
                    query.setOption("start", 0);
                    query.setOption("version", CONSTANTS.SOLR_VERSION);
                    query.setOption("wt", "json");
                    query.setOption("q", CONSTANTS.DEFAULT_QUERY);
                    query.setOptionsFromQuery(elements[0]);
                    // subsequent elements are facets
                    for (var j = 1; j < elements.length; j++) {
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
         * @param CONSTANTS Application constants
         */
        var getDefaultQuery = function (CONSTANTS) {
            var query = new SearchQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setOption("q", CONSTANTS.DEFAULT_QUERY);
            return query;
        };

        /**
         * Determine if the current location URL has a query.
         * @param Url Fragment portion of url
         * @param Delimiter Query delimiter
         */
        var hasQuery = function (Url, Delimiter) {
            var i = Url.indexOf(Delimiter);
            if (i == -1) {
                return false;
            }
            return true;
        };

        /**
         * Initialize the controller. If there is a search query specified in the
         * URL when the controller initializes then use that as the initial query,
         * otherwise use the default.
         */
        var init = function () {
            // if there is a query encoded in the starting url
            if (hasQuery(window.location.hash, CONSTANTS.QUERY_DELIMITER)) {
                // use that to start the search
                query = getCurrentQuery($scope, window.location.hash, CONSTANTS);
                userQuery = query.getUserQuery();
            } else {
                // use a default
                userQuery = CONSTANTS.DEFAULT_QUERY;
                query = getDefaultQuery(CONSTANTS);
            }
            // update the search results
            update();
        };

        /**
         * Determine if the query string is valid.
         * @todo Develop this further
         */
        var isValidQuery = function (Val) {
            // if there is some content to the string
            for (var i = 0; i < Val.length; i++) {
                if (Val[i] != null && Val[i] != ' ') {
                    return true;
                }
            }
            return false;
        };

        /**
         * Set the fragment portion of the window location to reflect the current
         * search query.
         * @param View View
         * @param Query Search query
         */
        var setLocation = function (location, scope, QueryDelimiter) {
            var url = "";
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
        var trim = function (Val) {
            if (Val) {
                // remove preceding white space
                while (Val.length >= 1 && Val[0] == ' ') {
                    Val = Val.substring(1, Val.length - 1);
                }
                // remove trailing white space
                while (Val.length >= 1 && Val[Val.length - 1] == ' ') {
                    Val = Val.substring(0, Val.length - 2);
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
        var truncateField = function (Document, FieldName, Length) {
            if (Document && Document[FieldName]) {
                if (Document[FieldName] instanceof Array) {
                    Document[FieldName] = Document[FieldName][0];
                }
                if (Document[FieldName].length > Length) {
                    // truncate the document to the specified length
                    Document[FieldName] = Document[FieldName].substring(0, Math.min(Length, Document[FieldName].length));
                    // find the last word and truncate after that
                    var i = Document[FieldName].lastIndexOf(" ");
                    if (i != -1) {
                        Document[FieldName] = Document[FieldName].substring(0, i) + " ...";
                    }
                }
            }
        };

        /**
         * Update the search results.
         */
        var update = function () {
            // reset messages
            error = null;
            message = null;
            /*
             // if the query is invalid query return a default
             if (!isValidQuery(userQuery)) {
             // message = "Invalid query '" + userQuery + "'. Using default '" + CONSTANTS.DEFAULT_QUERY + "'";
             query = getDefaultQuery(CONSTANTS);
             previousQuery = query;
             }
             // there is a previous query and the query has changed
             else if (previousQuery && userQuery != previousQuery.getUserQuery()) {
             previousQuery = query;
             query = getDefaultQuery(CONSTANTS);
             query.setOption("hl.fl",highlightingParameters);
             query.setOption("q",userQuery);
             query.setOption("rows",itemsPerPage);
             }
             // there is a previous query and the query has not changed
             else if (previousQuery && userQuery == previousQuery.getUserQuery()) {
             query.setOption("rows",itemsPerPage);
             query.setOption("start",page);
             }
             // else use the current query
             else {
             previousQuery = query;
             }
             */
            // update the browser location to reflect the query
            // setLocation($location,$scope,CONSTANTS.QUERY_DELIMITER);
            // query.setOption("callback","JSON_CALLBACK");
            // log the current query
            console.log("GET " + query.getUrl());
            // fetch the search results
            $http.get(query.getUrl()).success(
                function (data) {
                    queryMaxScore = data.response.maxScore;
                    queryNumFound = data.response.numFound;
                    queryParams = data.responseHeader.params;
                    queryStatus = data.responseHeader.status;
                    queryTime = data.responseHeader.QTime;
                    totalPages = Math.ceil(queryNumFound / itemsPerPage);
                    totalSets = Math.ceil(totalPages / pagesPerSet);
                    // if there are search results
                    if (data.response && data.response.docs) {
                        // reformat data for presenation, build page navigation index
                        // var formatted = format(data.response.docs,CONSTANTS.MAX_FIELD_LENGTH);
                        results = data.response.docs;
                    } else {
                        pages = [];
                        queryMaxScore = 0;
                        queryNumFound = 0;
                        queryTime = 0;
                        results = [];
                        totalPages = 0;
                        totalSets = 0;
                        message = "No results found for query '" + query.getUserQuery() + "'.";
                    }
                    console.log("There are " + results.length + " results");
                    // notify listeners
                    $rootScope.$broadcast('update');
                }).error(
                function (data, status, headers, config) {
                    queryMaxScore = 0;
                    queryNumFound = 0;
                    queryParams = '';
                    queryStatus = status;
                    queryTime = 0;
                    results = [];
                    totalPages = 0;
                    totalSets = 0;
                    error = "Could not get search results from server. Server responded with status code " + status + ".";
                    // notify listeners
                    $rootScope.$broadcast('update');
                });
        };

        ///////////////////////////////////////////////////////////////////////////
        // Public Interface to the Service

        /**
         * Get the query facet list.
         */
        this.getFacets = function () {
            return this.query.facets;
        };

        /**
         * Update the result set to get the items from the specified page number.
         */
        this.getPage = function (PageNumber) {

        };

        /**
         * Get query response parameters, search result metadata.
         */
        this.getQueryResponse = function () {
            // @TODO create a dictionary with search result properties???? or getters for various properties?
            return {};
        };

        /**
         * Get the current list of search results.
         */
        this.getQueryResults = function () {
            return results;
        };

        /**
         * Update the user search query.
         */
        this.setQuery = function (Query) {
            // create a new search query
            this.query = this.getDefaultQuery(CONSTANTS);
            // update the results
            this.update();
        };

        // initialize
        init();

        // return the service instance
        return this;

    }]); // solr search service
