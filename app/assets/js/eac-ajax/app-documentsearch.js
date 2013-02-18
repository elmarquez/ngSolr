/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('eacajax', ['Directives','Filters','SearchServices']);

// @see https://groups.google.com/forum/#!msg/angular/FUPnNj7CwhY/_U1S7PpvCtcJ
// $locationProvider.html5Mode(false).hashPrefix('');

/**
 * Define application routes.
 * @todo consider removing this and making each visualization independent
 */
/*
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/documents', { templateUrl: 'assets/partials/documents.html', controller: DocumentSearchController}).
      when('/documents/:query', { templateUrl: 'assets/partials/documents.html', controller: DocumentSearchController}).
      when('/images', { templateUrl: 'assets/partials/images.html', controller: ImageSearchController}).
      when('/images/:query', { templateUrl: 'assets/partials/images.html', controller: ImageSearchController}).
      when('/locations', {templateUrl: 'assets/partials/locations.html', controller: DocumentSearchController}).
      when('/locations/:query', {templateUrl: 'assets/partials/locations.html', controller: DocumentSearchController}).
      otherwise({redirectTo: '/documents'});
}]);
*/

/**
 * Constants
 * @constant DEFAULT_QUERY Default Solr query
 * @constant FACET_DELIMITER character string used to delimit facet parameters in URL
 * @constant GOOGLE_ANALYTICS Insert Google Analytics tracking
 * @constant GOOGLE_MAPS_API Google Maps API key
 * @constant GOOGLE_SENSOR Google Maps location sensor
 * @constant ICONS Icon key to path map
 * @constant ITEMS_PER_PAGE Number of items to display in a single page of results
 * @constant MAP_START_LOCATION Center the map on the specified location at start
 * @constant MAX_FIELD_LENGTH Maximum length of a field for display in text search results
 * @constant SOLR_BASE URL for Solr host
 * @constant SOLR_CORE Name of Solr core (the search index)
 * @constant SOLR_VERSION Version of Solr search interface, result format
 */
app.constant("CONSTANTS", {
    DEFAULT_FIELDS : 'referrer_uri,source_uri,title,abstract,type,location,location_0_coordinate,location_1_coordinate',
    DEFAULT_QUERY : '*:*',
    FACET_DELIMITER : '&&',
    GOOGLE_ANALYTICS : false,
    GOOGLE_MAPS_API : 'AIzaSyAKoxr2KxRN2tSE7skC8_bqXQgmstFlmwU',
    GOOGLE_MAPS_SENSOR : 'false',
    ICONS: null,
    ITEMS_PER_PAGE : 3000,
    MAP_LEFT_PANEL_COLLAPSED: false,
    MAP_LEFT_PANEL_WIDTH: "320px",
    MAP_START_LATITUDE : '-35.2828',
    MAP_START_LONGITUDE : '149.1314',
    MAX_FIELD_LENGTH : 256,
    QUERY_DELIMITER : '!',
    SOLR_BASE : 'http://dev02.internal:8080',
    SOLR_CORE : 'EOAS',
    SOLR_VERSION : '2.2'
});
