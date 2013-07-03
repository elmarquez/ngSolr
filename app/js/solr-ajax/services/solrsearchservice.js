/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SolrSearchService support classes                                         */

/**
 * Solr search facet.
 * @class Solr search facet
 * @param Field Field name
 * @param Value Field value
 * @see http://wiki.apache.org/solr/SimpleFacetParameters#rangefaceting
 */
function SolrFacet(Field, Value) {

    var self = this;

    self.field = Field;     // field name
    self.value = Value;     // field value
    self.options = {};      // additional filtering options
    //this.options['f'+this.field+'facet.mincount'] = 1;  // minimum item count required for result listing

    /**
     * Get option value.
     * @param Name Option name
     * @returns {String}
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
     * @returns {String}
     */
    self.getUrlFragment = function() {
        // this is used to delimit the start of the facet query in the URL and aid parsing
        var query = '&&'; // delimiter should come from the CONSTANTS field
        query += '&fq=' + self.field + ':(' + self.replaceSpaces(self.value) + ")";
        for (var option in self.options) {
            if (self.options.hasOwnProperty(option)) {
                query = query + "&" + option + "=" + self.options[option];
            }
        }
        return query;
    };

    /**
     * Replace all spaces in the facet value with *.
     * @param Str
     */
    self.replaceSpaces  = function(Str) {
        return Str.replace(' ','?');
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
 * A Solr search query. The query is composed of four parts: user query, query
 * parameters, options, and facets. Each part of the query can be managed
 * individually.
 * @param Url URL to Solr host
 * @param Core Name of Solr core
 */
function SolrQuery(Url, Core) {

    var self = this;

    self.facets = {};               // query facets
    self.facet_counts = {};         // facet counts
    self.highlighting = {};         // query response highlighting
    self.options = {};              // query options
    self.response = {};             // query response
    self.responseHeader = {};       // response header
    self.query = "*:*";             // the user query
    self.queryParameters = {};      // query parameters
    self.url = Url + "/" + Core + "/select?";   // URL for the Solr core

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add facet constraint.
     * @param Name
     * @param Facet
     */
    self.addFacet = function(Name, Facet) {
        self.facets[Name] = Facet;
    };

    /**
     * Create a new facet.
     * @param Name
     * @param Value
     * @return {Facet}
     */
    self.createFacet = function(Name,Value) {
        return new SolrFacet(Name,Value);
    };

    /**
     * Get the facet counts.
     * @returns {Int} Solr facet counts.
     */
    self.getFacetCounts = function() {
        return self.facet_counts;
    };

    /**
     * Get the facet dictionary.
     * @returns {Array}
     */
    self.getFacets = function() {
        return self.facets;
    };

    /**
     * Get the hash portion of the query URL. We UrlEncode the search terms
     * rather than the entire fragment because it comes out in a much more
     * readable form but is still valid.
     * @returns {String} Hash portion of URL
     */
    self.getHash = function() {
        var query = '';
        // append query
        query += "q=" + self.query;
        // add query parameters
        for (var key in self.queryParameters) {
            query += self.queryParameters[key];
        }
        // append options
        for (var key in self.options) {
            var val = self.options[key];
            query += "&" + key + "=" + val;
        }
        // append faceting parameters
        for (var key in self.facets) {
            var facet = self.facets[key];
            query += facet.getUrlFragment();
        }
        // return results
        return query;
    };

    /**
     * Get option value.
     * @param Name Option name
     * @returns {String} undefined value or undefined if not found.
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
        return self.url + encodeURI(self.getHash());
    };

    /**
     * Get the user query value.
     * @return {String}
     */
    self.getUserQuery = function() {
        return self.query;
    };

    /**
     * Get the user query parameters.
     * @return {Array}
     */
    self.getUserQueryParameters = function() {
        return self.queryParameters;
    };

    /**
     * Remove facet by key.
     * @param Key Facet key
     */
    self.removeFacet = function(Key) {
        delete self.facets[Key];
    };

    /**
     * Remove a query option by name,
     * @param Name
     */
    self.removeOption = function(Name) {
        delete self.options[Name];
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
     * Set a query parameter.
     * @param Name
     * @param Val
     */
    self.setQueryParameter = function(Name, Val) {
        self.queryParameters[Name] = Val;
    };

    /**
     * Set the user query parameters.
     * @param Parameters Dictionary of parameters.
     */
    self.setQueryParameters = function(Parameters) {
        self.queryParameters = Parameters;
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
     * Set the user query.
     * @param Query User query
     */
    self.setUserQuery = function(Query) {
        self.query = Query;
    };

} // end SolrQuery


/*---------------------------------------------------------------------------*/
/* SolrSearchService                                                         */

/**
 * Used for managing and executing queries against an Apache Solr/Lucene
 * search index. The service provides shared search configuration for multiple
 * controllers in the form of named queries, and a subscriber service to
 * listen for changes on a named query.
 * @param $rootScope Application root scope
 * @param $http HTTP service
 * @param $location Location service
 * @param CONSTANTS Application constants
 */
angular.module('SolrSearchService',[])
    .factory('SolrSearchService',['$rootScope','$http','$location','CONSTANTS',
        function($rootScope,$http,$location,CONSTANTS) {

        // parameters
        var defaultQueryName = "defaultQuery";  // the name of the default query
        var svc = {};                           // the service instance
        svc.error = undefined;                  // error message
        svc.message = undefined;                // info or warning message to user
        svc.queries = {};                       // named search queries

        ///////////////////////////////////////////////////////////////////////////

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
         * Get the query object. Where a name is not provided, the default
         * query is returned.
         * @param Name Query name
         * @return {Object} The query object or undefined if not found.
         */
        svc.getQuery = function(Name) {
            return svc.queries[Name];
        };

        /**
         * Parse the current query URL to determine the initial view, search
         * query and facet parameters. Valid view values are list, map, graph.
         * @param Hash Window location hash
         * http://dev02.internal:8080/eac-ajax/app/documents.html#/q=*:*&rows=10&fl=abstract,dobj_proxy_small,fromDate,id,localtype,presentation_url,region,title,toDate&wt=json
         */
        svc.getQueryFromHash = function (Hash) {
            var hash = Hash;
            if (hash.indexOf('#/') == 0) {
                hash = hash.substring(2,hash.length);
            }
            // NOTE: we don't have an effective means of restoring the
            // relationship between facets and the fields to which they belong,
            // so we have to remove them from the query when we start
            var i = hash.indexOf(CONSTANTS.FACET_DELIMITER);
            if (i > -1) {
                hash = hash.substring(i,hash.length);
            }
            // create a query
            var query = svc.createQuery();
            // break the hash up into components. in order, the components
            // we expect are the user query, optional query parameters,
            // followed by query options. assign those name/value pairs
            // to the query
            var elements = hash.split("&");
            if (elements.length > 0) {
                // the first element should be the query followed by any
                // optional search parameters
                var e = elements.shift();
                var parts = e.split("+");
                // set user query
                var q = parts.shift();
                var qparts = q.split('=');
                (qparts.length==2) ? query.setUserQuery(decodeURI(qparts[1])) : query.setUserQuery('*:*');
                // set query options
                for (var option in parts) {
                    console.log("query option " + option);
                }
            }
            // the remaining elements are query options
            for (var j=0;j<elements.length;j++) {
                var element = elements[j];
                var eparts = element.split('=');
                var name = eparts[0].replace('&','');
                (eparts.length==2) ? query.setOption(name,decodeURI(eparts[1])) : query.setOption(name,'');
            }
            // subsequent elements are facets
            /*
            for (var j = 1; j < elements.length; j++) {
                var q = elements[j];
                var facet = new SolrFacet();
                facet.setOptionsFromQuery(q);
                // add facet
                query.facets.push(facet);
            }
            */
            // return the query
            return query;
        };

        /**
         * Get the query response.
         * @param Name Query name
         */
        svc.getResponse = function(Name) {
            if (Name) {
                return svc.queries[Name].response;
            } else {
                return svc.queries[defaultQueryName].response;
            }
        };

        /**
         * Set the starting document in the named query.
         * @param Start The index of the starting document.
         * @param Query Query name
         * @todo get rid of this function
         */
        svc.setPage = function(Start, Query) {
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
        svc.setQuery = function(Name, Query) {
            svc.queries[Name] = Query;
        };

        /**
         * Set the fragment portion of the window location to reflect the
         * default query.
         * @param Query
         */
        svc.setWindowLocation = function(Query) {
            // window.location.hash = Query.getHash();
        };

        /**
         * Update all queries.
         */
        svc.update = function () {
            svc.error = null;
            svc.message = null;
            for (var key in svc.queries) {
                svc.updateQuery(key);
            }
        };

        /**
         * Update the named query.
         * @param Name Query name
         */
        svc.updateQuery = function(Name) {
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
                        // update the window location if we changed the default
                        // query
                        if (Name === defaultQueryName) {
                            svc.setWindowLocation(query);
                        }
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

        ///////////////////////////////////////////////////////////////////////

        // initialize
        svc.queries[defaultQueryName] = svc.createQuery();

        // return the service instance
        return svc;

    }]);
