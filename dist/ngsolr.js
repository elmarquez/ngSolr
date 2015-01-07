/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Application                                                               */

var app = angular.module('solr-ajax',['ngRoute','Autocomplete','TextFilters','Solr','Utils']);

/**
 * Define application routes.
 * @see http://www.bennadel.com/blog/2420-Mapping-AngularJS-Routes-Onto-URL-Parameters-And-Client-Side-Events.htm
 */
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/:query', { event: '/query' }).
        otherwise({ event: '/' });
}]);
;

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
function DateFacetController($scope, $attrs, $location, $route, $routeParams, SolrSearchService, Utils) {

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

}

// inject controller dependencies
DateFacetController.$inject = ['$scope','$attrs','$location','$route','$routeParams','SolrSearchService','Utils'];
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* global d3 */
/* jshint loopfunc:true */
'use strict';

/*---------------------------------------------------------------------------*/
/* DateFacetHistogramController                                              */

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
function DateFacetHistogramController($scope, $attrs, $location, $log, $route, $routeParams, SolrSearchService, Utils) {

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

}

// inject controller dependencies
DateFacetHistogramController.$inject = ['$scope','$attrs','$location','$log','$route','$routeParams','SolrSearchService','Utils'];
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* DocumentSearchResultsController                                           */

/**
 * Presents search results for a named query.
 * @param $scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService
 * @param Utils
 */
function DocumentSearchResultsController($scope, $attrs, $location, $route, $routeParams, $window, SolrSearchService, Utils) {

    // document search results
    $scope.documents = [];

    // the number of search results to display per page
    $scope.documentsPerPage = 10;

    // flag for when the controller has submitted a query and is waiting on a
    // response
    $scope.loading = false;

    // the current search result page
    $scope.page = 0;

    // list of pages in the current navigation set
    $scope.pages = [];

    // the number of pages in a navigation set
    $scope.pagesPerSet = 10;

    // the query name
    $scope.queryName = SolrSearchService.defaultQueryName;

    // url to solr core
    $scope.source = undefined;

    // zero based document index for first record in the page
    $scope.start = 0;

    // count of the total number of result pages
    $scope.totalPages = 1;

    // count of the total number of search results
    $scope.totalResults = 0;

    // count of the number of search result sets
    $scope.totalSets = 1;

    // update the browser location on query change
    $scope.updateLocationOnChange = true;

    // user query
    $scope.userquery = '';

    ///////////////////////////////////////////////////////////////////////////

    /**
     * A page in a pagination list
     * @param Name Page name
     * @param Num Page number
     */
    function Page(Name,Num) {
        this.name = Name;
        this.number = Num;
        this.isCurrent = false;
    }

    /**
     * Set the results page number.
     * @param Start Index of starting document
     */
    $scope.handleSetPage = function(Start) {
        var query = SolrSearchService.getQuery($scope.queryName);
        query.setOption('start', Start * $scope.documentsPerPage);
        if ($scope.updateLocationOnChange) {
            var hash = query.getHash();
            $location.path(hash);
            $window.scrollTo(0, 0);
        } else {
            $scope.loading = true;
            SolrSearchService.updateQuery($scope.queryName);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        // clear current results
        $scope.documents = [];
        $scope.loading = false;
        // get new results
        var results = SolrSearchService.getResponse($scope.queryName);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.documentsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.documentsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                // add to result list
                $scope.documents.push(results.docs[i]);
            }
        } else {
            $scope.documents = [];
            $scope.totalResults = 0;
            $scope.totalPages = 1;
            $scope.totalSets = 1;
        }
        // update the page index
        $scope.updatePageIndex();
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                if (key === 'documentsPerPage' || key === 'pagesPerSet') {
                    $scope[key] = parseInt($attrs[key]);
                } else if ($attrs[key] === 'true' || $attrs[key] === 'false') {
                    $scope[key] = $attrs[key] === 'true';
                } else {
                    $scope[key] = $attrs[key];
                }
            }
        }
        // handle location change event, update query results
        $scope.$on('$routeChangeSuccess', function() {
            // if there is a query in the current location
            $scope.query = ($routeParams.query || '');
            if ($scope.query) {
                // reset state
                $scope.loading = false;
                // get the current query
                var query = SolrSearchService.getQueryFromHash($scope.query, $scope.source);
                // if there is a data source specified, override the default
                if ($scope.source) {
                    query.solr = $scope.source;
                }
                query.setOption('rows',$scope.documentsPerPage);
                // set the display values to match those in the query
                $scope.userquery = query.getUserQuery();
                // update query results
                SolrSearchService.setQuery($scope.queryName, query);
                $scope.loading = true;
                SolrSearchService.updateQuery($scope.queryName);
            }
        });
        // handle update events from the search service
        $scope.$on($scope.queryName, function () {
            $scope.handleUpdate();
        });
    };

    /**
     * Update page index for navigation of search results. Pages are presented
     * to the user and are one-based, rather than zero-based as the start
     * value is.
     */
    $scope.updatePageIndex = function() {
        var query = SolrSearchService.getQuery($scope.queryName);
        $scope.documentsPerPage = (query.getOption('rows') || $scope.documentsPerPage);
        $scope.page = (Math.ceil(query.getOption('start') / $scope.documentsPerPage) || 0);
        // the default page navigation set
        $scope.pages = [];
        // determine the current zero based page set
        var currentSet = Math.floor($scope.page / $scope.pagesPerSet);
        // determine the first and last page in the set
        var firstPageInSet = (currentSet * $scope.pagesPerSet) + 1;
        var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
        if (lastPageInSet > $scope.totalPages) {
            lastPageInSet = $scope.totalPages;
        }
        // link to previous set
        if ($scope.totalSets > 1 && currentSet !== 0) {
            var previousSet = firstPageInSet - $scope.pagesPerSet - 1;
            var prevPage = new Page('«', previousSet);
            $scope.pages.push(prevPage);
        }
        // page links
        for (var i=firstPageInSet; i<=lastPageInSet; i++) {
            var page = new Page(i, i-1);
            if (page.number === $scope.page) {
                page.isCurrent = true;
            }
            $scope.pages.push(page);
        }
        // link to next set
        if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
            var nextSet = lastPageInSet;
            var nextPage = new Page('»', nextSet);
            $scope.pages.push(nextPage);
        }
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService','Utils'];
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* FacetSelectionController                                                  */

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService Solr search service
 */
