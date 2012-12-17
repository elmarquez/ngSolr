/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('eac-search-app', []);

// @see https://groups.google.com/forum/#!msg/angular/FUPnNj7CwhY/_U1S7PpvCtcJ
// $locationProvider.html5Mode(false).hashPrefix('');

/**
 * Define application routes.
 */
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/images', { templateUrl: 'assets/partials/images.html',   controller: SearchController}).
      when('/locations', {templateUrl: 'assets/partials/locations.html', controller: SearchController}).
      otherwise({redirectTo: '/documents'});
}]);

/**
 * Constants
 * @constant DEFAULT_QUERY Default Solr query
 * @constant FACET_DELIMITER Character string used to identify facet query boundary
 * @constant GOOGLE_MAPS_API_KEY Key for Google Maps service
 * @constant MAX_FIELD_LENGTH Maximum length of a text string for display in search results
 * @constant QUERY_DELIMITER Character string used to identify start of query string
 * @constant SOLR_BASE URL for Solr host
 * @constant SOLR_CORE Name of Solr core (the search index)
 * @constant SOLR_VERSION Version of Solr search interface, result format
 */
app.constant("CONSTANTS", {
  DEFAULT_QUERY : "*:*",
  FACET_DELIMITER : "&&",
  GOOGLE_MAPS_API_KEY : "AIzaSyASYutMKsjloESclywjl23bdeBIkSj8C4M",
  MAX_FIELD_LENGTH : 256,
  QUERY_DELIMITER : "!",
  SOLR_BASE : "http://dev02.internal:8080",
  SOLR_CORE : "EOAS",
  SOLR_VERSION : 2.2,
});

/**
 * Directive to support Bootstrap typeahead.
 * @see http://twitter.github.com/bootstrap/javascript.html#typeahead
 * @see http://jsfiddle.net/DNjSM/17/
 */
app.directive('autoComplete', function ($timeout) {
  return function (scope, iElement, iAttrs) {
    var autocomplete = iElement.typeahead();
    scope.$watch(iAttrs.uiItems, function(values) {
      autocomplete.data('typeahead').source = values;
      // console.log(values);
    }, true);
  };
});

/*---------------------------------------------------------------------------*/
/* Global Classes                                                            */
/* @todo these should likely be replaced with a service or something else?   */

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
   * @param Url
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

}

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

/**
 * A Solr search query.
 * @param Base URL to Solr host
 * @param Core Name of Solr core
 * @see [ref to Solr query page]
 * @todo This should likely be converted into an Angular service
 */
function SearchQuery(Base,Core) {
  // parameters
  this.base = Base + "/" + Core + "/select?";   // URL for the Solr core
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
    return this.base + this.getHash();
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

}
