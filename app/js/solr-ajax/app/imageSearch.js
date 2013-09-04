/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('solr-ajax', ['Directives','Filters','Solr','Utils']);

// @see https://groups.google.com/forum/#!msg/angular/FUPnNj7CwhY/_U1S7PpvCtcJ
// $locationProvider.html5Mode(false).hashPrefix('');

/**
 * Define application routes.
 * @see http://www.bennadel.com/blog/2420-Mapping-AngularJS-Routes-Onto-URL-Parameters-And-Client-Side-Events.htm
 */
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/:query', { event: "/query" }).
        otherwise({ event: "/" });
}]);

/**
 * Application constants
 * @constant DEFAULT_FIELDS Default query fields.
 * @constant DEFAULT_QUERY Default Solr query.
 * @constant DEFER_FIRST_SEARCH_SERVICE_UPDATE Defer the first automatic query execution of the search service.
 * @constant FACET_DELIMITER character string used to delimit facet parameters in URL.
 * @constant MAP_FORCE_START_LOCATION Force the map to center on the specified location on the first update.
 * @constant MAP_START_LATITUDE Center the map on the specified latitude at start,
 * @constant MAP_START_LONGITUDE Center the map on the specified longitude at start.
 * @constant SOLR_BASE URL for Solr core.
 */
app.constant("CONSTANTS", {
    DEFAULT_FIELDS: '*',
    DEFAULT_QUERY: '*:*',
    DEFER_FIRST_SEARCH_SERVICE_UPDATE: false,
    FACET_DELIMITER: '&&',
    MAP_FORCE_START_LOCATION: true,
    MAP_START_LATITUDE: null,
    MAP_START_LONGITUDE: null,
    QUERY_DELIMITER: '!',
    SOLR_BASE: 'http://idx.internal:8080/solr/FACP'
});