function FacetSelectionController($scope, $attrs, $location, $route, $routeParams, $window,  SolrSearchService) {

    var hash, key, query;

    // facets
    $scope.items = [];

    // URL to Solr core
    $scope.source = undefined;

    // target query name
    $scope.target = SolrSearchService.defaultQueryName;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet constraint from the target query.
     * @param Index Index of facet in the list
     */
    $scope.remove = function(Index) {
        query = SolrSearchService.getQuery($scope.target);
        query.removeFacetByIndex(Index);
        // change window location
        hash = query.getHash();
        $location.path(hash);
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        hash = ($routeParams.query || '');
        query = SolrSearchService.getQueryFromHash(hash, $scope.source);
        if (query) {
            $scope.items = query.getFacets();
        }
    };

    /**
     * Initialize the controller
     */
    $scope.init = function() {
        // apply configured attributes
        for (key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // update the list of facets on route change
        $scope.$on('$routeChangeSuccess', function() {
            $scope.handleUpdate();
        });
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService'];
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* jshint camelcase:false */
'use strict';

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
 * @param $window
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $attrs, $location, $route, $routeParams, $window, SolrSearchService) {

    var count, f, facet, facet_fields, facets, facet_query, hash, i, key, name, query, results, s, selected_values, value;

    // facet selections are mutually exclusive
    $scope.exclusive = true;

    // the name of the query used to retrieve the list of facet values
    $scope.facetQuery = 'facetQuery';

    // the list of facets
    $scope.facets = [];

    // the name of the field to facet
    $scope.field = '';

    // the list of facet values
    $scope.items = [];

    // the max number of items to display in the facet list
    $scope.maxItems = 7;

    // the name of the search query that we are faceting. we watch this query
    // to determine what to present in the facet list
    $scope.queryName = SolrSearchService.defaultQueryName;

    // a facet value from this set has been selected
    $scope.selected = false;

    // the url to the solr core
    $scope.source = undefined;

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
     * @param $event Event
     * @param Index Index of user selected facet. This facet will be added to
     * the search list.
     */
    $scope.add = function($event, Index) {
        // create a new facet
        query = SolrSearchService.getQuery($scope.queryName);
        if (query === undefined) {
            query = SolrSearchService.createQuery($scope.source);
        }
        name = $scope.field;
        // ISSUE #27 replace all space characters with * to ensure that Solr matches
        // on the space value
        value = '(' + $scope.items[Index].value.split(' ').join('*') + ')';
        facet = query.createFacet(name, value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) === -1) {
            query.addFacet(facet);
            // change window location
            hash = query.getHash();
            $location.path(hash);
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Handle update event. Get the query object then determine if there is a
     * facet query that corresponds with the field that this controller is
     * targeting.
     */
    $scope.handleUpdate = function() {
        // clear current results
        $scope.items = [];
        $scope.selected = false;
        selected_values = [];
        // get the starting query
        hash = ($routeParams.query || undefined);
        if (hash) {
            query = SolrSearchService.getQueryFromHash(hash, $scope.source);
        } else {
            query = SolrSearchService.createQuery($scope.source);
        }
        // if there is an existing query, find out if there is an existing
        // facet query corresponding to this controller's specified facet
        // field. if there is a match then set that value as selected in
        // our list
        facets = query.getFacets();
        for (i=0; i<facets.length; i++) {
            f = facets[i];
            if (f.field.indexOf($scope.field) > -1) {
                $scope.selected = true;
                s = f.value.replace(/([\(\[\)\]])+/g,'');
                selected_values.push(s);
                // break;
            }
        }
        // get the list of facets for the query
        facet_query = SolrSearchService.getQuery($scope.facetQuery);
        results = facet_query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // trim the result list to the maximum item count
            if (results.facet_fields[$scope.field].length > $scope.maxItems * 2) {
                facet_fields = results.facet_fields[$scope.field].splice(0,$scope.maxItems);
            } else {
                facet_fields = results.facet_fields[$scope.field];
            }
            // add facets to the item list if they have not already been
            // selected
            for (i=0; i< facet_fields.length; i+=2) {
                value = results.facet_fields[$scope.field][i];
                if (selected_values.indexOf(value) === -1) {
                    count = results.facet_fields[$scope.field][i+1];
                    facet = new FacetResult(value,count);
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
        for (key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // handle facet list updates
        $scope.facetQuery = $scope.field + 'Query';
        $scope.$on($scope.facetQuery, function () {
            $scope.handleUpdate();
        });
        // update the list of facets on route change
        $scope.$on('$routeChangeSuccess', function() {
            // create a query to get the list of facets
            hash = ($routeParams.query || undefined);
            if (hash) {
                query = SolrSearchService.getQueryFromHash(hash, $scope.source);
            } else {
                query = SolrSearchService.createQuery($scope.source);
            }
            query.setOption('facet', 'true');
            query.setOption('facet.field', $scope.field);
            query.setOption('facet.limit', $scope.maxItems);
            query.setOption('facet.mincount', '1');
            query.setOption('facet.sort', 'count');
            query.setOption('rows', '0');
            query.setOption('wt', 'json');
            SolrSearchService.setQuery($scope.facetQuery, query);
            SolrSearchService.updateQuery($scope.facetQuery);
        });
    };

    // initialize the controller
    $scope.init();

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService'];;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/**
 * Image based search controller. Present search results for a named query.
 *
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService Solr search service.
 */
function ImageSearchResultsController($scope, $attrs, $location, $route, $routeParams, $window, SolrSearchService) {

    // the number of items per page
    $scope.documentsPerPage = 16;

    // the number of items per row
    $scope.documentsPerRow = 4;

    // fields to retrieve from solr
    $scope.fields = '*';

    // flag for when the controller has submitted a query and is waiting on a
    // response
    $scope.loading = false;

    // the current search results page
    $scope.page = 0;

    // list of pages in the current navigation set
    $scope.pages = [];

    // the number of pages in a navigation set
    $scope.pagesPerSet = 10;

    // document search results
    $scope.rows = [];

    // the query name
    $scope.queryName = SolrSearchService.defaultQueryName;

    // url to solr core
    $scope.source = undefined;

    // zero based start page index
    $scope.startPage = 0;

    // count of the total number of result pages
    $scope.totalPages = 1;

    // count of the total number of result pages
    $scope.totalResults = 0;

    // count of the number of search result sets
    $scope.totalSets = 1;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * A page in a pagination list
     * @param Name Page name
     * @param Num Page number
     */
    function Page(Name,Num) {
        this.name = Name;
        this.number = Num;
        this.isCurrent = false;
    }

    /**
     * Set the results page number.
     * @param Start
     */
    $scope.handleSetPage = function(Start) {
        var query = SolrSearchService.getQuery($scope.queryName);
        query.setOption('start', Start * $scope.documentsPerPage);
        var hash = query.getHash();
        $location.path(hash);
        $window.scrollTo(0, 0);
    };

    /**
     * Handle update on image search results.
     */
    $scope.handleUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryName);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.documentsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.documentsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.documentsPerRow || i===results.docs.length - 1) {
                    count = 0;
                    $scope.rows.push(row);
                    row = [];
                }
            }
        } else {
            $scope.rows = [];
            $scope.totalResults = 0;
            $scope.totalPages = 1;
            $scope.totalSets = 1;
        }
        // update the page index
        $scope.updatePageIndex();
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                if (key === 'documentsPerPage' || key === 'documentsPerRow' || key === 'pagesPerSet') {
                    $scope[key] = parseInt($attrs[key]);
                } else if ($attrs[key] === 'true' || $attrs[key] === 'false') {
                    $scope[key] = $attrs[key] === 'true';
                } else {
                    $scope[key] = $attrs[key];
                }
            }
        }
        // handle update events from the search service
        $scope.$on($scope.queryName, function () {
            $scope.handleUpdate();
        });
        // handle location change event, update query results
        $scope.$on('$routeChangeSuccess', function() {
            // if there is a query in the current location
            $scope.query = ($routeParams.query || '');
            if ($scope.query) {
                // get the current query
                var query = SolrSearchService.getQueryFromHash($scope.query, $scope.source);
                // if there is a data source specified, override the default
                if ($scope.source) {
                    query.solr = $scope.source;
                }
                // set the display values to match those in the query
                $scope.documentsPerPage = (query.getOption('rows') || 10);
                $scope.page = (Math.ceil(query.getOption('start') / $scope.documentsPerPage) || 0);
                $scope.userquery = query.getUserQuery();
                // update results
                SolrSearchService.setQuery($scope.queryName, query);
                SolrSearchService.updateQuery($scope.queryName);
            }
        });
    };

    /**
     * Update page index for navigation of search results. Pages are presented
     * to the user and are one-based, rather than zero-based as the start
     * value is.
     */
    $scope.updatePageIndex = function() {
        // the default page navigation set
        $scope.pages = [];
        // determine the current zero based page set
        var currentSet = Math.floor($scope.page / $scope.pagesPerSet);
        // determine the first and last page in the set
        var firstPageInSet = (currentSet * $scope.pagesPerSet) + 1;
        var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
        if (lastPageInSet > $scope.totalPages) {
            lastPageInSet = $scope.totalPages;
        }
        // link to previous set
        if ($scope.totalSets > 1 && currentSet !== 0) {
            var previousSet = firstPageInSet - $scope.pagesPerSet - 1;
            var prevPage = new Page('«', previousSet);
            $scope.pages.push(prevPage);
        }
        // page links
        for (var i=firstPageInSet;i<=lastPageInSet;i++) {
            var page = new Page(i,i-1);
            if (page.number===$scope.page) {
                page.isCurrent = true;
            }
            $scope.pages.push(page);
        }
        // link to next set
        if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
            var nextSet = lastPageInSet;
            var nextPage = new Page('»', nextSet);
            $scope.pages.push(nextPage);
        }
    };

    // initialize the controller
    $scope.init();

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService'];;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

/* global OverlappingMarkerSpiderfier, google */
/* jshint camelcase:false */
'use strict';

/*---------------------------------------------------------------------------*/
/* MapController                                                             */

