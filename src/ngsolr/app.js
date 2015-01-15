/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('ngSolr', ['ngRoute','ngSanitize']);

// Application configuration
app.constant('Cfg', {
    'api': 'api/data/',
    'env': [ 'development','staging','production']
});

// Solr query defaults
app.constant('Solr', {
    defaultQuery: function(query) {
        var f = query.createFacet('location_0_coordinate', '*');
        query.addFacet(f);
        query.setOption('fl', '*');
        query.setOption('json.wrf', 'JSON_CALLBACK');
        query.setOption('rows', '5000');
        query.setOption('sort', 'title+asc');
        query.setOption('wt', 'json');
        query.setUserQuery('*:*');
        return query;
    }
});

//// Reconfigure the default search query so that we only return those records
//// that have location coordinate values.
//var m = angular.module('Solr');
//m.config(['SolrSearchServiceProvider', function(SolrSearchServiceProvider) {
//    var defaultQuery = function(query) {
//        var f = query.createFacet('location_0_coordinate', '*');
//        query.addFacet(f);
//        query.setOption('fl', '*');
//        query.setOption('json.wrf', 'JSON_CALLBACK');
//        query.setOption('rows', '5000');
//        query.setOption('sort', 'title+asc');
//        query.setOption('wt', 'json');
//        query.setUserQuery('*:*');
//        return query;
//    };
//    SolrSearchServiceProvider.setDefaultQuery(defaultQuery);
//}]);

/**
 * Define application routes.
 * @see http://www.bennadel.com/blog/2420-Mapping-AngularJS-Routes-Onto-URL-Parameters-And-Client-Side-Events.htm
 */
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/:query', { event: '/query' }).
        otherwise({ event: '/' });
}]);
