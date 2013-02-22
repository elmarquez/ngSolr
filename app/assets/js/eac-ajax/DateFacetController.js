/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Date facet controller filters a query by year range.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function DateFacetController($scope, SolrSearchService, CONSTANTS) {

    var year = new Date();

    // parameters
    $scope.dataMaxDate = 0;                     // the latest date found in the result set
    $scope.dataMinDate = 0;                     // the earliest date found in the result set
    $scope.endDate = year.getFullYear();        // end date
    $scope.endDateField = 'endDate';            // facet field name
    $scope.endDateQueryName = 'endDate';        // end date query name
    $scope.max = 0;                             // the maximum date value, as discovered in the data set
    $scope.min = 0;                             // the minimum date value, as discovered in the data set
    $scope.startDate = 0;                       // start date
    $scope.startDateField = 'startDate';        // facet field name
    $scope.startDateQueryName = 'startDate';    // start date query name
    $scope.target = 'default';                  // named query to filter

    //////////////////////////////////////////////////////////////////////////

    /**
     * Get the first date in the item list.
     * @param Items List of items
     * @param FieldName Date field
     */
    function getFirstDateRecord(Items, FieldName) {
        if (Items && Items.docs && Items.docs.length > 0) {
            var item = Items.docs[0];
            var date = item[FieldName];
            // clip the date portion of the field
            var i = date.indexOf('-');
            return date.substring(0,i);
        }
        return 0;
    }

    //////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     * @param StartDateField Start date field to filter on
     * @param EndDateField End date field to filter on
     * @param QueryName Named query to filter
     */
    $scope.init = function(StartDateField,EndDateField,QueryName) {
        if (StartDateField) {
            $scope.startDateField = StartDateField;
        }
        if (EndDateField) {
            $scope.endDateField = EndDateField;
        }
        if (QueryName) {
            $scope.target = QueryName;
        }
        // create query names for start/end queries
        $scope.startDateQueryName = $scope.startDateField + "Query";
        $scope.endDateQueryName = $scope.endDateField + "Query";
        // build a query that will fetch the earliest date in the list
        var startDateQuery = SolrSearchService.getDefaultQuery();
        startDateQuery.setOption("fl", $scope.startDateField);
        startDateQuery.setOption("q","*:*");
        startDateQuery.setOption("rows","1");
        startDateQuery.setOption("sort",$scope.startDateField + "%20asc");
        startDateQuery.setOption("wt","json");
        SolrSearchService.setQuery(startDateQuery,$scope.startDateQueryName);
        // build a query that will fetch the latest date in the list
        var endDateQuery = SolrSearchService.getDefaultQuery();
        endDateQuery.setOption("fl", $scope.endDateField);
        endDateQuery.setOption("q","*:*");
        endDateQuery.setOption("rows","1");
        endDateQuery.setOption("sort",$scope.endDateField + "%20desc");
        endDateQuery.setOption("wt","json");
        SolrSearchService.setQuery(endDateQuery,$scope.endDateQueryName);
        // update the search results
        $scope.update();
    };

    /**
     * Set the start and end date facet constraint. The start year must be equal to or less than the end year.
     * @param Start Start year
     * @param End End year
     */
    $scope.set = function($event,Start,End) {
        if (Start <= End) {
            $scope.startDate = Start;
            $scope.endDate = End;
            // update the facet constraint
            $scope.update();
        } else {
            console.log("WARNING: start date is greater than end date");
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Set date range constraint on the target query.
     * q=*:*:[2011-01-01T00:00:00Z TO 2011-12-31T00:00:00Z]
     */
    $scope.submit = function() {
        // if the current query has an existing date range constraint, remove it
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            // get query parameters
            var q = query.getOption('q');
            if (q.hasOwnProperty($scope.startDateField)) {

            }
            if (q.hasOwnProperty($scope.endDateField)) {

            }
            // create a new date range constrain
            var yearstart = "-01-01T00:00:00Z";
            var yearto = "%20TO%20";
            var yearend = "-12-31T00:00:00Z";
            var fromconstraint = encodeURIComponent($scope.startDateField) + ":[" + $scope.startDate + yearstart + yearto + "*]";
            var toconstraint = encodeURIComponent($scope.endDateField) + ":[*" + yearto + $scope.endDate + yearend + "]";
            console.log(fromconstraint);
            console.log(toconstraint);
            // add it to the target query
        }
    };

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        var startDateResults = SolrSearchService.getResponse($scope.startDateQueryName);
        if (startDateResults) {
            $scope.min = getFirstDateRecord(startDateResults,$scope.startDateField);
            $scope.startDate = $scope.min;
        }
        var endDateResults = SolrSearchService.getResponse($scope.endDateQueryName);
        if (endDateResults) {
            $scope.max = getFirstDateRecord(endDateResults,$scope.endDateField);
            $scope.endDate = $scope.max;
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on('update', function () {
        $scope.update();
    });

}

// inject controller dependencies
DateFacetController.$inject = ['$scope','SolrSearchService','CONSTANTS'];