/**
 * Display a map of search results for documents with location attributes.
 * Unlike other controllers, the map controller tries to display all search
 * results at once. The map controller listens for updates on a specified
 * target query. When an update occurs, the map query duplicates the query
 * but sets the number of rows to $scope.count (a very large number) so that
 * it can show as many documents as possible.
 *
 * @param $scope
 * @oaram $attrs
 * @param $location
 * @param $log Log service
 * @param $route
 * @param $routeParams
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 */
function MapController($scope, $attrs, $location, $log, $route, $routeParams, SolrSearchService, SelectionSetService, Utils) {

    var i, lat, lng;

    $scope.categoryToIconMap = {
        default:'img/icon/house.png',
        corporateBody:'img/icon/corporatebody.png',
        government:'img/icon/corporatebody.png',
        organization:'img/icon/corporatebody.png',
        person:'img/icon/person.png'
    };
    $scope.centerOnStart = true;        // center the map on the start location
    $scope.clusterManager = null;       // clustering marker manager
    $scope.clusterOptions = {
        styles: [
            { height: 24, url: 'img/map/cluster1.png', width: 24 },
            { height: 36, url: 'img/map/cluster2.png', width: 36 },
            { height: 48, url: 'img/map/cluster3.png', width: 48 },
            { height: 64, url: 'img/map/cluster4.png', width: 64 },
            { height: 82, url: 'img/map/cluster5.png', width: 82 }
        ]};
    $scope.clusterResults = true;       // use cluster manager
    $scope.count = 5000;                // the total number of records
    $scope.fields = '*';                // field to fetch from solr
    $scope.firstUpdate = true;          // flag to
    $scope.idToMarkerMap = {};          // id to marker map
    $scope.infoWindow = new google.maps.InfoWindow(); // google map info window
    $scope.loading = false;             // results loading flag
    $scope.map = undefined;             // google map
    $scope.markers = [];                // list of markers
    $scope.maxFieldLength = 120;        // maximum length of text fields in infowindow
    $scope.queryName = 'mapQuery';      // name of the query
                                        // map settings
    $scope.settings = {
        // center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl: false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        navigationControl: true,
        navigationControlOptions: {
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions: {
            style:google.maps.ZoomControlStyle.LARGE
        }
    };
    $scope.showMessages = true;         // show info messages window
    $scope.showErrors = true;           // show error messages window
    $scope.source = undefined;          // url to solr core
    $scope.startLatitude = undefined;   // on start, center the map on latitude
    $scope.startLongitude = undefined;  // on start, center the map on longitude
    $scope.target = 'defaultQuery';     // query to monitor

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Create a default map query. There is no way to tell Solr to return ALL
     * records, consequently we need to either tell it to return a very large
     * number of records or we need to tell it to return exactly the number of
     * records that are available. There is no processing required if we just
     * ask for a really large number of documents, so we'll do that here.
     */
    $scope.createMapQuery = function() {
        var query = SolrSearchService.createQuery();
        query.setOption('fl', $scope.fields);
        query.setOption('rows', $scope.count);
        query.addQueryParameter('+location_0_coordinate:*');
        return query;
    };

    /**
     * Get a map marker.
     * @param Map Map
     * @param Title Tooltip label
     * @param Content Popup window HTML content
     * @param Category Item category
     * @param Lat Latitude
     * @param Lng Longitude
     */
    $scope.getMarker = function(Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = $scope.categoryToIconMap['default'];
        if (Category !== null && Category in $scope.categoryToIconMap) {
            icon = $scope.categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title,
            content: Content
        });
        // attach an info window to the marker
        // $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Get the map marker InfoWindow content.
     * @param Item
     * @returns {String} HTML content for map InfoWindow
     */
    $scope.getMarkerContent = function(Item) {
        var content = '<div class="infowindow">';
        if (Item.dobj_proxy_small) {
            content += '<div class="thumb"><a href="' + Item.presentation_url + '">' + '<img src="' + Item.dobj_proxy_small + '" />' + '</a></div>';
        }
        content += '<div class="title"><a href="' + Item.presentation_url + '">' + Item.title + '</a></div>';
        content += '<div class="existdates">' + Utils.formatDate(Item.fromDate) + ' - ' + Utils.formatDate(Item.toDate) + '</div>';
        // content +=  '<div class='type'>' + item.type + '</div>';
        content += '<div class="summary">' + Utils.truncate(Item.abstract,$scope.maxFieldLength) + ' ';
        content += '<a href="' + Item.presentation_url + '" class="more">more</a>' + '</div>';
        content += '</div>' ;
        return content;
    };

    /**
     * Handle selection events. The selection set service can hold either
     * single or multiple values. However, here we show only a single info
     * window in the current implementation.
     * @todo enable multiple selection .. ie. multiple infowindows
     */
    $scope.handleSelection = function() {
        $log.info('Map selection updated');
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
            var keys = [];
            for (var key in selected) {
                if (selected.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            // get the first key only
            if (keys.length > 0) {
                var id = keys[0];
                var marker = $scope.idToMarkerMap[id];
                if (marker) {
                    var bounds = new google.maps.LatLngBounds();
                    bounds.extend(marker.position);
                    // $scope.map.setCenter(bounds.getCenter());
                    // $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                    // center the map on the results
                    $scope.map.fitBounds(bounds);
                }
            }
        }
    };

    /**
     * Handle update to map search results. Clear the existing collection of
     * map markers and add new map markers to the map. Center and zoom the
     * view to fit the new collection of markers.
     */
    $scope.handleUpdate = function() {
        var bounds = new google.maps.LatLngBounds();
        var results = SolrSearchService.getResponse($scope.queryName);
        if (results && results.docs) {
            for (i=0; i<results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // ISSUE: Solr4 returns an array rather than a string for coordinate values
                    if (typeof item.location_0_coordinate === 'string') {
                        lat = item.location_0_coordinate;
                    } else {
                        lat = item.location_0_coordinate[0];
                    }
                    if (typeof item.location_1_coordinate === 'string') {
                        lng = item.location_1_coordinate;
                    } else {
                        lng = item.location_1_coordinate[0];
                    }
                    var content = $scope.getMarkerContent(item);
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    $scope.idToMarkerMap[item.id] = marker;
                    $scope.markers.push(marker);
                    $scope.oms.addMarker(marker);
                    bounds.extend(marker.position);
                }
            }
        }
        // add markers to cluster manager
//        if ($scope.clusterResults) {
//            $scope.clusterManager.addMarkers($scope.markers);
//        }
        $scope.map.fitBounds(bounds);
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        Utils.applyAttributes($attrs, $scope);
        // create map, marker cluster manager. add event handlers for infowindow
        $scope.map = new google.maps.Map(document.getElementById('map'), $scope.settings);
        $scope.oms = new OverlappingMarkerSpiderfier($scope.map);
        $scope.oms.addListener('click', function(Marker) {
            $scope.infoWindow.close();
            $scope.infoWindow.setContent(Marker.content);
            $scope.infoWindow.open($scope.map, Marker);
        });
        // $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);
//        google.maps.event.addListener($scope.infoWindow, 'close', function() {
//            $scope.infoWindow.close();
//        });
        // handle updates on the query
        $scope.$on($scope.queryName, function() {
            $scope.handleUpdate();
        });
        // handle update on the selection set
        $scope.$on('selectionSetUpdate', function() {
            $scope.handleSelection();
        });
        // handle location change event, update query results
        $scope.$on('$routeChangeSuccess', function() {
            // if there is a query in the current location
            $scope.query = ($routeParams.query || '');
            if ($scope.query) {
                // reset state
                $scope.loading = false;
                // get the current query
                var query = SolrSearchService.getQueryFromHash($scope.query, $scope.source);
                // if there is a data source specified, override the default
                if ($scope.source) {
                    query.solr = $scope.source;
                }
                // make sure that the infowindow is closed
                $scope.infoWindow.close();
                // clear current markers
                $scope.idToMarkerMap = {};
                // $scope.clusterManager.clearMarkers();
                $scope.markers = [];
                // update query results
                SolrSearchService.setQuery($scope.queryName, query);
                $scope.loading = true;
                SolrSearchService.updateQuery($scope.queryName);
//                $scope.oms.addListener('spiderfy', function(markers) {
//                    $scope.infoWindow.close();
//                });
            }
        });
        // draw the map for the first time
        if ($scope.startLatitude && $scope.startLongitude) {
            var point = new google.maps.LatLng($scope.startLatitude, $scope.startLongitude);
            $scope.map.setCenter(point, 8);
        } else {
            var bounds = new google.maps.LatLngBounds();
            $scope.map.fitBounds(bounds);
        }
    };

    /**
     * Add info window to marker.
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function(Map, Marker, Content) {
        $scope.oms.addListener('click', function(Marker) {
            $scope.infoWindow.close();
            $scope.infoWindow.setContent(Content);
            $scope.infoWindow.open(Map, Marker);
        });
    };

    // initialize the controller
    $scope.init();

}

// inject dependencies
MapController.$inject = ['$scope','$attrs','$location','$log','$route','$routeParams','SolrSearchService','SelectionSetService','Utils'];;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* MapSelectionController                                                       */

/**
 * Map selection controller.
 * @param $scope
 * @param $attrs
 * @param $log Log service
 * @param SelectionSetService
 */
function MapSelectionController($scope, $attrs, $log, SelectionSetService) {

    // allow only a single item to be selected at a time
    $scope.singleSelection = true;

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        try {
            SelectionSetService.remove(Id);
            SelectionSetService.clear();
        } catch (err) {
            $log.info(err.message);
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
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        if ($scope.singleSelection) {
            SelectionSetService.clearSilent();
        }
        SelectionSetService.add(Id,null);
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
MapSelectionController.$inject = ['$scope','$attrs','$log','SelectionSetService'];
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* jshint camelcase:false */
'use strict';

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param $attrs
 * @param $location
 * @param $route
 * @param $routeParams
 * @param $window
 * @param SolrSearchService
 * @param Utils Utility
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, $attrs, $location, $route, $routeParams, $window, SolrSearchService, Utils) {

    var hash, hintlist, i, item, key, query, result, results, token, trimmed;

    // the complete list of search hints
    $scope.hints = [];

    // the subset of hints displayed to the user
    // @todo is this actually used??
    $scope.hintlist = [];

    // the maximum number of hints to display at any moment
    $scope.maxHints = 10;

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    $scope.minSearchLength = 3;

    // find near matches to the user query
    $scope.nearMatch = false;

    // the name of the main query
    $scope.queryName = SolrSearchService.defaultQueryName;

    // when the user submits the query, redirect to the specified URL, with the
    // query appended, to render the results
    $scope.redirect = undefined;

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'hints';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = 'searchHintsQuery';

    // url to solr core
    $scope.source = undefined;

    // the query string provided by the user
    $scope.userquery = '';

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Get the list of matching hints.
     */
    $scope.getHintList = function() {
        $scope.hintlist = $scope.hints.splice(0,10);
    };

    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        hintlist = [];
        if ($scope.userquery.length >= $scope.minSearchLength) {
            for (i=0;i<$scope.hints.length, hintlist.length<$scope.maxHints;i++) {
                token = $scope.hints[i];
                try {
                    if (token.indexOf($scope.userquery) > -1) {
                        hintlist.push(token);
                    }
                } catch (err) {
                    continue;
                }
            }
        }
        return hintlist;
    };

    /**
     * Handle submit click event. Construct a valid Solr query URL from the
     * user input data, then execute a GET call with that URL.
     */
    $scope.handleSubmit = function() {
        // clean up the user query
        trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = '*:*';
        }
        // build the query string
        query = SolrSearchService.getQuery($scope.queryName);
        if (query === undefined) {
            query = SolrSearchService.createQuery($scope.source);
        }
        query.setNearMatch($scope.nearMatch);
        query.setUserQuery($scope.userquery);
        // update the window location
        hash = query.getHash();
        if ($scope.redirect) {
            $window.location.href = $scope.redirect + '#' + hash;
        } else {
            $location.path(hash);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        query = SolrSearchService.getQuery($scope.searchHintsQuery);
        results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (i=0;i<result.length;i+=2) {
                    item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                if (key === 'documentsPerPage' || key === 'pagesPerSet') {
                    $scope[key] = parseInt($attrs[key]);
                } else if ($attrs[key] === 'true' || $attrs[key] === 'false') {
                    $scope[key] = $attrs[key] === 'true';
                } else {
                    $scope[key] = $attrs[key];
                }
            }
        }
        // handle location change event, update query value
        $scope.$on('$routeChangeSuccess', function() {
            hash = ($routeParams.query || '');
            if (hash !== '') {
                query = SolrSearchService.getQueryFromHash(hash, $scope.source);
                $scope.userquery = query.getUserQuery();
            } else {
                $scope.userquery = hash;
            }
        });
        // create a query to fetch the list of search hints
        query = SolrSearchService.createQuery($scope.source);
        query.setOption('rows', '0');
        query.setOption('facet', 'true');
        query.setOption('facet.limit', '-1');
        query.setOption('facet.field', $scope.searchHintsField);
        SolrSearchService.setQuery($scope.searchHintsQuery,query);
        // handle update events on the hints query
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleUpdate();
        });
        // update the hints query
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','$attrs','$location','$route','$routeParams','$window','SolrSearchService','Utils'];
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 */
function SearchHistoryController($scope, $attrs, SolrSearchService) {

    var key, newquery, query;

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
        // Handle update events from the search service.
        $scope.$on($scope.queryName, function() {
            $scope.handleUpdate();
        });
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        // get the new query
        newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new user query is different from the last one, add it to
            // the top of the queue
            if (newquery.getUserQuery() !== $scope.queries[0].getUserQuery()) {
                $scope.queries.unshift(newquery);
                // if there are more than maxItems in the list, remove the first item
                if ($scope.queries.length > $scope.maxItems) {
                    $scope.queries.pop();
                }
            }
        } else {
            $scope.queries = [];
            $scope.queries.push(newquery);
        }
    };

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.setQuery = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
SearchHistoryController.$inject = ['$scope', '$attrs', 'SolrSearchService'];
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* global $ */
'use strict';

