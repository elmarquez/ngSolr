/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('eac-search-app', []);

// constants
app.constant("CONSTANTS", {
  DEFAULT_QUERY :"*:*",
  MAX_FIELD_LENGTH : 256,
  SOLR_BASE : "http://dev02.internal:8080/EOAS",
  SOLR_VERSION : 2.2,
});

// Directive to support Bootstrap typeahead
// @see http://twitter.github.com/bootstrap/javascript.html#typeahead
// @see http://jsfiddle.net/DNjSM/17/
app.directive('autoComplete', function ($timeout) {
  return function (scope, iElement, iAttrs) {
    var autocomplete = iElement.typeahead();
    scope.$watch(iAttrs.uiItems, function(values) {
      // console.log(values);
      autocomplete.data('typeahead').source = values;
    }, true);
  };
});

/*---------------------------------------------------------------------------*/
/* Global Classes                                                            */
/* @todo these should likely be replaced with a service or something else?   */

/**
 * Search facet
 * @see http://wiki.apache.org/solr/SimpleFacetParameters#rangefaceting
 */
function Facet(Field,Score) {
  // basic faceting
  this.field = Field;     // field name
  this.sort = 'count';    // sort based on item count, lexicographi index
  this.limit = 100;       // maximum instances to be returned
  this.mincount = 0;      // minimum instance count for the facet to be returned
  // range faceting
  this.range = '';        // parameter name
  this.range.start = '';  // start value
  this.range.end = '';    // end value
  // build a query fragment for this facet
  this.getQueryFragment = function() {
    var query = '';
    for (var key in this) {
      query = query + "&" + key + "=" + encodeURIComponent(this[key]);
    }
    return query;
  }
}

/**
 * A Solr search query
 * @param Base Solr core URL
 * @todo This should likely be converted into an Angular service
 */
function SearchQuery(Base) {
  this.base = Base + "/select?";    // URL for the Solr core
  this.options = [];                // search parameters
  // get the query URL
  this.getQuery = function() {
    var query = this.base;
    for (var key in this.options) {
      query = query + "&" + key + "=" + encodeURIComponent(this.options[key]);
    }
    return query;
  };
  // set a query option
  this.setOption = function(Name,Value) {
    this.options[Name] = Value;
  };
}
