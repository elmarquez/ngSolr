/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Search facet.
 * @class Search facet
 * @param Field Field name
 * @param Value Field value
 * @see http://wiki.apache.org/solr/SimpleFacetParameters#rangefaceting
 */
function Facet(Field,Value) {
    // basic faceting
    this.field = Field;     // field name
    this.value = Value;     // field value
    this.options = {};      // additional filtering options
    //this.options['f'+this.field+'facet.mincount'] = 1;  // minimum item count required for result listing

    /**
     * Get option value.
     * @param Name Option name
     */
    this.getOption = function(Name) {
        if (this.options[Name]) {
            return this.options[Name];
        }
    };

    /**
     * Get the query Url fragment for this facet.
     */
    this.getUrlFragment = function() {
        // this is used to delimit the start of the facet query in the URL and aid parsing
        var query = '&&'; // delimiter should come from the CONSTANTS field
        query += '&fq=' + this.field + ':' + this.value;
        for (var option in this.options) {
            query = query + "&" + option + "=" + this.options[option];
        }
        return query;
    };

    /**
     * Set option.
     * @param Name
     * @param Value
     */
    this.setOption = function(Name,Value) {
        this.options[Name] = Value;
    };

    /**
     * Set facet properties from Uri parameters.
     * @param Query
     */
    this.setOptionsFromQuery = function(Query) {
        var elements = Query.split('&');
        for (var i=0;i<elements.length;i++) {
            var element = elements[i];
            if (element != null && element != '') {
                var parts = element.split('=');
                var name = parts[0].replace('&','');
                if (name == 'fq') {
                    if (parts.length == 2) {
                        var subparts = parts[1].split(':');
                        this.field = subparts[0];
                        this.value = subparts[1];
                    }
                } else {
                    (parts.length==2) ? this.setOption(name,decodeURI(parts[1])) : this.setOption(name,'');
                }
            }
        }
    };

};

/**
 * A Solr search query.
 * @param Url URL to Solr host
 * @param Core Name of Solr core
 * @see [ref to Solr query page]
 * @todo it should retain its search state, and provide methods for executing the search query
 */
function SearchQuery(Url,Core) {
    // parameters
    this.url = Url + "/" + Core + "/select?";   // URL for the Solr core
    this.facets = [];                             // search facets
    this.options = {};                            // search parameters

    /**
     * Get option value.
     * @param Name Option name
     */
    this.getOption = function(Name) {
        if (this.options[Name]) {
            return this.options[Name];
        }
    };

    /**
     * Get the hash portion of the Solr query URL.
     */
    this.getHash = function() {
        var query = '';
        // append query parameters
        for (var key in this.options) {
            query = query + "&" + key + "=" + this.options[key];
        }
        // append faceting parameters
        for (var i=0;i<this.facets.length;i++) {
            var facet = this.facets[i];
            query = query + facet.getUrlFragment();
        }
        // return results
        return query;
    };

    /**
     * Get the fully specified Solr query URL.
     */
    this.getUrl = function() {
        return this.url + this.getHash();
    };

    /**
     * Get the user query portion of the query.
     */
    this.getUserQuery = function() {
        return this.getOption('q');
    };

    /**
     * Set option.
     * @param Name
     * @param Value
     */
    this.setOption = function(Name,Value) {
        if (Name=="fq") {
            var fq = this.getOption(Name);
            if (fq == undefined || fq == null || fq == "") {
                this.options[Name] = "+" + Value;
            } else {
                this.options[Name] = fq + " +" + Value;
            }
        } else {
            this.options[Name] = Value;
        }
    };

    /**
     * Get a SearchQuery from the hash portion of the current
     * window location.
     * @param Query Query fragment
     */
    this.setOptionsFromQuery = function(Query) {
        var elements = Query.split('&');
        for (var i=0;i<elements.length;i++) {
            var element = elements[i];
            if (element != null && element != '') {
                var parts = element.split('=');
                var name = parts[0].replace('&','');
                (parts.length==2) ? this.setOption(name,decodeURI(parts[1])) : this.setOption(name,'');
            }
        }
    };

};


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
 * @todo need to support multiple queries from different controllers!!! -- named queries!!! the default query is called "default"
 */
angular.module('SearchServices', []).factory('SolrSearchService',
    ['$rootScope', '$http', '$location', 'CONSTANTS', function ($rootScope, $http, $location, CONSTANTS) {

        // parameters
        var svc = {};                       // the service instance

        svc.error = null;                   // error message to user
        svc.highlighting = true;            // result highlighting on/off
        svc.highlightingParameters = "";    // result highlighting parameters
        svc.message = null;                 // info or warning message to user
        svc.page = 0;                       // result page currently being displayed
        svc.previousQuery = '';             // previous query
        svc.queries = {};                   // search queries
        svc.query = null                    // the current query
        svc.queryMaxScore = 1;              // maximum result score
        svc.queryNumFound = 0;              // number of result items found
        svc.queryParams = '';               // query parameters
        svc.queryStatus = '';               // query result status code
        svc.queryTime = 0;                  // query execution time
        svc.results = [];                   // query results
        svc.userQuery = '';                 // the user provided query string

        ///////////////////////////////////////////////////////////////////////////

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
         * Get the query object.
         * @return The query object.
         */
        svc.getQuery = function() {
            return this.query;
        }

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
         * Update the user search query.
         */
        svc.setQuery = function (Query) {
            // create a new search query
            svc.query = svc.getDefaultQuery(CONSTANTS);
            // set the query value
            svc.query.setOption("q",Query);
            // update the results
            svc.update();
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

        ///////////////////////////////////////////////////////////////////////

        // initialize
        svc.init();

        // return the service instance
        return svc;

    }]); // solr search service