/**
 * Directive to add JQuery UI AutoComplete to element
 * @see http://jqueryui.com/autocomplete/
 */
angular
    .module('ngSolr')
    .directive('searchhints', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                element.autocomplete({
                    delay: 500,
                    minLength: 3,
                    source: function(request, response) {
                        var results = $.ui.autocomplete.filter(scope.hints, request.term);
                        response(results.slice(0, 10));
                    }
                });
            }
        };
    })

    /**
     * searchbox attribute provides a JQuery UI based autocomplete, search hints
     * drop down box. The box is populated with search hints from the parent
     * searchbox element scope.
     */
    .directive('searchbox', function() {
        return {
            link: function(scope, element) {
                // update the user query
                element.bind('keyup', function(event) {
                    if (event.keyCode === 13) {
                        // enter key: submit query
                        if (scope.userquery !== '') {
                            scope.handleSubmit(scope.userquery);
                        }
                    } else {
                        // all other keys: update user query
                        scope.userquery = event.target.value;
                    }
               });
                // display autocomplete hints
                element.autocomplete({
                    delay: 500,
                    minLength: 3,
                    source: function(request, response) {
                        // @todo execute a query against the index on the fly
                        var results = $.ui.autocomplete.filter(scope.hints, request.term);
                        response(results.slice(0, 10));
                    }
                });
            },
            restrict: 'A',
            scope: false
        };
    })

    /**
     * searchbutton attribute attaches a click handler to the button element that
     * calls the searchbox parent scope submit() method.
     */
    .directive('searchbutton', function() {
        return {
            link: function(scope, element) {
                element.bind('click', function() {
                    if (scope.userquery !== '') {
                        scope.handleSubmit(scope.userquery);
                    }
                });
            },
            restrict: 'A',
            scope: false
        };
    });
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* jshint camelcase:false */
'use strict';

/**
 * Search box provides an input for user queries, provides search hints related
 * to the user's current query entry, and constructs a query URL. By default,
 * the search box will update the current location when executing a query.
 * It can optionally be configured to redirect the user agent to another URL
 * for rendering of results.
 */
