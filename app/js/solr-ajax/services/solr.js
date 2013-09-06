/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SolrSearchService support classes                                         */

/**
 * Solr search facet.
 * @param Field Field name
 * @param Value Field value
 * @see http://wiki.apache.org/solr/SimpleFacetParameters#rangefaceting
 */
function SolrFacet(Field, Value) {

    var self = this;        // @todo do we need this?

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
        return self.options[Name];
    };

    /**
     * Get the query Url fragment for this facet.
     * @returns {String}
     */
    self.getUrlFragment = function() {
        // this is used to delimit the start of the facet query in the URL and aid parsing
        var query = '';
        var val = self.value.replace(' ','?');
        query += '&fq=' + self.field + ':(' + val + ')';
        for (var option in self.options) {
            if (self.options.hasOwnProperty(option)) {
                query += "&" + option + "=" + self.options[option];
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

} // end SolrFacet

/**
 * A Solr search query. The query is composed of four parts: user query, query
 * parameters, options, and facets. Each part of the query can be managed
 * individually.
 * @param Url URL to Solr host
 * @param Core Name of Solr core
 */
function SolrQuery(Url) {

    var self = this;

    self.facets = {};            // query facets
    self.facet_counts = {};      // facet counts
    self.highlighting = {};      // query response highlighting
    self.options = {};           // query options
    self.response = {};          // query response
    self.responseHeader = {};    // response header
    self.query = "*:*";          // the user query
    self.queryParameters = {};   // query parameters
    self.solr = Url;             // URL for the Solr core

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
    self.createFacet = function(Name, Value) {
        return new SolrFacet(Name, Value);
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
     * Get the hash portion of the query URL.
     * @returns {String} Location hash
     */
    self.getHash = function() {
        return '/' + self.getQuery();
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
     * Get the query portion of the URL.
     * @returns {String} Location query
     */
    self.getQuery = function() {
        // query
        var query = "q=" + self.query;
        // query parameters
        for (var key in self.queryParameters) {
            query += self.queryParameters[key];
        }
        // options
        for (var key in self.options) {
            var val = self.options[key];
            query += "&" + key + "=" + val;
        }
        // facets
        for (var key in self.facets) {
            var facet = self.facets[key];
            query += facet.getUrlFragment();
        }
        return query;
    };

    /**
     * Get the fully specified Solr query URL.
     */
    self.getSolrQueryUrl = function() {
        return self.solr + "/select?" + encodeURI(self.getQuery());
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
 */
angular.module('Solr',[])
    .factory('SolrSearchService',['$rootScope','$http','$location',
        function($rootScope, $http, $location) {

            var svc = {};                           // service instance
            svc.defaultQueryName = "defaultQuery";  // name of the default query
            svc.error = undefined;                  // user error message
            svc.message = undefined;                // user info or warning message
            svc.queries = {};                       // search queries

            ///////////////////////////////////////////////////////////////////////////

            /**
             * Get a default query object.
             * @param Solr Solr core URL, without the action selector or query
             * @return {Object} A default query object.
             */
            svc.createQuery = function(Solr) {
                var query = new SolrQuery(Solr);
                query.setOption("rows", 10);
                query.setOption("fl", '*');
                query.setOption("json.wrf", "JSON_CALLBACK");
                query.setOption("wt", "json");
                query.setUserQuery('*:*');
                return query;
            };

            /**
             * Get the query object.
             * @param Name Query name
             * @return {Object} The query object or undefined if not found.
             */
            svc.getQuery = function(Name) {
                try {
                    return svc.queries[Name];
                } catch (Err) {
                    if (window.console) {
                        console.log("No query named " + Name + " available");
                    }
                }
            };

            /**
             * Parse the URL hash and return a query object.
             * @param Hash Window location hash. We assume that the # separator has been removed from the string.
             * http://dev02.internal:8080/eac-ajax/app/documents.html#/q=*:*&rows=10&fl=abstract,dobj_proxy_small,fromDate,id,localtype,presentation_url,region,title,toDate&wt=json
             */
            svc.getQueryFromHash = function(Hash) {
                // create a default query
                var query = svc.createQuery();
                // break the query up into elements and then set each element
                // value on the query
                var elements = Hash.split("&");
                for (var i=0; i<elements.length; i++) {
                    var element = elements[i];
                    var eparts = element.split('=');
                    // handle query and query options
                    if (svc.startsWith(element, 'q')) {
                        // split the query from the trailing search parameters
                        var parts = element.split("+");
                        // set the user query
                        var q = parts.shift();
                        var qparts = q.split('=');
                        (qparts.length==2) ? query.setUserQuery(decodeURI(qparts[1])) : query.setUserQuery('*:*');
                        // set query parameters
                        for (var option in parts) {
                            // @todo complete this section for setting query parameters
                        }
                    }
                    // handle facets
                    else if (svc.startsWith(element, 'fq')) {
                        var p = eparts[1].split(':');
                        var n = p[0];
                        var v = p[1];
                        if (v.substring(0,1) == '(') {
                            v = v.substring(1, v.length);
                        }
                        if (v.substring(v.length-1) == ')') {
                            v = v.substring(0, v.length-1);
                        }
                        query.facets[n] = new SolrFacet(n, v);
                        // @todo need to handle facet parameters
                    }
                    // handle query options
                    else {
                        var name = eparts[0].replace('&','');
                        (eparts.length==2) ? query.setOption(name,decodeURI(eparts[1])) : query.setOption(name,'');
                    }
                }
                // return the query
                return query;
            };

            /**
             * Get the query response.
             * @param Name Query name
             * @return {Object} The query response object or undefined if not found.
             */
            svc.getResponse = function(Name) {
                try {
                    return svc.queries[Name].response;
                } catch (Err) {
                    if (window.console) {
                        console.log("Query " + Name + " not found");
                    }
                    return {};
                }
            };

            /**
             * Set the query by name.
             * @param Query Query object
             * @param Name Query name
             */
            svc.setQuery = function(Name, Query) {
                svc.queries[Name] = Query;
            };

            /**
             * Determine if the string s1 starts with the string s2
             * @param s1 String 1
             * @param s2 String 2
             */
            svc.startsWith = function(s1, s2) {
                try {
                    return s1.slice(0, s2.length) == s2;
                } catch (Err) {}
                return false;
            };

            /**
             * Update all queries.
             */
            svc.updateAllQueries = function () {
                svc.error = null;
                svc.message = null;
                for (var key in svc.queries) {
                    if (svc.query.hasOwnProperty(key)) {
                        svc.updateQuery(key);
                    }
                }
            };

            /**
             * Update the named query.
             * @param QueryName Query name
             */
            svc.updateQuery = function(QueryName) {
                // reset messages
                svc.error = null;
                svc.message = null;
                // get the named query
                var query = svc.queries[QueryName];
                if (query) {
                    // fetch the search results
                    var url = query.getSolrQueryUrl();
                    if (window.console) {
                        console.log("GET " + QueryName + ": " + url);
                    }
                    $http.jsonp(url).then(
                        // http success
                        function (result) {
                            var data = result.data;
                            query.setHighlighting(data.highlighting);
                            if (data.hasOwnProperty('facet_counts')) {
                                query.setFacetCounts(data.facet_counts);
                            }
                            query.setResponse(data.response);
                            query.setResponseHeader(data.responseHeader);
                            $rootScope.$broadcast(QueryName);
                        },
                        // http error
                        function (result) {
                            svc.error = "Could not get search results from server. Server responded with status code " + result['status'] + ".";
                            if (window.console) {
                                console.log(svc.error);
                            }
                            var response = {};
                            response['numFound'] = 0;
                            response['start'] = 0;
                            response['docs'] = [];
                            query.setFacetCounts([]);
                            query.setHighlighting({});
                            query.setResponse(response);
                            query.setResponseHeader({});
                            $rootScope.$broadcast(QueryName);
                        }
                    );
                }
            };

            // return the service instance
            return svc;

        }]);
