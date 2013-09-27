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
 * @param Value Field value. The value includes delimiting () or [] characters.
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
        return self.options[Name];
    };

    /**
     * Get the query Url fragment for this facet.
     * @returns {String}
     */
    self.getUrlFragment = function() {
        // this is used to delimit the start of the facet query in the URL and aid parsing
        var query = ''; // delimiter should come from the CONSTANTS field ???
        // var val = self.value.replace(' ','?');
        query += '&fq=' + self.field + ':' + self.value;
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
 * individually as described below.
 * @param Url URL to Solr host
 */
function SolrQuery(Url) {

    var self = this;

    // query facets
    self.facets = [];

    // facet counts
    self.facet_counts = {};

    // query response highlighting
    self.highlighting = {};

    // query options dictionary, where the key is the option name and the
    // value is the option value
    self.options = {};

    // the user provided query string
    self.query = "*:*";

    // A list of fully specified query parameters. ex: -fieldname:false,
    // +fieldname:"value", +(fieldA:"Value" AND fieldB:"Value")
    self.queryParameters = [];

    // query response
    self.response = {};

    // response header from the solr query
    self.responseHeader = {};

    // URL to the Solr core ex. http://example.com/solr/CORE
    self.solr = Url;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add facet constraint.
     * @param Facet
     */
    self.addFacet = function(Facet) {
        self.facets.push(Facet);
    };

    /**
     * Add a query parameter.
     * @param Parameter
     */
    self.addQueryParameter = function(Parameter) {
        self.queryParameters.push(Parameter);
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
     * Get the facet list.
     * @returns {List}
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
        for (var i=0; i<self.queryParameters.length; i++) {
            query += ' ' + self.queryParameters[i];
        }
        // facets
        for (i=0; i<self.facets.length; i++) {
            var facet = self.facets[i];
            query += facet.getUrlFragment();
        }
        // options
        for (var key2 in self.options) {
            if (self.options.hasOwnProperty(key2)) {
                var val = self.options[key2];
                query += "&" + key2 + "=" + val;
            }
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
     * Remove facet by index.
     * @param Index
     */
    self.removeFacet = function(Index) {
        self.facets.splice(Index, 1);
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
     * Set the user query parameters.
     * @param Parameters Array of parameters.
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
             * @param Solr Solr core URL, without the action selector or query component
             * @return {Object} A default query object.
             */
            svc.createQuery = function(Solr) {
                var query = new SolrQuery(Solr);
                query.setOption("rows", 10);
                query.setOption("fl", "*");
                query.setOption("json.wrf", "JSON_CALLBACK");
                query.setOption("wt", "json");
                query.setUserQuery("*:*");
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
                    return undefined;
                }
            };

            /**
             * Split the query string up into its constituent parts. Return a
             * list of parts. The first part is the user query. The remaining
             * parts are the query parameters. The protocol is that query
             * parameters are to be preceeded by a space, followed by a + or
             * - character.
             * @param Query
             * ex. *:* +localtype:"Organisation" +function:"Home" -type:"Digital Object" +(fromDate:[ * TO 1973-01-01T00:00:00Z] AND toDate:[1973-12-31T23:59:59Z TO *]) -(something:[range])
             */
            svc.getQueryComponents = function(Query) {
                var parts = [];
                while (Query.length > 0) {
                    // trim any starting whitespace
                    Query = Query.replace(/^\s\s*/, '');
                    var x = Query.indexOf(' +');
                    var y = Query.indexOf(' -');
                    if (x == -1 && y == -1) {
                        parts.push(Query); // there are no subsequent parameters
                        return parts;
                    } else if (x > -1 && (y == -1 || x < y)) {
                        parts.push(Query.substring(0, x));
                        Query = Query.substring(x);
                    } else if (y > -1) {
                        parts.push(Query.substring(0, y));
                        Query = Query.substring(y);
                    }
                }
                return parts;
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
                var hash_elements = decodeURI(Hash).split("&");
                for (var i=0; i<hash_elements.length; i++) {
                    var element = hash_elements[i];
                    var eparts = element.split('=');
                    // user query and query parameters
                    if (svc.startsWith(element, 'q')) {
                        var params = svc.getQueryComponents(element.substring(2));
                        query.setUserQuery(params.shift());
                        for (var j=0; j<params.length; j++) {
                            query.addQueryParameter(params[j]);
                        }
                    }
                    // facets
                    else if (svc.startsWith(element, 'fq')) {
                        var p = eparts[1].indexOf(':');
                        var n = eparts[1].substring(0, p);
                        var v = eparts[1].substring(p + 1);
                        query.facets.push(new SolrFacet(n, v));
                    }
                    // query options
                    else {
                        var name = eparts[0].replace('&', '');
                        (eparts.length==2) ? query.setOption(name, eparts[1]) : query.setOption(name, '');
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
                    svc.updateQuery(key);
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