angular
    .module('ngSolr')
    .directive('searchbox',
        ['$location','$log','$routeParams','$timeout','$window','SolrSearchService','Utils',
        function ($location, $log, $routeParams, $timeout, $window, SolrSearchService, Utils) {
            return {
                link: function (scope, element, attrs) {

                    var KEY_ENTER = '13';
                    var KEY_ESCAPE = '27';
                    var KEY_ARROW_UP = '38';
                    var KEY_ARROW_DOWN = '40';

                    // flag for when the search box has focus and the search hints
                    // list should be displayed to the user
                    scope.showHints = false;

                    // the complete list of search hints
                    scope.hints = [];

                    // the maximum number of hints to display at any moment
                    scope.maxHints = 10;

                    // instructional message to aid the user in constructing a query
                    scope.messages = [
                        'Enter one or more search terms. Press Enter to search.',
                        'Key up or down to navigate hints. Press Enter to search.',
                        'Press Enter to search.'
                    ];
                    scope.message = scope.messages[0];

                    // the minimum number characters that the user should enter before the list
                    // of search hints is displayed
                    scope.minSearchLength = 3;

                    // find near matches to the user query
                    scope.nearMatch = false;

                    // input field place holder value
                    scope.placeHolder = 'Keyword or place name';

                    // once the user has provided the minimum number of characters to start
                    // the query process, we start a clock
                    scope.queryBuffer = [];

                    // when the user submits the query, redirect to the specified URL, with the
                    // query appended, to render the results
                    scope.redirect = undefined;

                    // If true, when a user enters a new query string, the target query will be
                    // replaced with a new query and the user query property will be set, If
                    // false, only the user query and start properties will be changed and the
                    // query results will be reloaded.
                    scope.resetOnChange = false;

                    // the field name where search hints are taken from
                    scope.searchHintsField = 'hints';

                    // the name of the query that returns the list of search hints
                    scope.searchHintsQuery = 'hintsQuery';

                    // index of the selected hint
                    scope.selectedHint = -1;

                    // flag to control display of instructional message
                    scope.showMessage = true;

                    // url to solr core
                    scope.source = undefined;

                    // timeout to track
                    scope.timeout = undefined;

                    // the query string provided by the user
                    scope.userQuery = '';

                    ///////////////////////////////////////////////////////////////////////////

                    /**
                     * Clear the current hint selection.
                     */
                    scope.clearHintSelection = function () {
                        if (scope.selectedHint !== -1) {
                            var hint = scope.hints[scope.selectedHint];
                            hint.selected = false;
                        }
                    };

                    /**
                     * Handle route change event.
                     */
                    scope.handleRouteChange = function () {
                        var hash = ($routeParams.query || '');
                        if (hash !== '') {
                            var query = SolrSearchService.getQueryFromHash(hash, scope.source);
                            scope.userQuery = query.getUserQuery();
                        } else {
                            scope.userQuery = hash;
                        }
                    };

                    /**
                     * Handle submit click event. Construct a valid Solr query URL from the
                     * user input data, then execute a GET call with that URL.
                     */
                    scope.handleSubmit = function () {
                        // clean up the user query
                        var trimmed = Utils.trim(scope.userQuery);
                        if (trimmed === '') {
                            scope.userQuery = '*:*';
                        }
                        // build the query string
                        var query = SolrSearchService.getQuery(scope.queryName);
                        if (query === undefined) {
                            query = SolrSearchService.createQuery(scope.source);
                        }
                        query.setNearMatch(scope.nearMatch);
                        query.setUserQuery(scope.userQuery);
                        // update the window location
                        var hash = query.getHash();
                        if (scope.redirect) {
                            $window.location.href = scope.redirect + '#' + hash;
                        } else {
                            $location.path(hash);
                        }
                    };

                    /**
                     * Update the controller state.
                     */
                    scope.handleUpdate = function () {
                        scope.message = scope.messages[1];
                        var query = SolrSearchService.getQuery(scope.searchHintsQuery);
                        var results = query.getFacetCounts();
                        if (results && results.hasOwnProperty('facet_fields')) {
                            scope.hints = [];
                            var result = results.facet_fields[scope.searchHintsField];
                            if (result) {
                                for (var i = 0; i < result.length; i += 2) {
                                    var hint = {
                                        title: result[i],
                                        selected: false
                                    };
                                    scope.hints.push(hint);
                                }
                            }
                        }
                    };

                    /**
                     * Highlight the selected index.
                     * @param index
                     */
                    scope.highlightHint = function (index) {
                        var hint = scope.hints[index];
                        hint.selected = true;
                        scope.$apply();
                    };

                    /**
                     * Clear the hint selection then reset the hint list and
                     * selection index.
                     */
                    scope.resetHintSelection = function() {
                        scope.clearHintSelection();
                        scope.selectedHint = -1;
                        scope.hints = [];
                        scope.message = scope.messages[0];
                    };

                    /**
                     * Initialize the controller.
                     */
                    scope.init = function () {
                        // apply configured attributes
                        for (var key in attrs) {
                            if (scope.hasOwnProperty(key)) {
                                if (key === 'documentsPerPage' || key === 'pagesPerSet') {
                                    scope[key] = parseInt(attrs[key]);
                                } else if (attrs[key] === 'true' || attrs[key] === 'false') {
                                    scope[key] = attrs[key] === 'true';
                                } else {
                                    scope[key] = attrs[key];
                                }
                            }
                        }
                        // get the search box DOM elements
                        var children = element.children();
                        scope.form_div = children[0];
                        scope.query_input = scope.form_div.querySelector('#query');
                        scope.hints_div = scope.form_div.querySelector('#hints');
                        scope.hints_list = scope.form_div.querySelector('#list');
                        scope.hints_message = scope.form_div.querySelector('#message');
                        // attach event listeners to the query input
                        scope.query_input.onfocus = scope.onfocus;
                        scope.query_input.onblur = scope.onblur;
                        scope.query_input.onkeyup = scope.onkeyup;
                        // handle location change event, update query value
                        scope.$on('$routeChangeSuccess', function() { scope.handleRouteChange(); });
                        // handle update events on the hints query
                        scope.$on(scope.searchHintsQuery, scope.handleUpdate);
                    };

                    /**
                     * Handle search box input blur event. Deselect any selected
                     * hints then update the user interface.
                     */
                    scope.onblur = function () {
                        scope.showHints = false;
                        scope.resetHintSelection();
                        scope.$apply();
                    };

                    /**
                     * Handle search box input focus event. When the search
                     * box has focus then size and display the search hints
                     * DIV.
                     */
                    scope.onfocus = function () {
                        // set the width of the div to be equal to the input box
                        // subtract the width of the #hints border
                        var width = scope.query_input.offsetWidth - 2;
                        scope.hints_div.setAttribute('style', 'width:' + width + 'px');
                        scope.showHints = true;
                        scope.$apply();
                    };

                    /**
                     * Handle user data entry on input field.
                     * @param event
                     */
                    scope.onkeyup = function (event) {
                        scope.showHints = true;
                        if (event.keyCode === KEY_ENTER) {
                            if (scope.selectedHint !== -1) {
                                scope.selectHint(scope.selectedHint);
                            }
                            scope.handleSubmit();
                            scope.onblur();
                        }
                        else if (event.keyCode === KEY_ESCAPE) {
                            scope.showHints = false;
                            scope.resetHintSelection();
                            scope.$apply();
                        }
                        else if (event.keyCode === KEY_ARROW_UP) {
                            scope.clearHintSelection();
                            if (scope.selectedHint < 1) {
                                scope.selectedHint = scope.hints.length - 1;
                            } else {
                                scope.selectedHint -= 1;
                            }
                            scope.highlightHint(scope.selectedHint);
                        }
                        else if (event.keyCode === KEY_ARROW_DOWN) {
                            scope.clearHintSelection();
                            if (scope.selectedHint < scope.hints.length - 1) {
                                scope.selectedHint += 1;
                            } else {
                                scope.selectedHint = 0;
                            }
                            scope.highlightHint(scope.selectedHint);
                        }
                        // if the current query meets the minimum requirements,
                        // get the list of search hints
                        else if (scope.userQuery.length >= scope.minSearchLength) {
                            if (scope.timeout) {
                                $timeout.cancel(scope.timeout);
                            }
                            scope.timeout = $timeout(function () {
                                var query = SolrSearchService.createQuery(scope.source);
                                query.setOption('rows', '0');
                                query.setOption('facet', 'true');
                                query.setOption('facet.limit', scope.maxHints);
                                query.setOption('facet.field', scope.searchHintsField);
                                query.setNearMatch(scope.nearMatch);
                                query.setUserQuery(scope.userQuery);
                                SolrSearchService.setQuery(scope.searchHintsQuery, query);
                                SolrSearchService.updateQuery(scope.searchHintsQuery);
                            }, 350);
                        }
                    };

                    /**
                     * Select the specified hint by its index in the hints array.
                     * @param index
                     */
                    scope.selectHint = function (index) {
                        var hint = scope.hints[index];
                        scope.userQuery = hint.title;
                    };

                    // initialize the controller
                    scope.init();

                },
                replace: false,
                restrict: 'E',
                scope: {
                    showHints: '&',
                    nearMatch: '@',
                    placeHolder: '@',
                    queryName: '@',
                    searchHintsField: '@',
                    source: '@'
                },
                // @todo consider baking the template into the directive instead of using an external file
                templateUrl: 'js/solr-ajax/directives/searchbox.html',
                transclude: true
            };
        }]
);
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

