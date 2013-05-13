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

    $scope.bins = 10;   // the number of bins
    $scope.data = [];   // histogram data
    $scope.max = 1;
    $scope.min = 0;
    $scope.queryname = 'histogramQuery';
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
            bin['val'] = 10;
            $scope.data.push(bin);
        }
        if (end > EndYear) {
            bin['end'] = EndYear;
        }
        // generate the histogram queries
        for (var i in $scope.data) {
            var bin = $scope.data[i];
            var query = SolrSearchService.createQuery();
            SolrSearchService.setQuery(query,"histogramQuery" + i);
        }
        $scope.update();
    };

    /**
     * Update the display state.
     */
    $scope.update = function() {
        var margin = {top:0, right:0, bottom:0, left:0};
        var width = 250 - margin.left - margin.right;
        var height = 60 - margin.top - margin.bottom;
        var formatPercent = d3.format(".0%");

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(formatPercent);

        var svg = d3.select("#date-range-histogram").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        for (var i in $scope.data) {
            var bin = $scope.data[i];

        }

        d3.tsv("data.tsv", function(error, data) {
            data.forEach(function(d) {
                d.frequency = +d.frequency;
            });

            x.domain(data.map(function(d) { return d.letter; }));
            y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

            x.domain(data.map(function(d) { return d.letter; }));
            y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("style", "fill:steelblue")
                .attr("x", function(d) { return x(d.label); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.value); })
                .attr("height", function(d) { return height - y(d.value); });
        });


    };

}

// inject controller dependencies
DateRangeHistogramController.$inject = ['$scope','SolrSearchService'];
