/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Date range histogram controller. Renders a histogram chart of entities
 * by date.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 */
function DateRangeHistogramController($scope, SolrSearchService) {

    // the number of bins. this value should be kept below as low as possible
    // because each bin generates one query against the index
    $scope.bins = 10;

    $scope.data = [];                           // histogram data
    $scope.endDateField = 'endDate';            // facet field name
    $scope.endDateQueryName = 'endDate';        // end date query name
    $scope.endYear = 0;                         //
    $scope.max = 1;                             //
    $scope.min = 0;                             //
    $scope.queryname = 'histogramQuery';        // query base name
    $scope.startDateField = 'startDate';        // facet field name
    $scope.startDateQueryName = 'startDate';    // start date query name
    $scope.startYear = 0;
    $scope.target = 'defaultQuery';             // named query to filter
    $scope.totalBins = 0;

    //////////////////////////////////////////////////////////////////////////

    /**
     * Handle update on start, end dates.
     */
    $scope.handleDateRangeUpdate = function() {
    };

    /**
     * Initialize the controller.
     * @param StartYear {int} Start date
     * @param EndYear {int} End date
     */
    $scope.init = function(StartYear,EndYear) {
        $scope.startYear = StartYear;
        $scope.endYear = EndYear;
        // listen for updates on start and end dates
        $scope.$on(StartYear, function () {
            $scope.handleDateRangeUpdate();
        });
        $scope.$on(EndYear, function () {
            $scope.handleDateRangeUpdate();
        });
        // generate the bin query values
        var range = Math.ceil(EndYear - StartYear);
        var binRange = Math.ceil(range / $scope.bins);
        for (var i=0;i<$scope.bins;i++) {
            var start = StartYear + (binRange * i);
            var end = start + binRange - 1;
            var bin = {};
            bin['start'] = start;
            bin['end'] = end;
            bin['label'] = start + ' to ' + end;
            bin['count'] = (10 * i) + 5;
            $scope.data.push(bin);
        }
        if (end > EndYear) {
            bin['end'] = EndYear;
        }

        // generate the histogram queries
        for (var i in $scope.data) {
            var bin = $scope.data[i];
            var query = SolrSearchService.createQuery();
            // http://dev02.internal:8080/FACP_doc/select?q=*:*+(fromDate:%5B%201782-01-01T00:00:00Z%20TO%201900-12-31T00:00:00Z%20%5D%20OR%20toDate:%5B%201782-01-01T00:00:00Z%20TO%201900-12-31T00:00:00Z%20%5D)&rows=0&wt=json
            // http://dev02.internal:8080/FACP_doc/select?q=*:*+(fromDate:[ 1782-01-01T00:00:00Z TO 1900-12-31T00:00:00Z ] OR toDate:[ 1782-01-01T00:00:00Z TO 1900-12-31T00:00:00Z ])&rows=0&wt=json
            var startDateQuery = SolrSearchService.createQuery();
            startDateQuery.setOption("fl", $scope.startDateField);
            startDateQuery.setOption("rows","1");
            startDateQuery.setOption("sort",$scope.startDateField + " asc");
            startDateQuery.setOption("wt","json");

            SolrSearchService.setQuery(query,"histogramQuery" + i);
        }
        $scope.update();
    };

    /**
     * Update the display state.
     */
    $scope.update = function() {
        var margin = {top:0, right:0, bottom:0, left:0};
        var formatPercent = d3.format(".0%");
        var height = 60 - margin.top - margin.bottom;
        var width = 250 - margin.left - margin.right;
        // create the chart svg element
        var svg = d3.select("#date-range-histogram").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        // define and configure the x and y scales
        var x = d3.scale.ordinal()
            .rangeRoundBands([$scope.startYear, $scope.endYear], .1);
        var y = d3.scale.linear()
            .range([0,height]);
        // define and configure the x and y axes
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");
        // the x domain is the start year to the end year
        x.domain([$scope.startYear, $scope.endYear]);
        // the y domain is the max entity count per bin
        y.domain([0, d3.max($scope.data, function(d) { return d.count; })]);
        // draw the bar charts
        svg.selectAll(".bar")
            .data($scope.data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("style", "fill:steelblue")
            .attr("x", function(d, i) { return (i * 20) + 1; })
            .attr("width", "19")
            .attr("y", function(d) { return height - d.count })
            .attr("height", function(d) { return d.count; });

        // line at base of histogram
        svg.append("line")
            .attr("y1",height)
            .attr("y2",height)
            .attr("x1", 0)
            .attr("x2", width)
            .style("stroke", "#ccc");
    };

}

// inject controller dependencies
DateRangeHistogramController.$inject = ['$scope','SolrSearchService'];
