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
 */
function DateFacetController($scope, SolrSearchService) {

    var year = new Date();

    // parameters
    $scope.dataMaxDate = 0;                     // the latest date found in the result set
    $scope.dataMinDate = 0;                     // the earliest date found in the result set
    $scope.endDate = year.getFullYear();        // end date
    $scope.endDateField = 'endDate';            // facet field name
    $scope.endDateQueryName = 'endDate';        // end date query name
    $scope.max = 0;                             // the maximum date value, as discovered in the data set
    $scope.min = 0;                             // the minimum date value, as discovered in the data set
    $scope.inclusive = true;                    // use inclusive search method if true, or exclusive if false
    $scope.startDate = 0;                       // start date
    $scope.startDateField = 'startDate';        // facet field name
    $scope.startDateQueryName = 'startDate';    // start date query name
    $scope.target = 'defaultQuery';             // named query to filter

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
            if (date != undefined) {
                // clip the date portion of the field
                var i = date.indexOf('-');
                return date.substring(0,i);
            }
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
        var startDateQuery = SolrSearchService.createQuery();
        startDateQuery.setOption("fl", $scope.startDateField);
        startDateQuery.setOption("rows","1");
        startDateQuery.setOption("sort",$scope.startDateField + " asc");
        startDateQuery.setOption("wt","json");
        SolrSearchService.setQuery(startDateQuery,$scope.startDateQueryName);
        // build a query that will fetch the latest date in the list
        var endDateQuery = SolrSearchService.createQuery();
        endDateQuery.setOption("fl", $scope.endDateField);
        endDateQuery.setOption("rows","1");
        endDateQuery.setOption("sort",$scope.endDateField + " desc");
        endDateQuery.setOption("wt","json");
        SolrSearchService.setQuery(endDateQuery,$scope.endDateQueryName);
        // listen for updates on queries
        $scope.$on($scope.startDateQueryName, function () {
            $scope.updateStartDate();
        });
        $scope.$on($scope.endDateQueryName, function () {
            $scope.updateEndDate();
        });
        // update the start, end dates
        SolrSearchService.updateQuery($scope.startDateQueryName);
        SolrSearchService.updateQuery($scope.endDateQueryName);
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
     */
    $scope.submit = function() {
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var yearStart = "-01-01T00:00:00Z";
            var yearEnd = "-12-31T00:00:00Z";
            var dateRange = '';
            if ($scope.inclusive === true) {
                // inclusive date constraint: +(startDateField:(startDate TO endDate) OR endDateField:(startDate TO endDate))
                dateRange += "+(";
                dateRange += $scope.startDateField + ":[ " + $scope.startDate + yearStart + " TO " + $scope.endDate + yearEnd + " ]";
                dateRange += " OR ";
                dateRange += $scope.endDateField + ":[ " + $scope.startDate + yearStart + " TO " + $scope.endDate + yearEnd + " ]";
                dateRange += ")";
                query.setQueryParameter("dateRange",dateRange);
            } else {
                // exclusive date constraint: +(startDateField:(startDate TO *) OR endDateField:(* TO endDate))
                dateRange += "+(";
                dateRange += $scope.startDateField + ":[ " + $scope.startDate + yearStart + " TO * ] AND ";
                dateRange += $scope.endDateField + ":[ * TO " + $scope.endDate + yearEnd + " ]";
                dateRange += ")";
                query.setQueryParameter("dateRange",dateRange);
            }
            // update the query results
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.update = function() {
        $scope.updateStartDate();
        $scope.updateEndDate();
    };

    /**
     * Update the end date field.
     */
    $scope.updateEndDate = function() {
        var endDateResults = SolrSearchService.getResponse($scope.endDateQueryName);
        if (endDateResults) {
            $scope.max = getFirstDateRecord(endDateResults,$scope.endDateField);
            $scope.endDate = $scope.max;
        }
    };

    /**
     * Update the start date field.
     */
    $scope.updateStartDate = function() {
        var startDateResults = SolrSearchService.getResponse($scope.startDateQueryName);
        if (startDateResults) {
            $scope.min = getFirstDateRecord(startDateResults,$scope.startDateField);
            $scope.startDate = $scope.min;
        }
    };

};

// inject controller dependencies
DateFacetController.$inject = ['$scope','SolrSearchService'];
