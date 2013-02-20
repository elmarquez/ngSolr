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
        return undefined;
    };

    /**
     * Get the query Url fragment for this facet.
     */
    this.getUrlFragment = function() {
        // this is used to delimit the start of the facet query in the URL and aid parsing
        var query = '&&'; // delimiter should come from the CONSTANTS field
        query += '&fq=' + this.field + ':' + this.value;
        for (var option in this.options) {
            if (this.options.hasOwnProperty(option)) {
                query = query + "&" + option + "=" + this.options[option];
            }
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

} // end SolrFacet

/**
 * A Solr search query.
 * @param Url URL to Solr host
 * @param Core Name of Solr core
 * @param $http HTTP service
 * @param $rootScope Root scope
 */
function SolrQuery(Url,Core,$http,$rootScope) {
    var self = this;

    // parameters
    self.error = undefined;     // error message
    self.facets = [];           // query facets
    self.facet_counts = {};     // facet counts
    self.highlighting = {};     // query response highlighting
    self.message = undefined;   // information message
    self.options = {};          // query options
    self.response = {};         // query response
    self.responseHeader = {};   // response header
    self.url = Url + "/" + Core + "/select?";   // URL for the Solr core

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
     * Get the hash portion of the query URL.
     */
    self.getHash = function() {
        var query = '';
        // append query parameters
        for (var key in self.options) {
            if (self.options.hasOwnProperty(key)) query = query + "&" + key + "=" + self.options[key];
        }
        // append faceting parameters
        for (var i=0;i<self.facets.length;i++) {
            var facet = self.facets[i];
            query = query + facet.getUrlFragment();
        }
        // return results
        return query;
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
        return self.getOption('q');
    };

    /**
     * Set option.
     * @param Name
     * @param Value
     */
    self.setOption = function(Name,Value) {
        if (Name=="fq") {
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
     * Get a SearchQuery from the hash portion of the current
     * window location.
     * @param Query Query fragment
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
     * Update the search results.
     */
    self.update = function() {
        // reset
        self.error = undefined;
        self.message = undefined;
        // log the current query
        var query = self.getUrl();
        console.log("GET " + query);
        // fetch the search results
        $http.get(query).
            success(function (data) {
                self.highlighting = data.highlighting;
                if (data.hasOwnProperty('facet_counts')) {
                    self.facet_counts = data.facet_counts;
                }
                self.response = data.response;
                self.responseHeader = data.responseHeader;
                $rootScope.$broadcast('update');
            }).error(function (data, status, headers, config) {
                self.error = "Could not get search results from server. Server responded with status code " + status + ".";
                self.response['numFound'] = 0;
                self.response['start'] = 0;
                self.response['docs'] = [];
                $rootScope.$broadcast('update');
            });
    };

} // end SolrQuery


/*---------------------------------------------------------------------------*/
/* Service                                                                   */

/**
 * Executes a document search against an Apache Solr/Lucence search index.
 * Provides shared search configuration for multiple controllers in the form
 * of named queries.
 * @param $rootScope Application root scope
 * @param $http HTTP service
 * @param $location Location service
 * @param CONSTANTS Application constants
 */
angular.module('SearchServices', []).factory('SolrSearchService',
    ['$rootScope', '$http', '$location', 'CONSTANTS', function ($rootScope, $http, $location, CONSTANTS) {

        // parameters
        var svc = {};                       // the service instance
        svc.error = undefined;              // error message
        svc.message = undefined;            // info or warning message to user
        svc.queries = {};                   // named search queries

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
                    var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
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
         * Build a default query object.
         * @param CONSTANTS Application constants
         * @param $http HTTP service
         * #param $rootScope Root scope
         */
        svc.getDefaultQuery = function () {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE, $http, $rootScope);
            query.setOption("q", CONSTANTS.DEFAULT_QUERY);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            return query;
        };

        /**
         * Get the query facet counts.
         * @param Name Query name
         */
        svc.getFacetCounts = function (Name) {
            if (Name) {
                return svc.queries[Name].facet_counts;
            } else {
                return svc.queries['default'].facet_counts;
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
                return svc.queries['default'].facets;
            }
        };

        /**
         * Set the starting Update the result set for the named query to get the items from the specified page number.
         * @param ItemNumber The index of the starting document.
         * @param Name Query name
         */
        svc.getPage = function (ItemNumber,Name) {
            if (Name) {
                svc.queries[Name].setOption("start",ItemNumber);
            } else {
                svc.queries['default'].setOption("start",ItemNumber);
            }
            svc.update();
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
                return svc.queries['default'];
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
                return svc.queries['default'].response;
            }
        };

        /**
         * Determine if the current location URL has a query.
         * @param Url Fragment portion of url
         * @param Delimiter Query delimiter
         */
        svc.hasQuery = function (Url, Delimiter) {
            var i = Url.indexOf(Delimiter);
            return i != -1;
        };

        /**
         * Initialize the controller. If there is a search query specified in the
         * URL when the controller initializes then use that as the initial query,
         * otherwise use the default.
         */
        svc.init = function (CONSTANTS, $http, $rootScope) {
            if (svc.hasQuery(window.location.hash, CONSTANTS.QUERY_DELIMITER)) {
                svc.queries['default'] = svc.getCurrentQuery($scope, window.location.hash, CONSTANTS);
            } else {
                svc.queries['default'] = svc.getDefaultQuery(CONSTANTS, $http, $rootScope);
            }
            svc.update();
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
         * Set the fragment portion of the window location to reflect the current search query.
         * @param Location
         * @param Scope
         * @param QueryDelimiter
         * @todo this function looks like it been botched somehow in a refactoring
         */
        svc.setLocation = function (Location, Scope, QueryDelimiter) {
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
         * Set the named query. If a name is not specified, the default query is set.
         * @param Query Query object
         * @param Name Query name
         */
        svc.setQuery = function (Query, Name) {
            if (Name) {
                svc.queries[Name] = Query;
                svc.updateQuery(Name);
            } else {
                svc.queries['default'] = Query;
                svc.updateQuery('default');
            }
        };

        /**
         * Update the user search query. If a name is not specified, the default query is updated.
         * @param UserQuery User query
         * @param Name Query name
         */
        svc.setUserQuery = function (UserQuery, Name) {
            var query = undefined;
            if (Name in svc.queries) {
                query = svc.queries[Name];
                query.setOption("q",UserQuery);
            } else {
                query = svc.queries['default'];
                query.setOption("q",UserQuery);
                query = svc.query;
                query.setOption("q",UserQuery);
            }
            svc.update();
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
                    svc.queries[key].update();
                }
            }
        };

        /**
         * Update the named query.
         * @param Name Query name
         */
        svc.updateQuery = function (Name) {
            var query = svc.queries[Name];
            if (query) {
                query.update();
            }
        };

        ///////////////////////////////////////////////////////////////////////

        // initialize
        svc.init(CONSTANTS, $http, $rootScope);

        // return the service instance
        return svc;

    }]); // solr search service
