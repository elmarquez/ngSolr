/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Facet field query controller. Fetches a list of facet values from the search
 * index for the specified field. When a facet value is selected by the user, a
 * facet constraint is added to the target query, If facets are mutually
 * exclusive, the 'hidden' variable is set to true to prevent the user from
 * selecting more values. When the facet constraint is removed 'hidden' is set
 * back to false.
 *
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, SolrSearchService) {

    // parameters
    $scope.exclusive = true;            // facet selections are mutually exclusive
    $scope.facets = [];                 // list of current query facets
    $scope.field = '';                  // facet field name and name of query
    $scope.items = [];                  // list of facet values for the specified field
    $scope.maxItems = 7;                // max number of results to display
    $scope.queryname = 'facetQuery';    // query name
    $scope.selected = false;            // a facet value has been selected
    $scope.target = 'defaultQuery';     // the target search query
    $scope.updateOnInit = false;        // update the facet list during init
    $scope.updateOnTargetChange = true; // update facet list to reflect target results

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Facet result
     * @param Name Facet field name
     * @param Score Facet score
     */
    function FacetResult(Value,Score) {
        this.value = Value;
        this.score = Score;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add the selected facet to the facet constraint list.
     * @param Index Index of user selected facet. This facet will be added to the search list.
     */
    $scope.add = function($event,Index) {
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
        // determine if we've added a facet constraint from this field to the
        // target query
        var targetquery = SolrSearchService.getQuery($scope.target);
        var facets = targetquery.getFacets();
        $scope.selected = false;
        var selected_values = [];
        for (var key in facets) {
            if (key.indexOf($scope.queryname)==0) {
                $scope.selected = true;
                selected_values.push(facets[key].value);
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
     * @param FieldName Facet field name
     * @param Target Name of target search query to constrain
     */
    $scope.init = function(FieldName,Target) {
        $scope.field = FieldName;
        if (Target) {
            $scope.target = Target;
        }
        // create a query to get the list of facets
        $scope.queryname = $scope.field + "Query";
        var query = SolrSearchService.createQuery();
        query.setOption("facet","true");
        query.setOption("facet.field",$scope.field);
        query.setOption("facet.limit",$scope.maxItems);
        query.setOption("facet.mincount","1");
        query.setOption("facet.sort","count");
        query.setOption("rows","0");
        query.setOption("wt","json");
        SolrSearchService.setQuery($scope.queryname,query);
        // handle update events on the facet query
        $scope.$on($scope.queryname, function () {
            $scope.handleUpdate();
        });
        // handle update events on the target query
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // update the controller
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
            $scope.handleFacetListUpdate();
        }
    };

}

// inject dependencies
FieldFacetController.$inject = ['$scope','SolrSearchService'];