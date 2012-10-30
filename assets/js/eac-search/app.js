/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('eac-search-app', []);

//constants
app.constant("CONSTANTS", {SOLRBASE:"http://dev02.internal:8080/EOAS"});

// directive to support Bootstrap typeahead
// @see http://twitter.github.com/bootstrap/javascript.html#typeahead
// @see http://jsfiddle.net/DNjSM/17/
app.directive('autoComplete', function ($timeout) {
  return function (scope, iElement, iAttrs) {
    var autocomplete = iElement.typeahead();
    scope.$watch(iAttrs.uiItems, function(values) {
      console.log(values);
      autocomplete.data('typeahead').source = values;
    }, true);
  };
});

/*---------------------------------------------------------------------------*/
/* Global Classes                                                            */

/**
 * A Solr search query
 * @param Base Solr core URL
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
