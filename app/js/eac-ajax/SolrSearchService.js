/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Solr search facet.
 * @class Solr search facet
 * @param Field Field name
 * @param Value Field value
 * @see http://wiki.apache.org/solr/SimpleFacetParameters#rangefaceting
 */
function SolrFacet(Field,Value) {

    var self = this;

    // basic faceting
    self.field = Field;     // field name
    self.value = Value;     // field value
    self.options = {};      // additional filtering options
    //this.options['f'+this.field+'facet.mincount'] = 1;  // minimum item count required for result listing

    /**
     * Get option value.
     * @param Name Option name
     */
    self.getOption = function(Name) {
        if (Name == 'q') {

        } else if (self.options[Name]) {
            return self.options[Name];
        }
        return undefined;
    };

    /**
     * Get the query Url fragment for this facet.
     */
    self.getUrlFragment = function() {
        // this is used to delimit the start of the facet query in the URL and aid parsing
        var query = '&&'; // delimiter should come from the CONSTANTS field
        query += '&fq=' + self.field + ':' + self.value;
        for (var option in self.options) {
            if (self.options.hasOwnProperty(option)) {
                query = query + "&" + option + "=" + self.options[option];
            }
        }
        return query;
    };

    /**
     * Set option.
     * @param Name
     * @param Value
     */
    self.setOption = function(Name,Value) {
        self.options[Name] = Value;
    };

    /**
     * Set facet properties from Uri parameters.
     * @param Query
     */
    self.setOptionsFromQuery = function(Query) {
        var elements = Query.split('&');
        for (var i=0;i<elements.length;i++) {
            var element = elements[i];
            if (element != null && element != '') {
                var parts = element.split('=');
                var name = parts[0].replace('&','');
                if (name == 'fq') {
                    if (parts.length == 2) {
                        var subparts = parts[1].split(':');
                        self.field = subparts[0];
                        self.value = subparts[1];
                    }
                } else {
                    (parts.length==2) ? self.setOption(name,decodeURI(parts[1])) : self.setOption(name,'');
                }
            }
        }
    };

} // end SolrFacet

/**
 * A Solr search query.
 * @param Url URL to Solr host
 * @param Core Name of Solr core
 */
function SolrQuery(Url,Core) {

    var self = this;

    // parameters
    self.facets = [];           // query facets
    self.facet_counts = {};     // facet counts
    self.highlighting = {};     // query response highlighting
    self.options = {};          // query options
    self.response = {};         // query response
    self.responseHeader = {};   // response header
    self.url = Url + "/" + Core + "/select?";   // URL for the Solr core
    self.userQuery = "*:*";     // the primary query
    self.userQueryOptions = {}; // query elements

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add facet constraint.
     * @param Facet
     */
    self.addFacet = function(Facet) {
        // if the facet is not already present
        var found = false;
        var count = 0;
        while (!found && count < self.facets.length) {
            var fct = self.facets[count];
            if (fct.field === Facet.field && fct.value === Facet.value) {
                found = true;
            }
            count++;
        }
        if (!found) self.facets.push(Facet);
    };

    /**
     * Get the hash portion of the query URL. We UrlEncode the search terms rather than the entire fragment because
     * it comes out in a much more readable form and still valid.
     */
    self.getHash = function() {
        var query = '';
        // append query elements
        query += "q=" + self.userQuery;
        if (self.userQueryOptions && self.userQueryOptions.length > 0) {
            for (var key in self.userQueryOptions) {
                var val = self.userQueryOptions[key];
                query += "+" + key + ":" + val;
            }
        }
        // append query parameters
        for (var key in self.options) {
            var val = self.options[key];
            query += "&" + key + "=" + val;
        }
        // append faceting parameters
        for (var i=0;i<self.facets.length;i++) {
            var facet = self.facets[i];
            query += facet.getUrlFragment();
        }
        // return results
        return query;
    };

    /**
     * Get option value.
     * @param Name Option name
     * @return undefined value or undefined if not found.
     */
    self.getOption = function(Name) {
        if (self.options[Name]) {
            return self.options[Name];
        }
        return undefined;
    };

    /**
     * Get the fully specified Solr query URL.
     */
    self.getUrl = function() {
        return self.url + self.getHash();
    };

    /**
     * Get the user query portion of the query.
     */
    self.getUserQuery = function() {
        return self.userQuery;
    };

    /**
     * Get the user query options portion of the query.
     */
    self.getUserQueryOptions = function() {
        return self.userQueryOptions;
    };

    /**
     * Remove facet constraint.
     * @param Facet
     */
    self.removeFacet = function(Facet) {
        // if the facet is found
        var found = false;
        var index = 0;
        while (!found && index < self.facets.length) {
            var fct = self.facets[index];
            if (fct.field === Facet.field && fct.value === Facet.value) {
                found = true;
            }
            index++;
        }
        if (found) self.facets.splice(index-1,1);
    };

    /**
     * Set the facet counts field value.
     * @param FacetCounts
     */
    self.setFacetCounts = function(FacetCounts) {
        self.facet_counts = FacetCounts;
    };

    /**
     * Set the highlighting field value.
     * @param Highlighting
     */
    self.setHighlighting = function(Highlighting) {
        self.highlighting = Highlighting;
    };

    /**
     * Set option. User queries should be set using the setUserQuery() and setUserQueryOption() functions.
     * @param Name
     * @param Value
     */
    self.setOption = function(Name,Value) {
        // query option
        if (Name === "fq") {
            var fq = self.getOption(Name);
            if (fq != undefined && fq == "") {
                self.options[Name] = fq + " +" + Value;
            } else {
                self.options[Name] = "+" + Value;
            }
        } else {
            self.options[Name] = Value;
        }
    };

    /**
     * Build a SolrQuery fro the hash portion of the current window location.
     * @param Query Query or hash portion of the window location
     * @todo this function is completely out of date and needs to be fixed
     */
    self.setOptionsFromQuery = function(Query) {
        var elements = Query.split('&');
        for (var i=0;i<elements.length;i++) {
            var element = elements[i];
            if (element != null && element != '') {
                var parts = element.split('=');
                var name = parts[0].replace('&','');
                (parts.length==2) ? self.setOption(name,decodeURI(parts[1])) : self.setOption(name,'');
            }
        }
    };

    /**
     * Set the response field value.
     * @param Response
     */
    self.setResponse = function(Response) {
        self.response = Response;
    };

    /**
     * Set the response field value.
     * @param Header
     */
    self.setResponseHeader = function(Header) {
        self.responseHeader = Header;
    };

    /**
     * Set the primary user query.
     * @param Query User query
     */
    self.setUserQuery = function(Query) {
        self.userQuery = Query;
    };

    /**
     * Set an additional user query element.
     * @param Name
     * @param Value
     */
    self.setUserQueryElement = function(Name,Value) {
        self.userQueryOption[Name] = Value;
    };

} // end SolrQuery


