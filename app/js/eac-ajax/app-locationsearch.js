/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('eacajax', ['Directives','Filters','SelectionSetService','SolrSearchService','Utils']);

// @see https://groups.google.com/forum/#!msg/angular/FUPnNj7CwhY/_U1S7PpvCtcJ
// $locationProvider.html5Mode(false).hashPrefix('');

/**
 * Define application routes.
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
 * @constant DEFAULT_FIELDS Default query fields.
 * @constant DEFAULT_QUERY Default Solr query.
 * @constant DEFER_FIRST_SEARCH_SERVICE_UPDATE Defer the first automatic query execution of the search service.
 * @constant FACET_DELIMITER character string used to delimit facet parameters in URL.
 * @constant GOOGLE_ANALYTICS Insert Google Analytics tracking.
 * @constant GOOGLE_MAPS_API Google Maps API key.
 * @constant GOOGLE_SENSOR Google Maps location sensor.
 * @constant ICONS Icon key to path map,
 * @constant ITEMS_PER_PAGE Number of items to display in a single page of results.
 * @constant MAP_FORCE_START_LOCATION Force the map to center on the specified location on the first update.
 * @constant MAP_START_LATITUDE Center the map on the specified latitude at start,
 * @constant MAP_START_LONGITUDE Center the map on the specified longitude at start.
 * @constant MAX_FIELD_LENGTH Maximum length of a field for display in text search results.
 * @constant SIDEBAR_OPEN Set the sidebar to be open on start.
 * @constant SOLR_BASE URL for Solr host.
 * @constant SOLR_CORE Name of Solr core (the search index).
 * @constant SOLR_VERSION Version of Solr search interface, result format.
 */
app.constant("CONSTANTS", {
    DEFAULT_FIELDS: 'abstract,country,fromDate,id,location,location_0_coordinate,location_1_coordinate,referrer_uri,region,title,toDate,type',
    DEFAULT_QUERY: '*:*',
    DEFER_FIRST_SEARCH_SERVICE_UPDATE: false,
    FACET_DELIMITER: '&&',
    GOOGLE_ANALYTICS: false,
    GOOGLE_MAPS_API: 'AIzaSyAKoxr2KxRN2tSE7skC8_bqXQgmstFlmwU',
    GOOGLE_MAPS_SENSOR: 'false',
    ICONS: null,
    ITEMS_PER_PAGE: 10,
    MAP_FORCE_START_LOCATION: true,
    MAP_LEFT_PANEL_WIDTH: "320px",
    MAP_START_LATITUDE: '-32.3456',
    MAP_START_LONGITUDE: '141.4346',
    MAX_FIELD_LENGTH: 256,
    QUERY_DELIMITER: '!',
    SIDEBAR_OPEN: true,
    SOLR_BASE: 'http://dev02.internal:8080',
    SOLR_CORE: 'EOAS',
    SOLR_VERSION: '2.2'
});
