/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* jshint camelcase:false */
'use strict';

/**
 * Date facet controller filters a query by year range, displays controls to
 * set the start/end dates.
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param SolrSearchService Solr search service
 * @param Utils Utilities module
 */
angular
    .module('ngSolr')
    .controller('DateFacetController',
        ['$scope','$attrs','$location','$route','$routeParams','SolrSearchService','Utils',
        function ($scope, $attrs, $location, $route, $routeParams, SolrSearchService, Utils) {

    var date, dateRange, endDateQuery, endDateResults, end_value, end_year,
        f, hash, i, item, query, start_value, start_year, startDateQuery,
        startDateResults, yearEnd, yearStart;

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

    // update the facet list during init
    $scope.updateOnInit = true;

    // user query
    $scope.userquery = '*:*';

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
        yearStart = '-01-01T00:00:00Z';
        yearEnd = '-12-31T23:59:59Z';
        // ISSUE #26 +(startDateField:[* TO userEndDate] AND endDateField:[userStartDate TO *])
        // ISSUE #20 the date query needs to be specified using a set of field queries
        dateRange = '+(';
        dateRange += StartDateField + ':[ * TO ' + EndDate + yearEnd + ' ]';
        dateRange += ' AND ';
        dateRange += EndDateField + ':[ ' + StartDate + yearStart + ' TO * ]';
        dateRange += ')';
        return dateRange;
    };

    /**
     * Get the first date in the item list.
     * @param Items List of items
     * @param FieldName Date field
     */
    $scope.getFirstDateRecord = function(Items, FieldName) {
        if (Items && Items.docs && Items.docs.length > 0) {
            item = Items.docs[0];
            date = item[FieldName];
            if (date !== undefined) {
                i = date.indexOf('-');
                return date.substring(0, i);
            }
        }
        return 0;
    };

    /**
     * Handle update on end date query.
     */
    $scope.handleEndDateQueryUpdate = function() {
        endDateResults = SolrSearchService.getResponse($scope.endDateQueryName);
        if (endDateResults) {
            $scope._endDate = $scope.getFirstDateRecord(endDateResults, $scope.endDateField);
            $scope.endDate = $scope.getFirstDateRecord(endDateResults, $scope.endDateField);
        }
    };

    /**
     * Update the start date field.
     */
    $scope.handleStartDateQueryUpdate = function() {
        startDateResults = SolrSearchService.getResponse($scope.startDateQueryName);
        if (startDateResults) {
            $scope._startDate = $scope.getFirstDateRecord(startDateResults, $scope.startDateField);
            $scope.startDate = $scope.getFirstDateRecord(startDateResults, $scope.startDateField);
        }
    };

    /**
     * Handle route update event.
     */
    $scope.handleUpdate = function() {
        hash = ($routeParams.query || '');
        // get the existing query or create a default query if none exists
        if (hash) {
            query = SolrSearchService.getQueryFromHash(hash, $scope.source);
        } else {
            query = SolrSearchService.createQuery($scope.source);
        }
        // get the earliest date in the index. if there is an existing start
        // date value query then use that instead.
        f = query.getFacet($scope.endDateField);
        if (f) {
            // process the facet value so that we end up with only the year
            // [1800-01-01T00:00:00Z TO *]
            start_year = f.value.replace('[','').replace('-01-01T00:00:00Z TO *]','');
            $scope._startDate = start_year;
            $scope.startDate = start_year;
            $scope.updateFlag += 1 ;
        } else {
            startDateQuery = SolrSearchService.createQuery($scope.source);
            startDateQuery.setOption('fl', $scope.startDateField);
            startDateQuery.setOption('rows', '1');
            startDateQuery.setOption('sort', $scope.startDateField + ' asc');
            startDateQuery.setUserQuery($scope.userquery);
            SolrSearchService.setQuery($scope.startDateQueryName, startDateQuery);
            SolrSearchService.updateQuery($scope.startDateQueryName);
        }
        // get the oldest date in the index. if there is an existing end data
        // query use it, otherwise create a new query to get the date.
        f = query.getFacet($scope.startDateField);
        if (f) {
            // need to process the value portion
            // [* TO 2014-12-31T23:59:59Z]
            end_year = f.value.replace('[* TO ','').replace('-12-31T23:59:59Z]','');
            $scope._endDate = end_year;
            $scope.endDate = end_year;
            $scope.updateFlag += 1 ;
        } else {
            endDateQuery = SolrSearchService.createQuery($scope.source);
            endDateQuery.setOption('fl', $scope.endDateField);
            endDateQuery.setOption('rows', '1');
            endDateQuery.setOption('sort', $scope.endDateField + ' desc');
            endDateQuery.setUserQuery($scope.userquery);
            SolrSearchService.setQuery($scope.endDateQueryName, endDateQuery);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
    };

    /**
     * Initialize the controller. Create queries to determine the start and
     * end date values for the current query.
     */
    $scope.init = function() {
        // apply configured attributes
        Utils.applyAttributes($attrs, $scope);
        // handle location change event, update query results
        $scope.$on('$routeChangeSuccess', function() {
            $scope.handleUpdate();
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
        // if the start date is greater than the end date, reset the date range
        // to the original values and ignore the update request
        if ($scope.startDate > $scope.endDate) {
            // @todo we should signal the error to the user through the widget
            $scope.endDate = $scope._endDate;
            $scope.startDate = $scope._startDate;
            return;
        }
        // get the current location
        hash = ($routeParams.query || '');
        if (hash) {
            query = SolrSearchService.getQueryFromHash(hash, $scope.source);
        } else {
            query = SolrSearchService.createQuery($scope.source);
        }
        // remove any existing date facets
        query.removeFacet($scope.startDateField);
        query.removeFacet($scope.endDateField);
        // create new date facets
        start_value = '[* TO ' + $scope.endDate + '-12-31T23:59:59Z]';
        end_value = '[' + $scope.startDate + '-01-01T00:00:00Z TO *]';
        f = query.createFacet($scope.startDateField, start_value);
        query.addFacet(f);
        f = query.createFacet($scope.endDateField, end_value);
        query.addFacet(f);
        // change window location
        hash = query.getHash();
        $location.path(hash);
    };

    // initialize the controller
    $scope.init();

}]);
