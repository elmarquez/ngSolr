/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Date facet controller filters a query by year range, displays controls to
 * set the start/end dates, displays a histogram control to both view and
 * filter date by year range.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 */
function DateFacetController($scope, SolrSearchService) {

    var year = new Date();

    $scope.dataMaxDate = 0;                         // latest date found in the result set
    $scope.dataMinDate = 0;                         // earliest date found in the result set
    $scope.endDate = 0;                             // end date
    $scope.endDateField = 'endDate';                // facet field name
    $scope.endDateQueryName = 'endDate';            // end date query name
    $scope.histogram = [];                          // histogram data
    $scope.histogramHeight = 100;
    $scope.histogramMaxBins = 10;                   // maximum number of histogram bins
    $scope.histogramQueryName = 'histogramQuery';   // histogram query name
    $scope.histogramWidth = 240;
    $scope.inclusive = true;                        // use inclusive search method if true, or exclusive if false
    $scope.startDate = 0;                           // start date
    $scope.startDateField = 'startDate';            // facet field name
    $scope.startDateQueryName = 'startDate';        // start date query name
    $scope.target = 'defaultQuery';                 // named query to filter
    $scope.updateFlag = 0;                          // flag used to track update process (-2 started, -1 partially done, 0 complete)
    $scope.updateHistogram = true;                  // update the histogram
    $scope.updateOnInit = false;                    // update the facet list during init
    $scope.updateOnTargetChange = true;             // update the date range to reflect the target query results

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
                var i = date.indexOf('-');
                return date.substring(0,i);
            }
        }
        return 0;
    }

    //////////////////////////////////////////////////////////////////////////

    /**
     * Build the Solr date range constraint string.
     * @param StartDateField
     * @param StartDate
     * @param EndDateField
     * @param EndDate
     */
    $scope.getDateRangeConstraint = function(StartDateField, StartDate, EndDateField, EndDate) {
        var yearStart = "-01-01T00:00:00Z";
        var yearEnd = "-12-31T00:00:00Z";
        var dateRange = '';
        if ($scope.inclusive === true) {
            // inclusive date constraint: +(startDateField:(startDate TO endDate) OR endDateField:(startDate TO endDate))
            dateRange += "+(";
            dateRange += StartDateField + ":[ " + StartDate + yearStart + " TO " + EndDate + yearEnd + " ]";
            dateRange += " OR ";
            dateRange += EndDateField + ":[ " + StartDate + yearStart + " TO " + EndDate + yearEnd + " ]";
            dateRange += ")";
        } else {
            // exclusive date constraint: +(startDateField:(startDate TO *) OR endDateField:(* TO endDate))
            dateRange += "+(";
            dateRange += StartDateField + ":[ " + StartDate + yearStart + " TO * ] AND ";
            dateRange += EndDateField + ":[ * TO " + EndDate + yearEnd + " ]";
            dateRange += ")";
        }
        return dateRange;
    };

    /**
     * Handle update on end date query.
     */
    $scope.handleEndDateQueryUpdate = function() {
        var endDateResults = SolrSearchService.getResponse($scope.endDateQueryName);
        if (endDateResults) {
            $scope.endDate = getFirstDateRecord(endDateResults,$scope.endDateField);
        }
        // update the histogram after start/end dates have been updated
        $scope.updateFlag++;
        if ($scope.updateHistogram && $scope.updateFlag == 0) {
            $scope.updateHistogram();
        }
    };

    /**
     * Handle update on the histogram query.
     */
    $scope.handleHistogramQueryUpdate = function(Event) {
        // get the bin number
        var i = Event.name.indexOf('_');
        var bin = Event.name.substring(i+1,Event.name.length);
        // set the bin value
        var query = SolrSearchService.getQuery(Event.name);
        var count = query.response.numFound;
        $scope.histogram[bin]['count'] = count;
        // update the chart
        $scope.updateHistogramChart();
    };

    /**
     * Update the start date field.
     */
    $scope.handleStartDateQueryUpdate = function() {
        var startDateResults = SolrSearchService.getResponse($scope.startDateQueryName);
        if (startDateResults) {
            $scope.startDate = getFirstDateRecord(startDateResults,$scope.startDateField);
        }
        // update the histogram after start/end dates have been updated
        $scope.updateFlag++;
        if ($scope.updateHistogram && $scope.updateFlag == 0) {
            $scope.updateHistogram();
        }
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
     * Initialize the controller. We create queries to determine the start and
     * end date values. Once we have both of those values in hand, we then
     * build a histogram of documents by date range.
     * @param StartDateField Start date field name
     * @param EndDateField End date field name
     */
    $scope.init = function() {
        // create query names for start/end queries
        $scope.startDateQueryName = $scope.startDateField + "Query";
        $scope.endDateQueryName = $scope.endDateField + "Query";
        // build a query that will fetch the earliest date in the list
        var startDateQuery = SolrSearchService.createQuery();
        startDateQuery.setOption("fl", $scope.startDateField);
        startDateQuery.setOption("rows","1");
        startDateQuery.setOption("sort",$scope.startDateField + " asc");
        startDateQuery.setOption("wt","json");
        SolrSearchService.setQuery($scope.startDateQueryName,startDateQuery);
        // build a query that will fetch the latest date in the list
        var endDateQuery = SolrSearchService.createQuery();
        endDateQuery.setOption("fl", $scope.endDateField);
        endDateQuery.setOption("rows","1");
        endDateQuery.setOption("sort",$scope.endDateField + " desc");
        endDateQuery.setOption("wt","json");
        SolrSearchService.setQuery($scope.endDateQueryName,endDateQuery);
        // listen for updates on queries
        $scope.$on($scope.startDateQueryName, function () {
            $scope.handleStartDateQueryUpdate();
        });
        $scope.$on($scope.endDateQueryName, function () {
            $scope.handleEndDateQueryUpdate();
        });
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the date list during init
        if ($scope.updateOnInit) {
            $scope.updateFlag = -2;
            SolrSearchService.updateQuery($scope.startDateQueryName);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
    };

    /**
     * Set the start and end date facet constraint. The start year must be
     * equal to or less than the end year.
     * @param $event
     * @param Start Start year
     * @param End End year
     */
    $scope.set = function($event,Start,End) {
        if (Start <= End) {
            $scope.startDate = Start;
            $scope.endDate = End;
            // update the queries
            $scope.updateFlag = -2;
            $scope.handleStartDateQueryUpdate();
            $scope.handleEndDateQueryUpdate();
        } else {
            console.log("WARNING: start date is greater than end date");
        }
    };

    /**
     * Set a date range constraint on the target query.
     */
    $scope.submit = function() {
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var dateRange = $scope.getDateRangeConstraint($scope.startDateField,$scope.startDate,$scope.endDateField,$scope.endDate);
            query.setQueryParameter("dateRange",dateRange);
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the histogram data.
     */
    $scope.updateHistogram = function () {
        // generate the bin query values
        $scope.histogram = [];
        var range = Math.ceil($scope.endDate - $scope.startDate);
        var binRange = Math.ceil(range / $scope.histogramMaxBins);
        for (var i=0;i<$scope.histogramMaxBins;i++) {
            var start = Number($scope.startDate) + (binRange * i);
            var end = start + binRange;
            var bin = {};
            bin['start'] = start;
            bin['end'] = (end > $scope.endDate) ? $scope.endDate : end;
            bin['label'] = start + ' to ' + bin['end'];
            bin['count'] = (10 * i) + 5; // a placeholder for testing -- the actual query count value should go here
            $scope.histogram.push(bin);
        }
        // generate the histogram queries
        for (var i=0;i<$scope.histogram.length;i++) {
            var bin = $scope.histogram[i];
            // create histogram query
            // http://dev02.internal:8080/FACP_doc/select?q=*:*+(fromDate:[ 1782-01-01T00:00:00Z TO 1900-12-31T00:00:00Z ] OR toDate:[ 1782-01-01T00:00:00Z TO 1900-12-31T00:00:00Z ])&rows=0&wt=json
            var histogramQuery = SolrSearchService.createQuery();
            var histogramQueryName = $scope.histogramQueryName + '_' + i;
            var dateRange = $scope.getDateRangeConstraint($scope.startDateField,bin['start'],$scope.endDateField,bin['end']);
            histogramQuery.setOption("rows","0");
            histogramQuery.setQueryParameter("dateRange",dateRange);
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
        var formatPercent = d3.format(".0%");
        // remove any existing charts then create a new chart
        d3.select("#date-range-histogram").select("svg").remove();
        var svg = d3.select("#date-range-histogram").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        // define and configure the x and y scales
        var max = d3.max($scope.histogram, function(d) { return d.count; });
        var x = d3.scale.ordinal()
            .rangeRoundBands([$scope.startYear, $scope.endYear], .1);
        var y = d3.scale.log()
            .rangeRound([0,max]);
        // define and configure the x and y axes
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(formatPercent);
        // the x domain is the start year to the end year
        x.domain([$scope.startYear, $scope.endYear]);
        // the y domain is 0 to the largest count value
        y.domain([0, max]);
        // draw the bar charts
        svg.selectAll(".bar")
            .data($scope.histogram)
            .enter()
            .append("rect")
            .attr("class","bar")
            .attr("style","fill:steelblue")
            .attr("x", function(d, i) { return (i * (width + margin.left + margin.right) / $scope.histogramMaxBins) })
            .attr("width", ((width + margin.left + margin.right) / $scope.histogramMaxBins) - 1)
            .attr("y", function(d) { return height - (height * d.count / max)})
            .attr("height", function(d) { return height * d.count / max; });
    };

}

// inject controller dependencies
DateFacetController.$inject = ['$scope','SolrSearchService'];
