/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* jshint camelcase:false */
'use strict';

/**
 * Facet field query controller. Fetches a list of facet values from the search
 * index for the specified field. When a facet value is selected by the user, a
 * facet constraint is added to the target query, If facets are mutually
 * exclusive, the 'hidden' variable is set to true to prevent the user from
 * selecting more values. When the facet constraint is removed 'hidden' is set
 * back to false.
 *
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $attrs, $location, $route, $routeParams, $window, SolrSearchService) {

    var count, f, facet, facet_fields, facets, facet_query, hash, i, key, name, query, results, s, selected_values, value;

    // facet selections are mutually exclusive
    $scope.exclusive = true;

    // the name of the query used to retrieve the list of facet values
    $scope.facetQuery = 'facetQuery';

    // the list of facets
    $scope.facets = [];

    // the name of the field to facet
    $scope.field = '';

    // the list of facet values
    $scope.items = [];

    // the max number of items to display in the facet list
    $scope.maxItems = 7;

    // the name of the search query that we are faceting. we watch this query
    // to determine what to present in the facet list
    $scope.queryName = SolrSearchService.defaultQueryName;

    // a facet value from this set has been selected
    $scope.selected = false;

    // the url to the solr core
    $scope.source = undefined;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Facet result
     * @param Value
     * @param Score
     */
    function FacetResult(Value, Score) {
        this.value = Value;
        this.score = Score;
    }

    /**
     * Add the selected facet to the facet constraint list.
     * @param $event Event
     * @param Index Index of user selected facet. This facet will be added to
     * the search list.
     */
    $scope.add = function($event, Index) {
        // create a new facet
        query = SolrSearchService.getQuery($scope.queryName);
        if (query === undefined) {
            query = SolrSearchService.createQuery($scope.source);
        }
        name = $scope.field;
        // ISSUE #27 replace all space characters with * to ensure that Solr matches
        // on the space value
        value = '(' + $scope.items[Index].value.split(' ').join('*') + ')';
        facet = query.createFacet(name, value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) === -1) {
            query.addFacet(facet);
            // change window location
            hash = query.getHash();
            $location.path(hash);
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Handle update event. Get the query object then determine if there is a
     * facet query that corresponds with the field that this controller is
     * targeting.
     */
    $scope.handleUpdate = function() {
        // clear current results
        $scope.items = [];
        $scope.selected = false;
        selected_values = [];
        // get the starting query
        hash = ($routeParams.query || undefined);
        if (hash) {
            query = SolrSearchService.getQueryFromHash(hash, $scope.source);
        } else {
            query = SolrSearchService.createQuery($scope.source);
        }
        // if there is an existing query, find out if there is an existing
        // facet query corresponding to this controller's specified facet
        // field. if there is a match then set that value as selected in
        // our list
        facets = query.getFacets();
        for (i=0; i<facets.length; i++) {
            f = facets[i];
            if (f.field.indexOf($scope.field) > -1) {
                $scope.selected = true;
                s = f.value.replace(/([\(\[\)\]])+/g,'');
                selected_values.push(s);
                // break;
            }
        }
        // get the list of facets for the query
        facet_query = SolrSearchService.getQuery($scope.facetQuery);
        results = facet_query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // trim the result list to the maximum item count
            if (results.facet_fields[$scope.field].length > $scope.maxItems * 2) {
                facet_fields = results.facet_fields[$scope.field].splice(0,$scope.maxItems);
            } else {
                facet_fields = results.facet_fields[$scope.field];
            }
            // add facets to the item list if they have not already been
            // selected
            for (i=0; i< facet_fields.length; i+=2) {
                value = results.facet_fields[$scope.field][i];
                if (selected_values.indexOf(value) === -1) {
                    count = results.facet_fields[$scope.field][i+1];
                    facet = new FacetResult(value,count);
                    $scope.items.push(facet);
                }
            }
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // handle facet list updates
        $scope.facetQuery = $scope.field + 'Query';
        $scope.$on($scope.facetQuery, function () {
            $scope.handleUpdate();
        });
        // update the list of facets on route change
        $scope.$on('$routeChangeSuccess', function() {
            // create a query to get the list of facets
            hash = ($routeParams.query || undefined);
            if (hash) {
                query = SolrSearchService.getQueryFromHash(hash, $scope.source);
            } else {
                query = SolrSearchService.createQuery($scope.source);
            }
            query.setOption('facet', 'true');
            query.setOption('facet.field', $scope.field);
            query.setOption('facet.limit', $scope.maxItems);
            query.setOption('facet.mincount', '1');
            query.setOption('facet.sort', 'count');
            query.setOption('rows', '0');
            query.setOption('wt', 'json');
            SolrSearchService.setQuery($scope.facetQuery, query);
            SolrSearchService.updateQuery($scope.facetQuery);
        });
    };

    // initialize the controller
    $scope.init();

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService'];