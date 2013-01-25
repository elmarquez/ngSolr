/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('eac-ajax-app', []);

// @see https://groups.google.com/forum/#!msg/angular/FUPnNj7CwhY/_U1S7PpvCtcJ
// $locationProvider.html5Mode(false).hashPrefix('');

/**
 * Define application routes.
 * @todo consider removing this and making each visualization independent
 */
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/documents', { templateUrl: 'assets/partials/documents.html', controller: DocumentSearchController}).
      when('/documents/:query', { templateUrl: 'assets/partials/documents.html', controller: DocumentSearchController}).
      when('/images', { templateUrl: 'assets/partials/images.html', controller: ImageSearchController}).
      when('/images/:query', { templateUrl: 'assets/partials/images.html', controller: ImageSearchController}).
      when('/locations', {templateUrl: 'assets/partials/locations.html', controller: LocationSearchController}).
      when('/locations/:query', {templateUrl: 'assets/partials/locations.html', controller: LocationSearchController}).
      otherwise({redirectTo: '/documents'});
}]);

/**
 * Constants
 * @constant DEFAULT_QUERY Default Solr query
 * @constant MAX_FIELD_LENGTH Maximum length of a text string for display in search results
 * @constant SOLR_BASE URL for Solr host
 * @constant SOLR_CORE Name of Solr core (the search index)
 * @constant SOLR_VERSION Version of Solr search interface, result format
 */
app.constant("CONSTANTS", {
  DEFAULT_QUERY :"*:*",
  FACET_DELIMITER : '&&',
  MAX_FIELD_LENGTH : 256,
  QUERY_DELIMITER : '!',
  SOLR_BASE : "http://localhost:8080",
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
