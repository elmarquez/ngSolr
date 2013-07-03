/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SimpleSearch Application                                                  */

var app = angular.module('simplesearch',['Directives','Filters','SolrSearchService','Utils']);

/**
 * Define application routes. We follow the approach outlined here to map
 * routes to a single controller.
 * @see http://www.bennadel.com/blog/2420-Mapping-AngularJS-Routes-Onto-URL-Parameters-And-Client-Side-Events.htm
 */
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/:query', { event: "query" }).
        when('/:query/:page', { event: "query-and-page" }).
        otherwise({ redirectTo: "/" });
}]);

app.constant("CONSTANTS", {
    DEFAULT_FIELDS: 'abstract,dobj_proxy_small,fromDate,id,localtype,presentation_url,title,toDate',
    DEFAULT_QUERY: '*:*',
    FACET_DELIMITER: '&&',
    ITEMS_PER_PAGE: 10,
    SOLR_BASE: 'http://dev02.internal:8080',
    SOLR_CORE: 'FACP_doc'
});

// set the URL format to HTML5 mode
// @see http://docs.angularjs.org/guide/dev_guide.services.$location
// $locationProvider.html5Mode(true);
