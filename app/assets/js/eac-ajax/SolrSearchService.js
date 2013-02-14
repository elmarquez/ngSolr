/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Service                                                                   */

/**
 * Executes a document search against a Solr index. Provides shared search
 * configuration for multiple controllers. Where a controller wants to
 * execute a one off search query, use getDefaultQuery() to get a query
 * object, configure it as desired and then pass it back to
 * getQueryOneTime(Query).
 * @param $rootScope Application root scope
 * @param $http HTTP service
 * @param $location Location service
 * @param CONSTANTS Application constants
 * @todo need to support multiple queries from different controllers!!!
 */
angular.module('SearchServices', []).factory('SolrSearchService',
    ['$rootScope', '$http', '$location', 'CONSTANTS', function ($rootScope, $http, $location, CONSTANTS) {

        // parameters
        var svc = {};                       // the service instance

        svc.error = null;                   // error message to user
        svc.highlighting = true;            // result highlighing on/off
        svc.highlightingParameters = "";    // result highlighting parameters
        svc.itemsPerPage = 10;              // number of search results per page
        svc.message = null;                 // info or warning message to user
        svc.page = 0;                       // result page currently being displayed
        svc.pages = [];                     // list of pages in the current navigation set @todo consider moving elsewhere
        svc.pagesPerSet = 10;               // number of pages in a navigation set
        svc.previousQuery = '';             // previous query
        svc.query = null                    // the current query
        svc.queryMaxScore = 1;              // maximum result score
        svc.queryNumFound = 0;              // number of result items found
        svc.queryParams = '';               // query parameters
        svc.queryStatus = '';               // query result status code
        svc.queryTime = 0;                  // query execution time
        svc.results = [];                   // query results
        svc.totalPages = 1;                 // total number of result pages
        svc.totalSets = 1;                  // total number of page sets
        svc.userQuery = '';                 // the user provided query string

        ///////////////////////////////////////////////////////////////////////////

        /**
         * Build a page index for navigation of search results.
         * @return Page index
         */
        svc.buildPageIndex = function () {
            // init
            svc.pages = [];
            // determine the current page, current page set
            var currentPage = Math.floor(svc.page / svc.itemsPerPage);
            var currentSet = Math.floor(currentPage / svc.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * svc.pagesPerSet;
            var lastPageInSet = firstPageInSet + svc.pagesPerSet - 1;
            if (lastPageInSet >= svc.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - svc.totalPages) - 1;
            }
            // link to previous set
            if (svc.totalSets > 1 && currentSet != 0) {
                var previousSet = (currentSet - 1) * svc.itemsPerPage;
                var prevPage = new Page("«", previousSet);
                svc.pages.push(prevPage);
            }
            // page links
            for (var i = firstPageInSet; i <= lastPageInSet; i++) {
                var page = new Page(i + 1, i * svc.itemsPerPage);
                if (page.number == page) {
                    page.isActive = true;
                }
                svc.pages.push(page);
            }
            // link to next set
            if (svc.totalSets > 1 && currentSet < svc.totalSets - 1) {
                var nextSet = (lastPageInSet * svc.itemsPerPage) + svc.itemsPerPage;
                var nextPage = new Page("»", nextSet);
                svc.pages.push(nextPage);
            }
            // return page index
            return svc.pages;
        };

        /**
         * Reformat a collection of document records for presentation. Truncate each
         * field to the maximum length specified.
         * @param Items
         * @param FieldName
         * @param Length
         * @todo consider merging this into a single function that can handle one or more objects.
         */
        svc.format = function (Items, FieldName, Length) {
            // if the item is an array
            if (Items) {
                for (var i = 0; i < Items.length; i++) {
                    svc.truncateField(Items[i], FieldName, Length);
                }
            }
            // if an item is an object
            return Items;
        };

        /**
         * Parse the current query URL to determine the initial view, search query and
         * facet parameters. Valid view values are list, map, graph.
         * @param Url Current window location
         * http://dev02.internal:8080/eac-search/#/view/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json&&fq=identity_entityType:corporateBody&abc=xyz&zyx=abc&&fq=something:value&abc=xyz=xyz=abc
         * http://dev02.internal:8080/eac-search/#/view/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json&&fq=identity_entityType:corporateBody
         * http://example.com/#/[view]/?&explainOther=&fl=uri%2Ctitle%2Ctext&hl.fl=&indent=on&q=*%3A*&rows=10&start=0&version=2.2&wt=json
         */
        svc.getCurrentQuery = function (Url) {
            // get the query portion of the path
            var i = Url.indexOf(CONSTANTS.QUERY_DELIMITER); // @todo not sure if this is correct anymore
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
                    query.setOption("hl.fl", svc.highlightingParameters);
                    query.setOption("indent", "on");
                    query.setOption("rows", svc.itemsPerPage);
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
         */
        svc.getDefaultQuery = function () {
            var query = new SearchQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("q", CONSTANTS.DEFAULT_QUERY);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            return query;
        };

        /**
         * Get the query facet list.
         */
        svc.getFacets = function () {
            return svc.query.facets;
        };

        /**
         * Update the result set to get the items from the specified page number.
         */
        svc.getPage = function (PageNumber) {

        };

        /**
         * Get query response parameters, search result metadata.
         */
        svc.getQueryResponse = function () {
            // @TODO create a dictionary with search result properties???? or getters for various properties?
            return {};
        };

        /**
         * Get the current list of search results.
         */
        svc.getQueryResults = function () {
            return this.results;
        };

        /**
         * Determine if the current location URL has a query.
         * @param Url Fragment portion of url
         * @param Delimiter Query delimiter
         */
        svc.hasQuery = function (Url, Delimiter) {
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
        svc.init = function () {
            // if there is a query encoded in the starting url
            if (svc.hasQuery(window.location.hash, CONSTANTS.QUERY_DELIMITER)) {
                // use that to start the search
                svc.query = svc.getCurrentQuery($scope, window.location.hash, CONSTANTS);
                svc.userQuery = svc.query.getUserQuery();
            } else {
                // use a default
                svc.userQuery = CONSTANTS.DEFAULT_QUERY;
                svc.query = svc.getDefaultQuery(CONSTANTS);
            }
            // update the search results
            svc.update();
        };

        /**
         * Determine if the query string is valid.
         * @todo Develop this further
         */
        svc.isValidQuery = function (Val) {
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
        svc.setLocation = function (location, scope, QueryDelimiter) {
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
        svc.trim = function (Val) {
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
        svc.truncateField = function (Document, FieldName, Length) {
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
        svc.update = function () {
            // reset messages
            svc.error = null;
            svc.message = null;
            // update the browser location to reflect the query
            // setLocation($location,$scope,CONSTANTS.QUERY_DELIMITER);
            // log the current query
            console.log("GET " + svc.query.getUrl());
            // fetch the search results
            $http.get(svc.query.getUrl()).success(
                function (data) {
                    svc.queryMaxScore = data.response.maxScore;
                    svc.queryNumFound = data.response.numFound;
                    svc.queryParams = data.responseHeader.params;
                    svc.queryStatus = data.responseHeader.status;
                    svc.queryTime = data.responseHeader.QTime;
                    svc.totalPages = Math.ceil(svc.queryNumFound / svc.itemsPerPage);
                    svc.totalSets = Math.ceil(svc.totalPages / svc.pagesPerSet);
                    // if there are search results
                    if (data.response && data.response.docs) {
                        // reformat data for presenation, build page navigation index
                        // var formatted = format(data.response.docs,CONSTANTS.MAX_FIELD_LENGTH);
                        svc.results = data.response.docs;
                    } else {
                        svc.pages = [];
                        svc.queryMaxScore = 0;
                        svc.queryNumFound = 0;
                        svc.queryTime = 0;
                        svc.results = [];
                        svc.totalPages = 0;
                        svc.totalSets = 0;
                        svc.message = "Found 0 results for query '" + query.getUserQuery() + "'.";
                    }
                    // notify listeners
                    $rootScope.$broadcast('update');
                }).error(
                function (data, status, headers, config) {
                    svc.queryMaxScore = 0;
                    svc.queryNumFound = 0;
                    svc.queryParams = '';
                    svc.queryStatus = status;
                    svc.queryTime = 0;
                    svc.results = [];
                    svc.totalPages = 0;
                    svc.totalSets = 0;
                    svc.error = "Could not get search results from server. Server responded with status code " + status + ".";
                    // notify listeners
                    $rootScope.$broadcast('update');
                });
        };

        /**
         * Update the user search query.
         */
        svc.setQuery = function (Query) {
            // create a new search query
            svc.query = svc.getDefaultQuery(CONSTANTS);
            // update the results
            svc.update();
        };

        // initialize
        svc.init();

        // return the service instance
        return svc;

    }]); // solr search service
