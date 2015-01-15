/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* global d3 */
/* jshint loopfunc:true */
'use strict';

/**
 * Date facet controller filters a query by year range, displays controls to
 * set the start/end dates, displays a histogram control to both view and
 * filter date by year range.
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $log Log service
 * @param $route
 * @param $routeParams
 * @param SolrSearchService Solr search service
 * @param Utils Utilities module
 *
 * @todo the method of fetching dates should use the .then() method of data retrieval for the start/end dates
 * @todo update to reflect the current date range, if such a facet exists
 */
angular
    .module('ngSolr')
    .controller('DateFacetHistogramController',
        ['$scope','$attrs','$location','$log','$route','$routeParams','SolrSearchService','Utils',
        function ($scope, $attrs, $location, $log, $route, $routeParams, SolrSearchService, Utils) {

    var bin, count, date, endDateResults, i, item, query, startDateResults, userquery;

    // for tracking dates during histogram update
    $scope._endDate = 0;
    $scope._startDate = 0;

    // end date
    $scope.endDate = 0;

    // facet field name
    $scope.endDateField = 'toDate';

    // end date query name
    $scope.endDateQueryName = 'endDateQuery';

    // histogram data
    $scope.histogram = [];

    // chart height
    $scope.histogramHeight = 100;

    // maximum number of histogram bins
    $scope.histogramMaxBins = 10;

    // histogram query name
    $scope.histogramQueryName = 'histogramQuery';

    // chart width
    $scope.histogramWidth = 240;

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

    // update the histogram
    $scope.updateHistogram = true;

    // update the facet list during init
    $scope.updateOnInit = false;

    // update the date range to reflect the target query results
    $scope.updateOnTargetChange = true;

    //////////////////////////////////////////////////////////////////////////

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
                return date.substring(0,i);
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
            $scope._endDate = $scope.getFirstDateRecord(endDateResults,$scope.endDateField);
            $scope.endDate = $scope.getFirstDateRecord(endDateResults,$scope.endDateField);
        }
        // update the histogram after start/end dates have been updated
        $scope.updateFlag++;
        if ($scope.updateHistogram && $scope.updateFlag === 0) {
            $scope.updateHistogram();
        }
    };

    /**
     * Handle update on the histogram query.
     */
    $scope.handleHistogramQueryUpdate = function(Event) {
        // get the bin number
        i = Event.name.indexOf('_');
        bin = Event.name.substring(i+1,Event.name.length);
        // set the bin value
        query = SolrSearchService.getQuery(Event.name);
        count = query.response.numFound;
        $scope.histogram[bin].count = count;
        // update the chart
        $scope.updateHistogramChart();
    };

    /**
     * Update the start date field.
     */
    $scope.handleStartDateQueryUpdate = function() {
        startDateResults = SolrSearchService.getResponse($scope.startDateQueryName);
        if (startDateResults) {
            $scope._startDate = $scope.getFirstDateRecord(startDateResults,$scope.startDateField);
            $scope.startDate = $scope.getFirstDateRecord(startDateResults,$scope.startDateField);
        }
        // update the histogram after start/end dates have been updated
        $scope.updateFlag++;
        if ($scope.updateHistogram && $scope.updateFlag === 0) {
            $scope.updateHistogram();
        }
    };

    /**
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        query = SolrSearchService.getQuery($scope.target);
        userquery = query.getUserQuery();
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
     * Initialize the controller. We create queries to determine the start and
     * end date values. Once we have both of those values in hand, we then
     * build a histogram of documents by date range.
     */
    $scope.init = function() {
        // apply configured attributes
        Utils.applyAttributes($attrs, $scope);
        // handle location change event, update query results
        $scope.$on('$routeChangeSuccess', function() {
            $scope.query = ($routeParams.query || '');
            if ($scope.query) {
                var query = SolrSearchService.getQueryFromHash($scope.query, $scope.source);
                $scope.userquery = query.getUserQuery();
            }
            // build a query that will fetch the earliest date in the list
            var startDateQuery = SolrSearchService.createQuery();
            startDateQuery.setOption('fl', $scope.startDateField);
            startDateQuery.setOption('rows','1');
            startDateQuery.setOption('sort',$scope.startDateField + ' asc');
            startDateQuery.setUserQuery($scope.userquery);
            SolrSearchService.setQuery($scope.startDateQueryName, startDateQuery);
            // build a query that will fetch the latest date in the list
            var endDateQuery = SolrSearchService.createQuery();
            endDateQuery.setOption('fl', $scope.endDateField);
            endDateQuery.setOption('rows','1');
            endDateQuery.setOption('sort',$scope.endDateField + ' desc');
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
        $scope.$on($scope.startDateQueryName, function() {
            $scope.handleStartDateQueryUpdate();
        });
        $scope.$on($scope.endDateQueryName, function() {
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
                var dateRange = $scope.getDateRangeConstraint($scope.startDateField,$scope.startDate,$scope.endDateField,$scope.endDate);
                query.setQueryParameter('dateRange',dateRange);
                SolrSearchService.updateQuery($scope.target);
            }
        } else {
            // set the values back to the prior state
            $scope.endDate = $scope._endDate;
            $scope.startDate = $scope._startDate;
            $log.info('WARNING: start date is greater than end date');
        }
    };

    /**
     * Update the histogram data.
     */
    $scope.updateHistogram = function () {
        var bin, binRange, dateRange, end, histogramQuery, histogramQueryName, i, range, start;
        // generate the bin query values
        $scope.histogram = [];
        range = Math.ceil($scope.endDate - $scope.startDate);
        binRange = Math.ceil(range / $scope.histogramMaxBins);
        for (i=0;i<$scope.histogramMaxBins;i++) {
            start = Number($scope.startDate) + (binRange * i);
            end = start + binRange;
            bin = {};
            bin.start = start;
            bin.end = (end > $scope.endDate) ? $scope.endDate : end;
            bin.label = start + ' to ' + bin.end;
            bin.count = (10 * i) + 5; // a placeholder for testing -- the actual query count value should go here
            $scope.histogram.push(bin);
        }
        // generate the histogram queries
        for (i=0;i<$scope.histogram.length;i++) {
            bin = $scope.histogram[i];
            // create histogram query
            histogramQuery = SolrSearchService.createQuery();
            histogramQueryName = $scope.histogramQueryName + '_' + i;
            dateRange = $scope.getDateRangeConstraint($scope.startDateField, bin.start, $scope.endDateField, bin.end);
            histogramQuery.setOption('rows','0');
            histogramQuery.setQueryParameter('dateRange',dateRange);
            SolrSearchService.setQuery(histogramQueryName,histogramQuery);
            // listen for changes on the query
            $scope.$on(histogramQueryName, function(histogramQueryName) {
                $scope.handleHistogramQueryUpdate(histogramQueryName);
            });
            // update the query
            SolrSearchService.updateQuery(histogramQueryName);
        }
    };

    /**
     * Update the histogram chart.
     */
    $scope.updateHistogramChart = function() {
        var margin = {top:0, right:10, bottom:0, left:0};
        var height = $scope.histogramHeight - margin.top - margin.bottom;
        var width = $scope.histogramWidth - margin.left - margin.right;
        var formatPercent = d3.format('.0%');
        // remove any existing charts then create a new chart
        d3.select('#date-range-histogram').select('svg').remove();
        var svg = d3.select('#date-range-histogram').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        // define and configure the x and y scales
        var max = d3.max($scope.histogram, function(d) { return d.count; });
        var x = d3.scale.ordinal()
            .rangeBands([$scope.startYear, $scope.endYear]);
        var y = d3.scale.log()
            .domain([0,max])
            .rangeRound([0,height]);
        // define and configure the x and y axes
        d3.svg.axis()
            .scale(x)
            .orient('bottom');
        d3.svg.axis()
            .scale(y)
            .orient('left')
            .tickFormat(formatPercent);
        // the x domain is the start year to the end year
        x.domain([$scope.startYear, $scope.endYear]);
        // the y domain is 0 to the largest count value
        y.domain([0, max]);
        // define tooltip
        d3.select('body')
            .append('div')
            .style('background','white')
            .style('border','1px solid #ccc')
            .style('position', 'absolute')
            .style('z-index', '10')
            .style('visibility', 'hidden')
            .text('a simple tooltip');
        // draw the bar charts
        svg.selectAll('.bar')
            .data($scope.histogram)
            .enter()
            .append('rect')
            .attr('id',function (d,i) { return 'histogramBar_' + i;})
            .attr('class','bar')
            .attr('x', function(d, i) { return (i * (width + margin.left + margin.right) / $scope.histogramMaxBins); })
            .attr('width', ((width + margin.left + margin.right) / $scope.histogramMaxBins) - 1)
            .attr('y', function(d) { return height - (height * d.count / max); })
            .attr('height', function(d) { return height * d.count / max; })
            .on('click',function(d) {
                $scope.endDate = d.end;
                $scope.startDate = d.start;
                $scope.submit();
            });
        svg.selectAll('.bar')
            .data($scope.histogram)
            .exit()
            .remove();
    };

}]);
