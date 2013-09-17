/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* DateFacetController                                                       */

/**
 * Date facet controller filters a query by year range, displays controls to
 * set the start/end dates.
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param SolrSearchService Solr search service
 *
 * @todo the method of fetching dates should use the .then() method of data retrieval
 */
function DateFacetController($scope, $attrs, $location, $route, $routeParams, SolrSearchService) {

    var year = new Date();

    // for tracking dates during update
    $scope._endDate = 0;
    $scope._startDate = 0;

    // end date
    $scope.endDate = 0;

    // facet field name
    $scope.endDateField = 'toDate';

    // end date query name
    $scope.endDateQueryName = 'endDateQuery';

    // url to solr core
    $scope.source = undefined;

    // start date
    $scope.startDate = 0;

    // facet field name
    $scope.startDateField = 'fromDate';

    // start date query name
    $scope.startDateQueryName = 'startDateQuery';

    // named query to filter
    $scope.target = SolrSearchService.defaultQueryName;

    // flag used to track update process (-2 started, -1 partially done, 0 complete)
    $scope.updateFlag = 0;

    // update the facet list during init
    $scope.updateOnInit = true;

    // user query
    $scope.userquery = "*:*";

    //////////////////////////////////////////////////////////////////////////

    /**
     * Build the Solr date range constraint string. The date range will be
     * inclusive such that all entities that existing within the specified
     * date range will be returned.
     * @param StartDateField
     * @param StartDate
     * @param EndDateField
     * @param EndDate
     */
    $scope.getDateRangeConstraint = function(StartDateField, StartDate, EndDateField, EndDate) {
        var yearStart = "-01-01T00:00:00Z";
        var yearEnd = "-12-31T23:59:59Z";
        // ISSUE #26 +(startDateField:[* TO userEndDate] AND endDateField:[userStartDate TO *])
        var dateRange = "+(";
        dateRange += StartDateField + ":[ * TO " + EndDate + yearEnd + " ]";
        dateRange += " AND ";
        dateRange += EndDateField + ":[ " + StartDate + yearStart + " TO * ]";
        dateRange += ")";
        return dateRange;
    };

    /**
     * Get the first date in the item list.
     * @param Items List of items
     * @param FieldName Date field
     */
    $scope.getFirstDateRecord = function(Items, FieldName) {
        if (Items && Items.docs && Items.docs.length > 0) {
            var item = Items.docs[0];
            var date = item[FieldName];
            if (date != undefined) {
                var i = date.indexOf('-');
                return date.substring(0, i);
            }
        }
        return 0;
    };

    /**
     * Handle update on end date query.
     */
    $scope.handleEndDateQueryUpdate = function() {
        var endDateResults = SolrSearchService.getResponse($scope.endDateQueryName);
        if (endDateResults) {
            $scope._endDate = $scope.getFirstDateRecord(endDateResults, $scope.endDateField);
            $scope.endDate = $scope.getFirstDateRecord(endDateResults, $scope.endDateField);
        }
        $scope.updateFlag++;
    };

    /**
     * Update the start date field.
     */
    $scope.handleStartDateQueryUpdate = function() {
        var startDateResults = SolrSearchService.getResponse($scope.startDateQueryName);
        if (startDateResults) {
            $scope._startDate = $scope.getFirstDateRecord(startDateResults, $scope.startDateField);
            $scope.startDate = $scope.getFirstDateRecord(startDateResults, $scope.startDateField);
        }
        $scope.updateFlag++;
    };

    /**
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        // change the start date user query
        query = SolrSearchService.getQuery($scope.startDateQueryName);
        query.setUserQuery(userquery);
        // change the end date user query
        query = SolrSearchService.getQuery($scope.endDateQueryName);
        query.setUserQuery(userquery);
        // update queries
        $scope.updateFlag = -2;
        SolrSearchService.updateQuery($scope.startDateQueryName);
        SolrSearchService.updateQuery($scope.endDateQueryName);
    };

    /**
     * Initialize the controller. Create queries to determine the start and
     * end date values for the current query.
     */
    $scope.init = function() {
        // apply configured attributes
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // handle location change event, update query results
        $scope.$on("$routeChangeSuccess", function() {
            $scope.query = ($routeParams.query || "");
            if ($scope.query) {
                var query = SolrSearchService.getQueryFromHash($scope.query);
                $scope.userquery = query.getUserQuery();
            }
            // build a query that will fetch the earliest date in the list
            var startDateQuery = SolrSearchService.createQuery($scope.source);
            startDateQuery.setOption("fl", $scope.startDateField);
            startDateQuery.setOption("rows", "1");
            startDateQuery.setOption("sort", $scope.startDateField + " asc");
            startDateQuery.setUserQuery($scope.userquery);
            SolrSearchService.setQuery($scope.startDateQueryName, startDateQuery);
            // build a query that will fetch the latest date in the list
            var endDateQuery = SolrSearchService.createQuery($scope.source);
            endDateQuery.setOption("fl", $scope.endDateField);
            endDateQuery.setOption("rows", "1");
            endDateQuery.setOption("sort", $scope.endDateField + " desc");
            endDateQuery.setUserQuery($scope.userquery);
            SolrSearchService.setQuery($scope.endDateQueryName, endDateQuery);
            // if we should update the date list during init
            if ($scope.updateOnInit) {
                $scope.updateFlag = -2;
                SolrSearchService.updateQuery($scope.startDateQueryName);
                SolrSearchService.updateQuery($scope.endDateQueryName);
            }
        });
        // listen for updates on queries
        $scope.$on($scope.startDateQueryName, function () {
            $scope.handleStartDateQueryUpdate();
        });
        $scope.$on($scope.endDateQueryName, function () {
            $scope.handleEndDateQueryUpdate();
        });
    };

    /**
     * Set a date range constraint on the target query.
     */
    $scope.submit = function() {
        if ($scope.startDate <= $scope.endDate) {
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                var dateRange = $scope.getDateRangeConstraint($scope.startDateField, $scope.startDate, $scope.endDateField, $scope.endDate);
                query.addQueryParameter(dateRange);
                SolrSearchService.updateQuery($scope.target);
            }
        } else {
            // set the values back to the prior state
            $scope.endDate = $scope._endDate;
            $scope.startDate = $scope._startDate;
            console.log("WARNING: start date is greater than end date");
        }
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
DateFacetController.$inject = ['$scope','$attrs','$location','$route','$routeParams','SolrSearchService'];