angular
    .module('ngSolr')
    .filter('cleanFacetLabel', function() {
        /**
         * Remove punctuation and escaped chars from facet name.
         * @param text
         * @return {String} Substitution text
         */
        return function(text) {
            // ISSUE #28 remove all replacement characters
            var val = text.split('(').join('');
            val = val.split(')').join('');
            val = val.split('[').join('');
            val = val.split(']').join('');
            val = val.split('*').join(' ');
            val = val.split('%2A').join(' ');
            val = val.split('?').join(' ');
            val = val.split('%3F').join(' ');
            return val;
        };
    })
    .filter('prettyFacetLabel', function() {
        /**
         * Clean up the facet label so that its more readily legible to the user.
         * @param facet
         * @return {String} Substitution text
         */
        return function(facet) {
            // convert field name from camel case to sentence case
            var result = facet.field.replace(/([A-Z])/g, ' $1');
            var label = result.charAt(0).toUpperCase() + result.slice(1);
            // ISSUE #28 clean up the value text, remove all replacement characters
            var val = facet.value.split('(').join('');
            val = val.split(')').join('');
            val = val.split('[').join('');
            val = val.split(']').join('');
            val = val.split('*').join(' ');
            val = val.split('%2A').join(' ');
            val = val.split('?').join(' ');
            val = val.split('%3F').join(' ');
            val = val.replace(' TO ','');
            val = val.replace('-01-01T00:00:00Z','');
            val = val.replace('-12-31T23:59:59Z','');
            return label + ': ' + val;
        };
    })
    .filter('strip', function() {
        /**
         * Strip the leading month value from a date.
         * @param text
         * @return {String} Year value
         */
        return function(text) {
            if (text === undefined) { return text; }
            var i = text.indexOf(', ');
            if (i !== -1) {
                return text.substring(i + 2);
            }
            return text;
        };
    })
    .filter('substitute', function() {
        /**
         * Return the substitution text for the specified key.
         * @param text
         * @return {String} Substitution text
         */
        var map = {
            'ACT':'Australian Capital Territory',
            'NSW':'New South Wales',
            'NA': 'Australia',
            'NT': 'Northern Territory',
            'QLD':'Queensland',
            'SA': 'South Australia',
            'TAS':'Tasmania',
            'VIC':'Victoria',
            'WA': 'Western Australia'
        };
        return function(text) {
            if (text in map) {
                return map[text];
            }
            return text;
        };
    })
    .filter('swapFacetLabels', function() {
        /**
         * Update presentation of facet labels to improve user recognition of their
         * meanings.
         * @see ISSUE #29 - The date range filter matches on those entities that
         * exist within a specified time period. TheSolr query that matches those
         * entities has an unintuitive reversal of the fromDate and toDate query
         * components, This filter reverses the fromDate/toDate labels in the
         * presentation layer so that the user sees these facets appear in the way
         * they would understand the query intuitively.
         * @see ISSUE #305 - Substitute 'Localtype' with 'Type' in facet label
         */
        return function(label) {
            if (label.indexOf('fromDate') === 0) {
                label = 'toDate' + label.substring(8);
            } else if (label.indexOf('From Date') === 0) {
                label = 'To Date' + label.substring(9);
            } else if (label.indexOf('toDate') === 0) {
                label = 'fromDate' + label.substring(6);
            } else if (label.indexOf('To Date') === 0) {
                label = 'From Date' + label.substring(7);
            } else if (label.indexOf('Localtype') === 0) {
                label = 'Type' + label.substring(9);
            }
            return label;
        };
    })
    .filter('trim', function() {
        /**
         * Trim starting and ending spaces from the string.
         * @param text
         */
        return function(text) {
            if (text === undefined) { return text; }
            return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        };
    })
    .filter('truncate', function() {
        /**
         * Truncate the text to the maximum specified length. The truncation will
         * be made at last space character that precedes the maximum length. A
         * ' ...' will be appended on to the string to indicate the truncation.
         * Because there is some variability in the location of the last space
         * char, the resultant string length may be up to the maximum length + 4
         * characters.
         * @param text Text
         * @param limit Maximum number of characters allowed before truncation
         * @return {*}
         */
        return function(text, limit) {
            if (text === undefined) { return text; }
            if (text.length > limit) {
                var t = text.substring(0,Math.min(limit,text.length));
                var i = t.lastIndexOf(' ');
                if (i !== -1) {
                    return text.substring(0,i) + ' ...';
                }
            }
            return text;
        };
    });
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Maintains a selection set and notifies listeners when changes occur to the
 * set.
 * @param $scope Controller scope
 * @param $rootScope Root scope
 * @todo consider having a default and named selection sets
 */
