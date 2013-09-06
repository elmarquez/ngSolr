/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* FacetSelectionController                                                  */

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
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $attrs, $location, $route, $routeParams, SolrSearchService) {

    // facet selections are mutually exclusive
    $scope.exclusive = true;

    // the list of facets
    $scope.facets = [];

    // the name of the field to facet
    $scope.field = '';

    // the list of facet values
    $scope.items = [];

    // the max number of items to display in the facet list
    $scope.maxItems = 7;

    // the name of the query used to retrieve the list of facet values
    $scope.queryname = 'facetQuery';

    // facet value has been selected
    $scope.selected = false;

    // the url to the solr core
    $scope.source = undefined;

    // the name of the search query that we are faceting. we watch this query
    // to determine what to present in the facet list
    $scope.target = SolrSearchService.defaultQueryName;

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
     * @param Index Index of user selected facet. This facet will be added to the search list.
     */
    $scope.add = function($event, Index) {
        // create a new facet
        var query = SolrSearchService.getQuery($scope.target);
        var facet = query.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) == -1) {
            var id = Math.floor(Math.random()*101);
            var name = $scope.queryname + id;
            query.addFacet(name,facet);
            SolrSearchService.updateQuery($scope.target);
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        // get the target user query
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        query = SolrSearchService.getQuery($scope.queryname);
        query.setUserQuery(userquery);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Handle update event.
     */
    $scope.handleUpdate = function() {
        // clear current results
        $scope.items = [];
        $scope.selected = false;
        var selected_values = [];
        // if there is an existing query, determine if a facet query that
        // corresponds with this controller has been added to the query
        var target = SolrSearchService.getQuery($scope.target);
        if (target) {
            var facets = target.getFacets();
            for (var key in facets) {
                if (key.indexOf($scope.queryname)==0) {
                    $scope.selected = true;
                    selected_values.push(facets[key].value);
                }
            }
        }
        // get the list of facets for the query
        var query = SolrSearchService.getQuery($scope.queryname);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // trim the result list to the maximum item count
            if (results.facet_fields[$scope.field].length > $scope.maxItems * 2) {
                var facet_fields = results.facet_fields[$scope.field].splice(0,$scope.maxItems);
            } else {
                var facet_fields = results.facet_fields[$scope.field];
            }
            // add facets to the item list if they have not already been
            // selected
            if (!$scope.exclusive && selected_values.length > 0) {

            }
            for (var i=0; i< facet_fields.length; i+=2) {
                var value = results.facet_fields[$scope.field][i];
                if (selected_values.indexOf(value) == -1) {
                    var count = results.facet_fields[$scope.field][i+1];
                    var facet = new FacetResult(value,count);
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
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        $scope.queryname = $scope.field + "Query";
        // handle facet list updates
        $scope.$on($scope.queryname, function () {
            $scope.handleUpdate();
        });
        // handle route change event
        $scope.$on("$routeChangeSuccess", function() {
            // if there is an existing query, find out if there is a facet
            // for this controller's specified field. if there is a match,
            // then set that value as selected in our list
            var hash = ($routeParams.query || "");
            if (hash) {
                // get the current query
                var query = SolrSearchService.getQueryFromHash(hash);
                var facets = query.getFacets();
                var found = false;
                for (var i=0; i<facets.length; i++) {
                    //
                }
            }
            // create a query to get the list of facets
            var query = SolrSearchService.createQuery($scope.source);
            query.setOption("facet", "true");
            query.setOption("facet.field", $scope.field);
            query.setOption("facet.limit", $scope.maxItems);
            query.setOption("facet.mincount", "1");
            query.setOption("facet.sort", "count");
            query.setOption("rows", "0");
            query.setOption("wt", "json");
            SolrSearchService.setQuery($scope.queryname, query);
            SolrSearchService.updateQuery($scope.queryname);
        });
    };

    // initialize the controller
    $scope.init();

}

// inject dependencies
FieldFacetController.$inject = ['$scope', '$attrs', '$location', '$route', '$routeParams', 'SolrSearchService'];