/*---------------------------------------------------------------------------*/
/* Service                                                                   */

/**
 * Executes a document search against an Apache Solr/Lucence search index.
 * Provides shared search configuration for multiple controllers in the form
 * of named queries, and a subscriber service to listen for changes on the
 * named query.
 * @param $rootScope Application root scope
 * @param $http HTTP service
 * @param $location Location service
 * @param CONSTANTS Application constants
 * @todo by wrapping the SolrQuery object, we are recreating a lot of functionality ... and introducing maintenance problems ...
 */
angular.module('SolrSearchService', []).factory('SolrSearchService',
    ['$rootScope', '$http', '$location', 'CONSTANTS', function ($rootScope, $http, $location, CONSTANTS) {

        // parameters
        var defaultQueryName = "defaultQuery";  // the name of the default query
        var svc = {};                           // the service instance
        svc.error = undefined;                  // error message
        svc.message = undefined;                // info or warning message to user
        svc.queries = {};                       // named search queries

        ///////////////////////////////////////////////////////////////////////////

        /**
         * Create a new facet.
         * @param FieldName
         * @param Value
         * @return {Facet}
         */
        svc.createFacet = function(FieldName,Value) {
            return new SolrFacet(FieldName,Value);
        };

        /**
         * Build a default query object.
         */
        svc.createQuery = function () {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setUserQuery(CONSTANTS.DEFAULT_QUERY);
            return query;
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
                    var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
                    query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
                    query.setOption("hl.fl", svc.highlightingParameters);
                    query.setOption("indent", "on");
                    query.setOption("rows", svc.itemsPerPage);
                    query.setOption("start", 0);
                    query.setOption("version", CONSTANTS.SOLR_VERSION);
                    query.setOption("wt", "json");
                    query.setOptionsFromQuery(elements[0]);
                    query.setUserQuery("q", CONSTANTS.DEFAULT_QUERY);
                    // subsequent elements are facets
                    for (var j = 1; j < elements.length; j++) {
                        var q = elements[j];
                        var facet = new SolrFacet();
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
         * Get the query facet counts.
         * @param Name Query name
         */
        svc.getFacetCounts = function (Name) {
            if (Name) {
                return svc.queries[Name].facet_counts;
            } else {
                return svc.queries[defaultQueryName].facet_counts;
            }
        };

        /**
         * Get the query facet list.
         * @param Name Query name
         * @returns Array Facet list for the named query, or for the default query if no name is specified.
         */
        svc.getFacets = function (Name) {
            if (Name) {
                return svc.queries[Name].facets;
            } else {
                return svc.queries[defaultQueryName].facets;
            }
        };

        /**
         * Get the query object. Where a name is not provided, the default query is returned.
         * @param Name Query name
         * @return The query object or undefined if not found.
         */
        svc.getQuery = function(Name) {
            if (Name) {
                return svc.queries[Name];
            } else {
                return svc.queries[defaultQueryName];
            }
        };

        /**
         * Get the query response.
         * @param Name Query name
         */
        svc.getResponse = function (Name) {
            if (Name) {
                return svc.queries[Name].response;
            } else {
                return svc.queries[defaultQueryName].response;
            }
        };

        /**
         * Initialize the controller. If there is a search query specified in the
         * URL when the controller initializes then use that as the initial query,
         * otherwise use the default.
         */
        svc.init = function (CONSTANTS, $http, $rootScope) {
            if (svc.windowLocationHasQuery(window.location.hash, CONSTANTS.QUERY_DELIMITER)) {
                svc.queries[defaultQueryName] = svc.getCurrentQuery($scope, window.location.hash, CONSTANTS);
            } else {
                svc.queries[defaultQueryName] = svc.createQuery(CONSTANTS, $http, $rootScope);
            }
            // update the search results
            if (CONSTANTS.DEFER_FIRST_SEARCH_SERVICE_UPDATE !== true) {
                svc.update();
            }
        };

        /**
         * Determine if the query string is valid.
         * @param Val
         * @todo Develop this further
         */
        svc.isValidQuery = function (Val) {
            for (var i = 0; i < Val.length; i++) {
                if (Val[i] != null && Val[i] != ' ') {
                    return true;
                }
            }
            return false;
        };

        /**
         * Set the starting document in the named query.
         * @param Start The index of the starting document.
         * @param Query Query name
         */
        svc.setPage = function (Start,Query) {
            if (Query) {
                svc.queries[Query].setOption("start",Start);
            } else {
                svc.queries[defaultQueryName].setOption("start",Start);
            }
        };

        /**
         * Set the named query. If a name is not specified, the default query is set.
         * @param Query Query object
         * @param Name Query name
         */
        svc.setQuery = function (Query, Name) {
            if (Name) {
                svc.queries[Name] = Query;
            } else {
                svc.queries[defaultQueryName] = Query;
            }
        };

        /**
         * Set the fragment portion of the window location to reflect the current search query.
         * @param Location
         * @param Scope
         * @param QueryDelimiter
         * @todo this function looks like it been botched somehow in a refactoring
         */
        svc.setWindowLocation = function (Location, Scope, QueryDelimiter) {
            var url = "";
            if (Scope.view) {
                url = Scope.view;
            }
            if (Scope.query) {
                url = url + "/" + QueryDelimiter + Scope.query.getHash();
            }
            // set the hash
            console.log("Setting hash as: " + url);
            window.location.hash = url;
            // var loc = location.hash(url);
        };

        /**
         * Update the search results for all queries.
         */
        svc.update = function () {
            // reset messages
            svc.error = null;
            svc.message = null;
            // update queries
            for (var key in svc.queries) {
                if (svc.queries.hasOwnProperty(key)) {
                    svc.updateQuery(key);
                }
            }
        };

        /**
         * Update the named query.
         * @param Name Query name
         */
        svc.updateQuery = function (Name) {
            // reset messages
            svc.error = null;
            svc.message = null;
            // get the named query
            var query = svc.queries[Name];
            if (query) {
                // fetch the search results
                var url = query.getUrl();
                console.log("GET " + Name + ": " + url);
                $http.get(url).
                    success(function (data) {
                        query.setHighlighting(data.highlighting);
                        if (data.hasOwnProperty('facet_counts')) {
                            query.setFacetCounts(data.facet_counts);
                        }
                        query.setResponse(data.response);
                        query.setResponseHeader(data.responseHeader);
                        $rootScope.$broadcast(Name);
                    }).error(function (data, status, headers, config) {
                        svc.error = "Could not get search results from server. Server responded with status code " + status + ".";
                        var response = {};
                        response['numFound'] = 0;
                        response['start'] = 0;
                        response['docs'] = [];
                        query.setFacetCounts([]);
                        query.setHighlighting({});
                        query.setResponse(response);
                        query.setResponseHeader({});
                        $rootScope.$broadcast(Name);
                    });
            }
        };

        /**
         * Determine if the current location URL has a query.
         * @param Url Fragment portion of url
         * @param Delimiter Query delimiter
         */
        svc.windowLocationHasQuery = function (Url, Delimiter) {
            var i = Url.indexOf(Delimiter);
            return i != -1;
        };

        ///////////////////////////////////////////////////////////////////////

        // initialize
        svc.init(CONSTANTS, $http, $rootScope);

        // return the service instance
        return svc;

    }]).value('version','0.1'); // SolrSearchService