angular
    .module('ngSolr')
    .factory('SelectionSetService', ['$rootScope', function ($rootScope) {

    // parameters
    var svc = {};
    svc.documents = {};             // selected documents list
    svc.multipleSelection = false;  // allow multiple selection

    ///////////////////////////////////////////////////////////////////////////

    // Array Remove - By John Resig (MIT Licensed)
    Array.prototype.remove = function(from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add document to the selection list and notify observers of the change.
     * @param Key Document identifier
     * @param Doc Optional document
     */
    svc.add = function(Key, Doc) {
        if (!svc.multipleSelection) {
            svc.documents = {};
        }
        svc.documents[Key] = (Doc);
        $rootScope.$broadcast('selectionSetUpdate');
    };

    /**
     * Clear the selection list and notify observers of the change.
     */
    svc.clear = function() {
        svc.documents = {};
        $rootScope.$broadcast('selectionSetUpdate');
    };

    /**
     * Clear the selection list but do not notify observers.
     */
    svc.clearSilent = function() {
        svc.documents = {};
    };

    /**
     * Get the document identified by the key.
     * @param Key Document identifier
     * @return {*}
     */
    svc.get = function(Key) {
        return svc.documents[Key];
    };

    /**
     * Get the selection set.
     * @return {*}
     */
    svc.getSelectionSet = function() {
        return svc.documents;
    };

    /**
     * Remove the document from the selection list and notify observers of the
     * change.
     * @param Key Document identifier
     */
    svc.remove = function(Key) {
        delete svc.documents[Key];
        $rootScope.$broadcast('selectionSetUpdate');
    };

    // return the service instance
    return svc;

}]);
;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* jshint camelcase:false */
'use strict';

/*---------------------------------------------------------------------------*/
/* SolrSearchService support classes                                         */

/**
 * Solr search facet.
 * @param Field Field name
 * @param Value Field value. The value includes delimiting () or [] characters.
 * @see http://wiki.apache.org/solr/SimpleFacetParameters#rangefaceting
 */
function SolrFacet(Field, Value) {

    var self = this;

    self.field = Field;     // field name
    self.value = Value;     // field value
    self.options = {};      // additional filtering options
    //this.options['f'+this.field+'facet.mincount'] = 1;  // minimum item count required for result listing

    /**
     * Get option value.
     * @param Name Option name
     * @returns {String}
     */
    self.getOption = function(Name) {
        return self.options[Name];
    };

    /**
     * Get the query Url fragment for this facet.
     * @returns {String}
     */
    self.getUrlFragment = function() {
        // this is used to delimit the start of the facet query in the URL and aid parsing
        var query = ''; // delimiter should come from the CONSTANTS field ???
        // var val = self.value.replace(' ','?');
        query += '&fq=' + self.field + ':' + self.value;
        for (var option in self.options) {
            if (self.options.hasOwnProperty(option)) {
                query += '&' + option + '=' + self.options[option];
            }
        }
        return query;
    };

    /**
     * Set option.
     * @param Name
     * @param Value
     */
    self.setOption = function(Name,Value) {
        self.options[Name] = Value;
    };

} // end SolrFacet

/**
 * A Solr search query. The query is composed of four parts: user query, query
 * parameters, options, and facets. Each part of the query can be managed
 * individually as described below.
 * @param Url URL to Solr host
 */
function SolrQuery(Url) {

    var self = this;

    // error message
    self.error = undefined;

    // query facets
    self.facets = [];

    // facet counts
    self.facet_counts = {};

    // query response highlighting
    self.highlighting = {};

    // query options dictionary, where the key is the option name and the
    // value is the option value
    self.options = {};

    // execute queries as near matches by appending the tilde char to the
    // user specified search terms
    self.nearMatch = false;

    // the user provided query string
    self.query = '*:*';

    // A list of fully specified query parameters. ex: -fieldname:false,
    // +fieldname:'value', +(fieldA:'Value' AND fieldB:'Value')
    self.queryParameters = [];

    // query response
    self.response = {};

    // response header from the solr query
    self.responseHeader = {};

    // URL to the Solr core ex. http://example.com/solr/CORE
    self.solr = Url;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add facet constraint if it does not already exist.
     * @param Facet
     */
    self.addFacet = function(Facet) {
        for (var i=0;i<self.facets.length;i++) {
            if (self.facets[i].field === Facet.field &&
                self.facets[i].value === Facet.value) {
                return;
            }
        }
        self.facets.push(Facet);
    };

    /**
     * Add a query parameter. The parameter setting is added only if it is
     * unique.
     * @param Parameter
     */
    self.addQueryParameter = function(Parameter) {
        for (var i=0;i<self.queryParameters.length;i++) {
            if (self.queryParameters[i] === Parameter) {
                return;
            }
        }
        self.queryParameters.push(Parameter);
    };

    /**
     * Create a new facet.
     * @param Name
     * @param Value
     * @return {Facet}
     */
    self.createFacet = function(Name, Value) {
        return new SolrFacet(Name, Value);
    };

    /**
     * Get error message.
     * @returns {*}
     */
    self.getErrorMessage = function() {
        return self.error;
    };

    /**
     * Get facet by name. Returns null if the facet could not be found.
     * @param Name
     */
    self.getFacet = function(Name) {
        for (var i in self.facets) {
            if (self.facets[i].field === Name) {
                return self.facets[i];
            }
        }
    };

    /**
     * Get the facet counts.
     * @returns {Int} Solr facet counts.
     */
    self.getFacetCounts = function() {
        return self.facet_counts;
    };

    /**
     * Get the facet list.
     * @returns {List}
     */
    self.getFacets = function() {
        return self.facets;
    };

    /**
     * Get the hash portion of the query URL.
     * @returns {String} Location hash
     */
    self.getHash = function() {
        return '/' + self.getQuery();
    };

    /**
     * Get option value.
     * @param Name Option name
     * @returns {String} undefined value or undefined if not found.
     */
    self.getOption = function(Name) {
        if (self.options[Name]) {  // @todo I think this might fail if we pass a bogus option name
            return self.options[Name];
        }
    };

    /**
     * Get the query portion of the URL.
     * @returns {String} Location query
     */
    self.getQuery = function() {
        // query
        var query = 'q=' + self.query;
        // near matching
        if (self.nearMatch) {
            query += '~';
        }
        // query parameters
        for (var i=0; i<self.queryParameters.length; i++) {
            query += ' ' + self.queryParameters[i];
        }
        // facets
        for (i=0; i<self.facets.length; i++) {
            var facet = self.facets[i];
            query += facet.getUrlFragment();
        }
        // options
        for (var key2 in self.options) {
            if (self.options.hasOwnProperty(key2)) {
                var val = self.options[key2];
                query += '&' + key2 + '=' + val;
            }
        }
        return query;
    };

    /**
     * Get the fully specified Solr query URL.
     */
    self.getSolrQueryUrl = function() {
        return self.solr + '/select?' + encodeURI(self.getQuery());
    };

    /**
     * Get the user query value.
     * @return {String}
     */
    self.getUserQuery = function() {
        return self.query;
    };

    /**
     * Get the user query parameters.
     * @return {Array}
     */
    self.getUserQueryParameters = function() {
        return self.queryParameters;
    };

    /**
     * Determine if the query has a named facet.
     * @param Name
     */
    self.hasFacet = function(Name) {
        if (self.getFacet(Name)) {
            return true;
        }
        return false;
    };

    /**
     * Remove facet by name.
     * @param Name
     */
    self.removeFacet = function(Name) {
        for (var i=0;i<self.facets.length;i++) {
            if (self.facets[i].field === Name) {
                self.removeFacetByIndex(i);
                return;
            }
        }
    };

    /**
     * Remove facet by index.
     * @param Index
     */
    self.removeFacetByIndex = function(Index) {
        self.facets.splice(Index, 1);
    };

    /**
     * Remove a query option by name,
     * @param Name
     */
    self.removeOption = function(Name) {
        delete self.options[Name];
    };

    /**
     * Set the error message.
     * @param Msg
     */
    self.setErrorMessage = function(Msg) {
        self.error = Msg;
    };

    /**
     * Set the facet counts field value.
     * @param FacetCounts
     */
    self.setFacetCounts = function(FacetCounts) {
        self.facet_counts = FacetCounts;
    };

    /**
     * Set the highlighting field value.
     * @param Highlighting
     */
    self.setHighlighting = function(Highlighting) {
        self.highlighting = Highlighting;
    };

    /**
     * Set the near matching option.
     * @param nearMatch
     */
    self.setNearMatch = function(nearMatch) {
        if (nearMatch === true || nearMatch === false) {
            self.nearMatch = nearMatch;
        }
    };

    /**
     * Set option. User queries should be set using the setUserQuery() and setUserQueryOption() functions.
     * @param Name
     * @param Value
     */
    self.setOption = function(Name,Value) {
        // query option
        if (Name === 'fq') {
            var fq = self.getOption(Name);
            if (fq !== undefined && fq === '') {
                self.options[Name] = fq + ' +' + Value;
            } else {
                self.options[Name] = '+' + Value;
            }
        } else {
            self.options[Name] = Value;
        }
    };

    /**
     * Set the user query parameters.
     * @param Parameters Array of parameters.
     */
    self.setQueryParameters = function(Parameters) {
        self.queryParameters = Parameters;
    };

    /**
     * Set the response field value.
     * @param Response
     */
    self.setResponse = function(Response) {
        self.response = Response;
    };

    /**
     * Set the response field value.
     * @param Header
     */
    self.setResponseHeader = function(Header) {
        self.responseHeader = Header;
    };

    /**
     * Set the user query.
     * @param Query User query
     */
    self.setUserQuery = function(Query) {
        self.query = Query;
    };

} // end SolrQuery


/*---------------------------------------------------------------------------*/
/* SolrSearchService                                                         */

var m = angular.module('Solr', []);

/**
 * Used for managing and executing queries against an Apache Solr/Lucene
 * search index. The service provides shared search configuration for multiple
 * controllers in the form of named queries, and a broadcast service to
 * announce changes on named queries.
 * @param $rootScope Application root scope
 * @param $http HTTP service
 * @param $log Log service
 * @param Config Application configuration
 * @see http://stackoverflow.com/questions/15666048/angular-js-service-vs-provider-vs-factory
 * @see http://plnkr.co/edit/ia5b1OcyBD5piP7q8ATr?p=preview
 * @see http://docs.angularjs.org/guide/providers
 */
m.provider('SolrSearchService', function solrSearchServiceProvider() {

    // the default search query
    var defaultQuery = function(query) {
        query.setOption('fl', '*');
        query.setOption('json.wrf', 'JSON_CALLBACK');
        query.setOption('rows', 10);
        query.setOption('wt', 'json');
        query.setUserQuery('*:*');
        return query;
    };

    /**
     * Create an instance of the service.
     * @type {Array}
     */
    this.$get = ['$http','$log','$q','$rootScope',function solrSearchServiceFactory($http, $log, $q, $rootScope) {
        // service instance
        var svc = {};

        // name of the default query
        svc.defaultQueryName = 'defaultQuery';

        // search queries
        svc.queries = {};

        ///////////////////////////////////////////////////////////////////////////

        /**
         * Create a default query object.
         * @param Core Solr core URL, without the action selector or query component
         * @return {Object} A default query object.
         */
        svc.createQuery = function(Core) {
            // create the base query object, configure it with our default values
            // and then return it
            var query = new SolrQuery(Core);
            return defaultQuery(query);
        };

        /**
         * Get the query object.
         * @param Name Query name
         * @return {Object} The query object or undefined if not found.
         */
        svc.getQuery = function(Name) {
            try {
                return svc.queries[Name];
            } catch (Err) {
                $log.debug('No query named ' + Name + ' available');
                return undefined;
            }
        };

        /**
         * Split the query string up into its constituent parts. Return a
         * list of parts. The first part is the user query. The remaining
         * parts are the query parameters. The protocol is that query
         * parameters are to be preceeded by a space, followed by a + or
         * - character.
         * @param Query
         * ex. *:* +localtype:'Organisation' +function:'Home' -type:'Digital Object' +(fromDate:[ * TO 1973-01-01T00:00:00Z] AND toDate:[1973-12-31T23:59:59Z TO *]) -(something:[range])
         */
        svc.getQueryComponents = function(Query) {
            var parts = [];
            while (Query.length > 0) {
                // trim any starting whitespace
                Query = Query.replace(/^\s\s*/, '');
                var x = Query.indexOf(' +');
                var y = Query.indexOf(' -');
                if (x === -1 && y === -1) {
                    parts.push(Query); // there are no subsequent parameters
                    return parts;
                } else if (x > -1 && (y === -1 || x < y)) {
                    parts.push(Query.substring(0, x));
                    Query = Query.substring(x);
                } else if (y > -1) {
                    parts.push(Query.substring(0, y));
                    Query = Query.substring(y);
                }
            }
            return parts;
        };

        /**
         * Parse the URL hash and return a query object.
         * @param Hash Window location hash. We assume that the # separator has been removed from the string.
         * @param CoreUrl URL to Solr core
         * http://dev02.internal:8080/eac-ajax/app/documents.html#/q=*:*&rows=10&fl=abstract,dobj_proxy_small,fromDate,id,localtype,presentation_url,region,title,toDate&wt=json
         */
        svc.getQueryFromHash = function(Hash, CoreUrl) {
            // create a default query
            var query = svc.createQuery(CoreUrl);
            // break the query up into elements and then set each element
            // value on the query
            var hash_elements = decodeURI(Hash).split('&');
            for (var i=0; i<hash_elements.length; i++) {
                var element = hash_elements[i];
                var eparts = element.split('=');
                // user query and query parameters
                if (svc.startsWith(element, 'q')) {
                    var params = svc.getQueryComponents(element.substring(2));
                    query.setUserQuery(params.shift());
                    for (var j=0; j<params.length; j++) {
                        query.addQueryParameter(params[j]);
                    }
                }
                // facets
                else if (svc.startsWith(element, 'fq')) {
                    var p = eparts[1].indexOf(':');
                    var field = eparts[1].substring(0, p);
                    var value = eparts[1].substring(p + 1);
                    var facet = new SolrFacet(field, value);
                    query.addFacet(facet);
                }
                // query options
                else {
                    var name = eparts[0].replace('&', '');
                    if (eparts.length===2) {
                        query.setOption(name, eparts[1]);
                    } else {
                        query.setOption(name, '');
                    }
                }
            }
            // if there is a near match char on the end of the user query
            // component, strip it then set nearMatch = true on the query
            // object
            var userquery = query.getUserQuery();
            if (userquery.indexOf('~', userquery.length - 1) !== -1) {
                userquery = userquery.substring(0, userquery.length-1);
                query.setUserQuery(userquery);
                query.setNearMatch(true);
            }
            // return the query
            return query;
        };

        /**
         * Get the query response.
         * @param Name Query name
         * @return {Object} The query response object or undefined if not found.
         */
        svc.getResponse = function(Name) {
            try {
                return svc.queries[Name].response;
            } catch (Err) {
                $log.debug('Query ' + Name + ' not found');
            }
        };

        /**
         * Set the function that creates the default query.
         * @param DefaultQuery
         */
        svc.setDefaultQuery = function(DefaultQuery) {
            defaultQuery = DefaultQuery;
        };

        /**
         * Set the query by name.
         * @param Query Query object
         * @param Name Query name
         */
        svc.setQuery = function(Name, Query) {
            svc.queries[Name] = Query;
        };

        /**
         * Determine if the string s1 starts with the string s2
         * @param s1 String 1
         * @param s2 String 2
         */
        svc.startsWith = function(s1, s2) {
            try {
                return s1.slice(0, s2.length) === s2;
            } catch (Err) {}
            return false;
        };

        /**
         * Update all queries.
         */
        svc.updateAllQueries = function () {
            for (var key in svc.queries) {
                svc.updateQuery(key);
            }
        };

        /**
         * Update named queries in order.
         * @param Queries List of query names
         */
        svc.updateQueriesInOrder = function(Queries) {
            var p, q;
            for (q in Queries) {
                if (p === undefined) {
                    p = svc.updateQuery(q);
                } else {
                    p.then(svc.updateQuery(q));
                }
            }
        };

        /**
         * Update the named query.
         * @param QueryName Query name
         */
        svc.updateQuery = function(QueryName) {
            // get the named query, reset error state, get the query url
            var query = svc.queries[QueryName];
            var url = query.getSolrQueryUrl();
            $log.debug('GET ' + QueryName + ': ' + url);
            // execute the query
            return $http.jsonp(url).then(
                // success
                function (result) {
                    // set query result values
                    query.setErrorMessage(null);
                    var data = result.data;
                    query.setHighlighting(data.highlighting);
                    if (data.hasOwnProperty('facet_counts')) {
                        query.setFacetCounts(data.facet_counts);
                    }
                    query.setResponse(data.response);
                    query.setResponseHeader(data.responseHeader);
                    // notify listeners of changes
                    $rootScope.$broadcast(QueryName);
                },
                // error
                function () {
                    var msg = 'Could not get search results from server';
                    $log.error(msg);
                    // set query result values
                    var response = {};
                    response.numFound = 0;
                    response.start = 0;
                    response.docs = [];
                    query.setErrorMessage(msg);
                    query.setFacetCounts([]);
                    query.setHighlighting({});
                    query.setResponse(response);
                    query.setResponseHeader({});
                    // notify listeners of changes
                    $rootScope.$broadcast(QueryName);
                }
            );
        };

        // return the service instance
        return svc;
    }];

    /**
     * Set the function that creates the default search query.
     * @param Query
     */
    this.setDefaultQuery = function(Query) {
        defaultQuery = Query;
    };

}); // SolrSearchServiceProvider

;

/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Utility functions used across the application.
 */
angular
    .module('ngSolr')
    .factory('Utils', [function() {

        var d, day, i, key, month, months, p, parts, svc = {}, year;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Apply attribute values to the scope.
     * @param attrs
     * @param scope
     */
    svc.applyAttributes = function(attrs, scope) {
        for (key in attrs) {
            if (scope.hasOwnProperty(key)) {
                if (attrs[key] === 'true' || attrs[key] === 'false') {
                    scope[key] = attrs[key] === 'true';
                } else {
                    scope[key] = attrs[key];
                }
            }
        }
    };

    /**
     * Determine if two arrays are equal.
     * @param A Array
     * @param B Array
     * @return {Boolean} True if arrays are equal, False otherwise.
     */
    svc.arraysAreEqual = function(A, B) {
        return (A.join('') === B.join(''));
    };

    /**
     * Convert month index to common name.
     * @param Index
     * @todo this is implemented strangely ... change the months var to an array
     */
    svc.convertMonthIndexToName = function(Index) {
        months = {
            '1':'January',
            '2':'February',
            '3':'March',
            '4':'April',
            '5':'May',
            '6':'June',
            '7':'July',
            '8':'August',
            '9':'September',
            '01':'January',
            '02':'February',
            '03':'March',
            '04':'April',
            '05':'May',
            '06':'June',
            '07':'July',
            '08':'August',
            '09':'September',
            '10':'October',
            '11':'November',
            '12':'December'
        };
        return months[Index];
    };

    /**
     * Format date to convert it to the form MMM DD, YYYY.
     * @param Date
     */
    svc.formatDate = function(DateField) {
        if (DateField) {
            i = DateField.indexOf('T');
            if (i) {
                d = DateField.substring(0,i);
                parts = d.split('-');
                year = parts[0];
                month = svc.convertMonthIndexToName(parts[1]);
                day = svc.trimLeadingZero(parts[2]);
                // return month + ' ' + day + ', ' + year;
                return month + ', ' + year;

            }
        }
        return '';
    };

    /**
     * Determine if two objects are equal.
     * @param A Object
     * @param B Object
     * @return {Boolean}
     * @see http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
     */
    svc.objectsAreEqual = function(A, B) {
        // if both x and y are null or undefined and exactly the same
        if (A === B) { return true; }
        // if they are not strictly equal, they both need to be Objects
        if (!(A instanceof Object) || ! (B instanceof Object)) { return false; }
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.
        if (A.constructor !== B.constructor) { return false; }
        for (p in A) {
            // other properties were tested using x.constructor === y.constructor
            if (!A.hasOwnProperty(p)) { continue; }
            // allows to compare x[ p ] and y[ p ] when set to undefined
            if (!B.hasOwnProperty(p)) { return false; }
            // if they have the same strict value or identity then they are equal
            if (A[p] === B[p]) { continue; }
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if (typeof(A[p]) !== 'object') { return false; }
            // Objects and Arrays must be tested recursively
            if (!svc.objectsAreEqual(A[p], B[p])) { return false; }
        }
        for (p in B) {
            // allows x[ p ] to be set to undefined
            if (B.hasOwnProperty(p) && !A.hasOwnProperty(p)) { return false; }
        }
        return true;
    };

    /**
     * Determine if the string s1 starts with the string s2
     * @param s1 String 1
     * @param s2 String 2
     */
    svc.startsWith = function(s1, s2) {
        if (s1 && s2) {
            return s1.slice(0, s2.length) === s2;
        }
        return false;
    };

    /**
     * Trim starting and ending spaces from the string.
     * @param Val
     */
    svc.trim = function(Val) {
        return Val.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    /**
     * Remove leading zero from a string.
     * @param Val
     */
    svc.trimLeadingZero = function(Val) {
        if (Val && Val[0] === '0') {
            return Val.substring(1);
        }
        return Val;
    };

    /**
     * Truncate the field to the specified length. Replace the truncated
     * portion with a ... to indicate the truncation.
     * @param Field
     * @param Length
     * @return {*}
     */
    svc.truncate = function(Field, Length) {
        if (Field && Length && Field.length > Length) {
            Field = svc.trim(Field);
            Field = Field.substring(0, Math.min(Length, Field.length));
            // find the last word and truncate after that
            i = Field.lastIndexOf(' ');
            if (i !== -1) {
                Field = Field.substring(0,i) + ' ...';
            }
        }
        return Field;
    };

    ///////////////////////////////////////////////////////////////////////////

    // return the service instance
    return svc;

}]);