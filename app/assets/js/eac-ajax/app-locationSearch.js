/*
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
 * Constants
 * @constant DEFAULT_QUERY Default Solr query
 * @constant FACET_DELIMITER character string used to delimit facet parameters in URL
 * @constant GOOGLE_ANALYTICS Insert Google Analytics tracking
 * @constant GOOGLE_MAPS_API Google Maps API key
 * @constant GOOGLE_SENSOR Google Maps location sensor
 * @constant MAP_START_LOCATION Center the map on the specified location at start
 * @constant MAX_FIELD_LENGTH Maximum length of a field for display in text search results
 * @constant SOLR_BASE URL for Solr host
 * @constant SOLR_CORE Name of Solr core (the search index)
 * @constant SOLR_VERSION Version of Solr search interface, result format
 */
app.constant("CONSTANTS", {
    DEFAULT_FIELDS : 'uri,title,summary,location_0_coordinate,location_1_coordinate',
    DEFAULT_QUERY : '*:*',
    FACET_DELIMITER : '&&',
    GOOGLE_ANALYTICS : false,
    GOOGLE_MAPS_API : 'AIzaSyASYutMKsjloESclywjl23bdeBIkSj8C4M',
    GOOGLE_MAPS_SENSOR : 'false',
    MAP_START_LATITUDE : '-35.2828',
    MAP_START_LONGITUDE : '149.1314',
    MAX_FIELD_LENGTH : 256,
    QUERY_DELIMITER : '!',
    SOLR_BASE : 'http://dev02.internal:8080',
    SOLR_CORE : 'EOAS',
    SOLR_VERSION : '2.2',
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
