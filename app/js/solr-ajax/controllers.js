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
    $scope.updateOnInit = false;                // update the facet list during init
    $scope.updateOnTargetChange = true;         // update the date range to reflect the target query results

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
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        // get the target user query
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        // update the start date
        query = SolrSearchService.getQuery($scope.startDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.startDateQueryName);
        // update the end date
        query = SolrSearchService.getQuery($scope.endDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.endDateQueryName);
    };

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
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the date list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.startDateQueryName);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
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
            $scope.handleFacetListUpdate();
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
    $scope.handleFacetListUpdate = function() {
        $scope.updateStartDate();
        $scope.updateEndDate();
        // create and configure the slider control
        /*
        $("#range-slider").slider({
            min: $scope.startDate,
            max: $scope.endDate,
            values: [ $scope.startDate, $scope.endDate ],
            change: function(event,ui) {
                $scope.startDate = ui.values[0];
                $scope.endDate = ui.values[1];
                // $scope.$apply();
            },
            slide: function(event,ui) {
                // console.log("Slide: " + ui.values[0]  + " " + ui.values[1]);
            },
            start: function(event,ui) {
                // console.log("Start :");
            },
            stop: function(event,ui) {
                // console.log("Stop: " + ui.values[0]  + " " + ui.values[1]);
            }
        });
        */
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
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Document search result item.
 * @param Title
 * @param Uri
 * @param Location
 * @param Abstract
 */
function Document(Title, Uri, Location, Abstract) {
    var setIfDefined = function(Val) {
        if (Val) {
            return Val;
        }
        return '';
    };
    this.title = setIfDefined(Title);
    this.uri = setIfDefined(Uri);
    this.location = setIfDefined(Location);
    this.abstract = setIfDefined(Abstract);
}

/**
 * A page in a pagination list
 * @param Name Page name
 * @param Num Page number
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 * @param SelectionSetService Selection set service
 */
function DocumentSearchResultsController($scope, SolrSearchService, Utils, SelectionSetService) {

    // parameters
    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.maxFieldLength = 256;        // maximum length of string for presentation
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
    $scope.view = 'list';               // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        if (Id) {
            SelectionSetService.remove(Id);
        } else {
            SelectionSetService.clear();
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        SelectionSetService.add(Id,null);
    };

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                Utils.truncateField(results.docs[i],'abstract',$scope.maxFieldLength);
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
        updatePageIndex();
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService','Utils','SelectionSetService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 */
function FacetSelectionController($scope, SolrSearchService) {

	// fields
    $scope.facets = [];              // list of facets
    $scope.target = 'defaultQuery';  // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet at the specified index.
     * @param Index Index of facet to remove.
     */
    $scope.remove = function(Index) {
        var facet = $scope.facets[Index];
        var query = SolrSearchService.getQuery($scope.target);
        if (query && facet) {
            query.removeFacet(facet.field);
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var facets = query.getFacets();
            for (var i=0;i<facets.length;i++) {
                $scope.facets.push(facets[i]);
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on($scope.target, function() {
        $scope.handleFacetListUpdate();
    });

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Facet field query controller. Fetches a list of facet values from the
 * search index for the specified field name. When a facet value is selected
 * by the user, it adds a facet constraint to the target named query, If a
 * named query is not specified, it adds and removes the constraint from the
 * default query. We assume here that the target and facet queries will not
 * change names during operation.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $http, SolrSearchService) {

    // parameters
    $scope.facets = [];                 // list of current query facets
    $scope.field = '';                  // facet field name and name of query
    $scope.isSelected = false;          // if the field is part of the target query
    $scope.items = [];                  // list of facet values for the specified field
    $scope.maxItems = 7;                // max number of results to display
    $scope.queryname = '';              // query name
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
        // create a new facet constraint
        var facet = SolrSearchService.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                query.addFacet($scope.queryname,facet);
                SolrSearchService.updateQuery($scope.target);
            }
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Update the list of facet values.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.items = [];
        // determine if we've added a facet constraint for this field in the target query
        // we do if there is, then we will set isSelected for this field controller so that
        // we can change the display to reflect that
        var targetquery = SolrSearchService.getQuery($scope.target);
        var facets = targetquery.getFacetsAsDictionary();
        if ($scope.queryname in facets) {
            $scope.isSelected = true;
        } else {
            $scope.isSelected = false;
        }
        // get the list of facets for the query
        var query = SolrSearchService.getQuery($scope.queryname);
        var results = query.getFacetCounts();
        if (results && results.facet_fields) {
            if (results.hasOwnProperty('facet_fields')) {
                for (var i = 0; i < results.facet_fields[$scope.field].length && $scope.items.length <$scope.maxItems; i+=2) {
                    var label = results.facet_fields[$scope.field][i];
                    var count = results.facet_fields[$scope.field][i+1];
                    var result = new FacetResult(label,count);
                    $scope.items.push(result);
                }
            }
        }
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
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.queryname);
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
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events on the query and refresh
        // the facet list
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the facet list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
            $scope.handleFacetListUpdate();
        }
    };

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','SolrSearchService'];/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Image based search controller.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 */
function ImageSearchResultsController($scope, CONSTANTS, SolrSearchService, Utils) {

	// parameters
    $scope.itemsPerPage = 16;           // the number of items per page
    $scope.itemsPerRow = 4;             // the number of items per row
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.rows = [];                   // document search results
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
	$scope.query = '';

	///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
	$scope.init = function() {
        // redefine the default search query to ensure that only records with
        // digital objects show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter("imageQuery","+dobj_type:*");
            return query;
        };
        var query = SolrSearchService.createQuery();
        query.setOption("rows",$scope.itemsPerPage);
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
	};

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
	$scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.itemsPerRow) {
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
        updatePageIndex();
	};

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','CONSTANTS','SolrSearchService','Utils'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Displays a map of the current search results and can optionally display
 * error and warning messages to the user.
 * @param $scope Controller scope
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {
    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterResults = true;   // use cluster manager
    $scope.count = 5000;            // the total number of records
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.userquery = "*:*";       // user query

    var categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    var clusterOptions = {
        styles: [
            { height: 53, url: "img/map/m1.png", width: 53 },
            { height: 56, url: "img/map/m2.png", width: 56 },
            { height: 66, url: "img/map/m3.png", width: 66 },
            { height: 78, url: "img/map/m4.png", width: 78 },
            { height: 90, url: "img/map/m5.png", width: 90 }
        ]};
    var infoWindow = new google.maps.InfoWindow();      // google map info window
    var settings = {                                    // map settings
        center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl:false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId:google.maps.MapTypeId.TERRAIN,
        navigationControl:true,
        navigationControlOptions:{
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions:{
            style:google.maps.ZoomControlStyle.LARGE
        }
    };

    /**
     * Determine if two arrays are equal.
     * @param A Array
     * @param B Array
     * @return {Boolean}
     */
    function arraysAreEqual(A, B) {
        return (A.join('') == B.join(''));
    }

    /**
     * Determine if two objects are equal.
     * @param A Object
     * @param B Object
     * @return {Boolean}
     * @see http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
     */
    function objectsAreEqual(A, B) {
        // if both x and y are null or undefined and exactly the same
        if ( A === B ) return true;
        // if they are not strictly equal, they both need to be Objects
        if ( ! ( A instanceof Object ) || ! ( B instanceof Object ) ) return false;
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.
        if ( A.constructor !== B.constructor ) return false;
        for ( var p in A ) {
            // other properties were tested using x.constructor === y.constructor
            if ( ! A.hasOwnProperty( p ) ) continue;
            // allows to compare x[ p ] and y[ p ] when set to undefined
            if ( ! B.hasOwnProperty( p ) ) return false;
            // if they have the same strict value or identity then they are equal
            if ( A[ p ] === B[ p ] ) continue;
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if ( typeof( A[ p ] ) !== "object" ) return false;
            // Objects and Arrays must be tested recursively
            if ( ! Object.equals( A[ p ],  B[ p ] ) ) return false;
        }
        for ( p in B ) {
            // allows x[ p ] to be set to undefined
            if ( B.hasOwnProperty( p ) && ! A.hasOwnProperty( p ) ) return false;
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Handle update event for a related map view query. If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.checkUpdate = function() {
        var defaultQuery = SolrSearchService.getQuery();
        var existingMapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new location query and update the view
        if (defaultQuery.getUserQuery() !== existingMapQuery.getUserQuery() ||
            !objectsAreEqual(defaultQuery.getUserQueryParameters(),existingMapQuery.getUserQueryParameters())) {
            var userQuery = defaultQuery.getUserQuery();
            var userQueryParams = defaultQuery.getUserQueryParameters();
            var query = $scope.getMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams[$scope.queryname] = "+location_0_coordinate:[* TO *]";
            query.setUserQueryParameters(userQueryParams);
            SolrSearchService.setQuery(query,$scope.queryname);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Create a default map query. There is no way to tell Solr to return ALL
     * records, consequently we need to either tell it to return a very large
     * number of records or we need to tell it to return exactly the number of
     * records that are available. There is no processing required if we just
     * ask for a really large number of documents, so we'll do that here.
     */
    $scope.getMapQuery = function() {
        var query = SolrSearchService.createQuery();
        query.setOption('fl','abstract,country,dobj_proxy_small,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,presentation_url,region,title,toDate');
        query.setOption("rows",$scope.count);
        query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
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
    $scope.getMarker = function (Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = categoryToIconMap['default'];
        if (Category != null && Category in categoryToIconMap) {
            icon = categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title
        });
        // attach an info window to the marker
        $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Handle selection events.
     */
    $scope.handleSelection = function() {
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
            // @todo enable multiple selection .. ie. multiple infowindows!
            // this is a bit complicated because the selection set service can hold either single or multiple
            // values. however, for the moment, we want to show only a single info window here.
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
                    $scope.map.setCenter(bounds.getCenter());
                    $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                }
            }
        }
    };

    /**
     * Handle update to search query results.
     */
    $scope.handleUpdate = function () {
        // clear current markers
        $scope.idToMarkerMap = {};
        infoWindow.close();
        $scope.clusterManager.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // marker metadata
                    var content = "";
                    content += "<div class='infowindow'>";
                    if (item.dobj_proxy_small) {
                        content += "<div class='thumb'><a href='" + item.presentation_url + "'>" + "<img src='" + item.dobj_proxy_small + "' />" + "</a></div>";
                    }
                    content += "<div class='title'><a href='" + item.presentation_url + "'>" + item.title + "</a></div>";
                    content += "<div class='existdates'>" + Utils.formatDate(item.fromDate) + " - " + Utils.formatDate(item.toDate) + "</div>";
                    // content +=  "<div class='type'>" + item.type + "</div>";
                    content += "<div class='summary'>" + Utils.truncate(item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + "</div>";
                    content += "</div>" ;
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to clusterer
        $scope.clusterManager.addMarkers($scope.markers);
        // if the force center on start property is set, recenter the view
        if (CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
        } else {
            $scope.map.fitBounds(bounds);
        }
        // if there is an information message
        if ($scope.message && $scope.message != '') {
            console.log("Information message");
        }
        // if there is an error message
        if ($scope.error && $scope.error != '') {
            console.log("Error message");
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows",CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl",CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt","json");
            query.setOption("sort","title+asc");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
            return query;
        };
        // handle update events from the search service on the map query
        $scope.$on($scope.queryname, function() {
            $scope.handleUpdate();
        });
        // handle update events from the search service on the default query
        $scope.$on('defaultQuery', function() {
            $scope.checkUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // create a new mapping query
        var mapQuery = $scope.getMapQuery();
        // set and update the document query
        var defaultQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery(defaultQuery,'defaultQuery');
        SolrSearchService.updateQuery();
        // set and update the map query
        SolrSearchService.setQuery(mapQuery,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add info window to marker
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function (Map, Marker, Content) {
        google.maps.event.addListener(Marker, 'click', function () {
            infoWindow.close();
            infoWindow.setContent(Content);
            infoWindow.open(Map, Marker);
        });
    };

    ///////////////////////////////////////////////////////////////////////////

    // handle close click event on info window
    google.maps.event.addListener(infoWindow, 'close', function () {
        infoWindow.close();
    });

    // create map
    $scope.map = new google.maps.Map(document.getElementById("map"), settings);

    // create marker cluster manager
    $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','SelectionSetService','Utils','CONSTANTS'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // private

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var items = [];
        if ($scope.userquery.length >= minSearchLength) {
            for (var i=0;i<$scope.hints.length;i++) {
                var token = $scope.hints[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery(query,$scope.searchHintsQuery);
        // handle update events from the search service.
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleFacetListUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // if we need to reset the query parameters
        if ($scope.resetOnChange) {
            // create a new query and set the user query property
            // to the value provided by the user
            var query = SolrSearchService.createQuery();
            query.setQuery($scope.userquery);
            SolrSearchService.setQuery(query,$scope.target);
        } else {
            // keep the existing search query but change the current user query
            // value and set the starting document number to 0
            var query = SolrSearchService.getQuery($scope.target);
            query.setQuery($scope.userquery);
            query.setOption("start","0");
        }
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.load = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            var query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // get the new query
        var newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new query is the same as the last query, ignore it
            if (newquery != $scope.queries[0]) {
                // add new query to the top of the queue
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
     * Handle update events from the search service.
     */
    $scope.$on($scope.queryName, function() {
        $scope.handleFacetListUpdate();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];/**
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
    $scope.updateOnInit = false;                // update the facet list during init
    $scope.updateOnTargetChange = true;         // update the date range to reflect the target query results

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
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        // get the target user query
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        // update the start date
        query = SolrSearchService.getQuery($scope.startDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.startDateQueryName);
        // update the end date
        query = SolrSearchService.getQuery($scope.endDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.endDateQueryName);
    };

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
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the date list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.startDateQueryName);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
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
            $scope.handleFacetListUpdate();
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
    $scope.handleFacetListUpdate = function() {
        $scope.updateStartDate();
        $scope.updateEndDate();
        // create and configure the slider control
        /*
        $("#range-slider").slider({
            min: $scope.startDate,
            max: $scope.endDate,
            values: [ $scope.startDate, $scope.endDate ],
            change: function(event,ui) {
                $scope.startDate = ui.values[0];
                $scope.endDate = ui.values[1];
                // $scope.$apply();
            },
            slide: function(event,ui) {
                // console.log("Slide: " + ui.values[0]  + " " + ui.values[1]);
            },
            start: function(event,ui) {
                // console.log("Start :");
            },
            stop: function(event,ui) {
                // console.log("Stop: " + ui.values[0]  + " " + ui.values[1]);
            }
        });
        */
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
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Document search result item.
 * @param Title
 * @param Uri
 * @param Location
 * @param Abstract
 */
function Document(Title, Uri, Location, Abstract) {
    var setIfDefined = function(Val) {
        if (Val) {
            return Val;
        }
        return '';
    };
    this.title = setIfDefined(Title);
    this.uri = setIfDefined(Uri);
    this.location = setIfDefined(Location);
    this.abstract = setIfDefined(Abstract);
}

/**
 * A page in a pagination list
 * @param Name Page name
 * @param Num Page number
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 * @param SelectionSetService Selection set service
 */
function DocumentSearchResultsController($scope, SolrSearchService, Utils, SelectionSetService) {

    // parameters
    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.maxFieldLength = 256;        // maximum length of string for presentation
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
    $scope.view = 'list';               // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        if (Id) {
            SelectionSetService.remove(Id);
        } else {
            SelectionSetService.clear();
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        SelectionSetService.add(Id,null);
    };

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                Utils.truncateField(results.docs[i],'abstract',$scope.maxFieldLength);
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
        updatePageIndex();
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService','Utils','SelectionSetService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 */
function FacetSelectionController($scope, SolrSearchService) {

	// fields
    $scope.facets = [];              // list of facets
    $scope.target = 'defaultQuery';  // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet at the specified index.
     * @param Index Index of facet to remove.
     */
    $scope.remove = function(Index) {
        var facet = $scope.facets[Index];
        var query = SolrSearchService.getQuery($scope.target);
        if (query && facet) {
            query.removeFacet(facet.field);
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var facets = query.getFacets();
            for (var i=0;i<facets.length;i++) {
                $scope.facets.push(facets[i]);
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on($scope.target, function() {
        $scope.handleFacetListUpdate();
    });

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Facet field query controller. Fetches a list of facet values from the
 * search index for the specified field name. When a facet value is selected
 * by the user, it adds a facet constraint to the target named query, If a
 * named query is not specified, it adds and removes the constraint from the
 * default query. We assume here that the target and facet queries will not
 * change names during operation.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $http, SolrSearchService) {

    // parameters
    $scope.facets = [];                 // list of current query facets
    $scope.field = '';                  // facet field name and name of query
    $scope.isSelected = false;          // if the field is part of the target query
    $scope.items = [];                  // list of facet values for the specified field
    $scope.maxItems = 7;                // max number of results to display
    $scope.queryname = '';              // query name
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
        // create a new facet constraint
        var facet = SolrSearchService.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                query.addFacet($scope.queryname,facet);
                SolrSearchService.updateQuery($scope.target);
            }
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Update the list of facet values.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.items = [];
        // determine if we've added a facet constraint for this field in the target query
        // we do if there is, then we will set isSelected for this field controller so that
        // we can change the display to reflect that
        var targetquery = SolrSearchService.getQuery($scope.target);
        var facets = targetquery.getFacetsAsDictionary();
        if ($scope.queryname in facets) {
            $scope.isSelected = true;
        } else {
            $scope.isSelected = false;
        }
        // get the list of facets for the query
        var query = SolrSearchService.getQuery($scope.queryname);
        var results = query.getFacetCounts();
        if (results && results.facet_fields) {
            if (results.hasOwnProperty('facet_fields')) {
                for (var i = 0; i < results.facet_fields[$scope.field].length && $scope.items.length <$scope.maxItems; i+=2) {
                    var label = results.facet_fields[$scope.field][i];
                    var count = results.facet_fields[$scope.field][i+1];
                    var result = new FacetResult(label,count);
                    $scope.items.push(result);
                }
            }
        }
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
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.queryname);
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
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events on the query and refresh
        // the facet list
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the facet list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
            $scope.handleFacetListUpdate();
        }
    };

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','SolrSearchService'];/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Image based search controller.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 */
function ImageSearchResultsController($scope, CONSTANTS, SolrSearchService, Utils) {

	// parameters
    $scope.itemsPerPage = 16;           // the number of items per page
    $scope.itemsPerRow = 4;             // the number of items per row
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.rows = [];                   // document search results
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
	$scope.query = '';

	///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
	$scope.init = function() {
        // redefine the default search query to ensure that only records with
        // digital objects show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter("imageQuery","+dobj_type:*");
            return query;
        };
        var query = SolrSearchService.createQuery();
        query.setOption("rows",$scope.itemsPerPage);
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
	};

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
	$scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.itemsPerRow) {
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
        updatePageIndex();
	};

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','CONSTANTS','SolrSearchService','Utils'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Displays a map of the current search results and can optionally display
 * error and warning messages to the user.
 * @param $scope Controller scope
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {
    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterResults = true;   // use cluster manager
    $scope.count = 5000;            // the total number of records
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.userquery = "*:*";       // user query

    var categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    var clusterOptions = {
        styles: [
            { height: 53, url: "img/map/m1.png", width: 53 },
            { height: 56, url: "img/map/m2.png", width: 56 },
            { height: 66, url: "img/map/m3.png", width: 66 },
            { height: 78, url: "img/map/m4.png", width: 78 },
            { height: 90, url: "img/map/m5.png", width: 90 }
        ]};
    var infoWindow = new google.maps.InfoWindow();      // google map info window
    var settings = {                                    // map settings
        center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl:false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId:google.maps.MapTypeId.TERRAIN,
        navigationControl:true,
        navigationControlOptions:{
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions:{
            style:google.maps.ZoomControlStyle.LARGE
        }
    };

    /**
     * Determine if two arrays are equal.
     * @param A Array
     * @param B Array
     * @return {Boolean}
     */
    function arraysAreEqual(A, B) {
        return (A.join('') == B.join(''));
    }

    /**
     * Determine if two objects are equal.
     * @param A Object
     * @param B Object
     * @return {Boolean}
     * @see http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
     */
    function objectsAreEqual(A, B) {
        // if both x and y are null or undefined and exactly the same
        if ( A === B ) return true;
        // if they are not strictly equal, they both need to be Objects
        if ( ! ( A instanceof Object ) || ! ( B instanceof Object ) ) return false;
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.
        if ( A.constructor !== B.constructor ) return false;
        for ( var p in A ) {
            // other properties were tested using x.constructor === y.constructor
            if ( ! A.hasOwnProperty( p ) ) continue;
            // allows to compare x[ p ] and y[ p ] when set to undefined
            if ( ! B.hasOwnProperty( p ) ) return false;
            // if they have the same strict value or identity then they are equal
            if ( A[ p ] === B[ p ] ) continue;
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if ( typeof( A[ p ] ) !== "object" ) return false;
            // Objects and Arrays must be tested recursively
            if ( ! Object.equals( A[ p ],  B[ p ] ) ) return false;
        }
        for ( p in B ) {
            // allows x[ p ] to be set to undefined
            if ( B.hasOwnProperty( p ) && ! A.hasOwnProperty( p ) ) return false;
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Handle update event for a related map view query. If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.checkUpdate = function() {
        var defaultQuery = SolrSearchService.getQuery();
        var existingMapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new location query and update the view
        if (defaultQuery.getUserQuery() !== existingMapQuery.getUserQuery() ||
            !objectsAreEqual(defaultQuery.getUserQueryParameters(),existingMapQuery.getUserQueryParameters())) {
            var userQuery = defaultQuery.getUserQuery();
            var userQueryParams = defaultQuery.getUserQueryParameters();
            var query = $scope.getMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams[$scope.queryname] = "+location_0_coordinate:[* TO *]";
            query.setUserQueryParameters(userQueryParams);
            SolrSearchService.setQuery(query,$scope.queryname);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Create a default map query. There is no way to tell Solr to return ALL
     * records, consequently we need to either tell it to return a very large
     * number of records or we need to tell it to return exactly the number of
     * records that are available. There is no processing required if we just
     * ask for a really large number of documents, so we'll do that here.
     */
    $scope.getMapQuery = function() {
        var query = SolrSearchService.createQuery();
        query.setOption('fl','abstract,country,dobj_proxy_small,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,presentation_url,region,title,toDate');
        query.setOption("rows",$scope.count);
        query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
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
    $scope.getMarker = function (Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = categoryToIconMap['default'];
        if (Category != null && Category in categoryToIconMap) {
            icon = categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title
        });
        // attach an info window to the marker
        $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Handle selection events.
     */
    $scope.handleSelection = function() {
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
            // @todo enable multiple selection .. ie. multiple infowindows!
            // this is a bit complicated because the selection set service can hold either single or multiple
            // values. however, for the moment, we want to show only a single info window here.
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
                    $scope.map.setCenter(bounds.getCenter());
                    $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                }
            }
        }
    };

    /**
     * Handle update to search query results.
     */
    $scope.handleUpdate = function () {
        // clear current markers
        $scope.idToMarkerMap = {};
        infoWindow.close();
        $scope.clusterManager.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // marker metadata
                    var content = "";
                    content += "<div class='infowindow'>";
                    if (item.dobj_proxy_small) {
                        content += "<div class='thumb'><a href='" + item.presentation_url + "'>" + "<img src='" + item.dobj_proxy_small + "' />" + "</a></div>";
                    }
                    content += "<div class='title'><a href='" + item.presentation_url + "'>" + item.title + "</a></div>";
                    content += "<div class='existdates'>" + Utils.formatDate(item.fromDate) + " - " + Utils.formatDate(item.toDate) + "</div>";
                    // content +=  "<div class='type'>" + item.type + "</div>";
                    content += "<div class='summary'>" + Utils.truncate(item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + "</div>";
                    content += "</div>" ;
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to clusterer
        $scope.clusterManager.addMarkers($scope.markers);
        // if the force center on start property is set, recenter the view
        if (CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
        } else {
            $scope.map.fitBounds(bounds);
        }
        // if there is an information message
        if ($scope.message && $scope.message != '') {
            console.log("Information message");
        }
        // if there is an error message
        if ($scope.error && $scope.error != '') {
            console.log("Error message");
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows",CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl",CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt","json");
            query.setOption("sort","title+asc");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
            return query;
        };
        // handle update events from the search service on the map query
        $scope.$on($scope.queryname, function() {
            $scope.handleUpdate();
        });
        // handle update events from the search service on the default query
        $scope.$on('defaultQuery', function() {
            $scope.checkUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // create a new mapping query
        var mapQuery = $scope.getMapQuery();
        // set and update the document query
        var defaultQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery(defaultQuery,'defaultQuery');
        SolrSearchService.updateQuery();
        // set and update the map query
        SolrSearchService.setQuery(mapQuery,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add info window to marker
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function (Map, Marker, Content) {
        google.maps.event.addListener(Marker, 'click', function () {
            infoWindow.close();
            infoWindow.setContent(Content);
            infoWindow.open(Map, Marker);
        });
    };

    ///////////////////////////////////////////////////////////////////////////

    // handle close click event on info window
    google.maps.event.addListener(infoWindow, 'close', function () {
        infoWindow.close();
    });

    // create map
    $scope.map = new google.maps.Map(document.getElementById("map"), settings);

    // create marker cluster manager
    $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','SelectionSetService','Utils','CONSTANTS'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // private

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var items = [];
        if ($scope.userquery.length >= minSearchLength) {
            for (var i=0;i<$scope.hints.length;i++) {
                var token = $scope.hints[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery(query,$scope.searchHintsQuery);
        // handle update events from the search service.
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleFacetListUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // if we need to reset the query parameters
        if ($scope.resetOnChange) {
            // create a new query and set the user query property
            // to the value provided by the user
            var query = SolrSearchService.createQuery();
            query.setQuery($scope.userquery);
            SolrSearchService.setQuery(query,$scope.target);
        } else {
            // keep the existing search query but change the current user query
            // value and set the starting document number to 0
            var query = SolrSearchService.getQuery($scope.target);
            query.setQuery($scope.userquery);
            query.setOption("start","0");
        }
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.load = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            var query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // get the new query
        var newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new query is the same as the last query, ignore it
            if (newquery != $scope.queries[0]) {
                // add new query to the top of the queue
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
     * Handle update events from the search service.
     */
    $scope.$on($scope.queryName, function() {
        $scope.handleFacetListUpdate();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];/**
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
    $scope.updateOnInit = false;                // update the facet list during init
    $scope.updateOnTargetChange = true;         // update the date range to reflect the target query results

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
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        // get the target user query
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        // update the start date
        query = SolrSearchService.getQuery($scope.startDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.startDateQueryName);
        // update the end date
        query = SolrSearchService.getQuery($scope.endDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.endDateQueryName);
    };

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
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the date list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.startDateQueryName);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
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
            $scope.handleFacetListUpdate();
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
    $scope.handleFacetListUpdate = function() {
        $scope.updateStartDate();
        $scope.updateEndDate();
        // create and configure the slider control
        /*
        $("#range-slider").slider({
            min: $scope.startDate,
            max: $scope.endDate,
            values: [ $scope.startDate, $scope.endDate ],
            change: function(event,ui) {
                $scope.startDate = ui.values[0];
                $scope.endDate = ui.values[1];
                // $scope.$apply();
            },
            slide: function(event,ui) {
                // console.log("Slide: " + ui.values[0]  + " " + ui.values[1]);
            },
            start: function(event,ui) {
                // console.log("Start :");
            },
            stop: function(event,ui) {
                // console.log("Stop: " + ui.values[0]  + " " + ui.values[1]);
            }
        });
        */
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
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Document search result item.
 * @param Title
 * @param Uri
 * @param Location
 * @param Abstract
 */
function Document(Title, Uri, Location, Abstract) {
    var setIfDefined = function(Val) {
        if (Val) {
            return Val;
        }
        return '';
    };
    this.title = setIfDefined(Title);
    this.uri = setIfDefined(Uri);
    this.location = setIfDefined(Location);
    this.abstract = setIfDefined(Abstract);
}

/**
 * A page in a pagination list
 * @param Name Page name
 * @param Num Page number
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 * @param SelectionSetService Selection set service
 */
function DocumentSearchResultsController($scope, SolrSearchService, Utils, SelectionSetService) {

    // parameters
    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.maxFieldLength = 256;        // maximum length of string for presentation
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
    $scope.view = 'list';               // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        if (Id) {
            SelectionSetService.remove(Id);
        } else {
            SelectionSetService.clear();
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        SelectionSetService.add(Id,null);
    };

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                Utils.truncateField(results.docs[i],'abstract',$scope.maxFieldLength);
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
        updatePageIndex();
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService','Utils','SelectionSetService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 */
function FacetSelectionController($scope, SolrSearchService) {

	// fields
    $scope.facets = [];              // list of facets
    $scope.target = 'defaultQuery';  // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet at the specified index.
     * @param Index Index of facet to remove.
     */
    $scope.remove = function(Index) {
        var facet = $scope.facets[Index];
        var query = SolrSearchService.getQuery($scope.target);
        if (query && facet) {
            query.removeFacet(facet.field);
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var facets = query.getFacets();
            for (var i=0;i<facets.length;i++) {
                $scope.facets.push(facets[i]);
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on($scope.target, function() {
        $scope.handleFacetListUpdate();
    });

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Facet field query controller. Fetches a list of facet values from the
 * search index for the specified field name. When a facet value is selected
 * by the user, it adds a facet constraint to the target named query, If a
 * named query is not specified, it adds and removes the constraint from the
 * default query. We assume here that the target and facet queries will not
 * change names during operation.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $http, SolrSearchService) {

    // parameters
    $scope.facets = [];                 // list of current query facets
    $scope.field = '';                  // facet field name and name of query
    $scope.isSelected = false;          // if the field is part of the target query
    $scope.items = [];                  // list of facet values for the specified field
    $scope.maxItems = 7;                // max number of results to display
    $scope.queryname = '';              // query name
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
        // create a new facet constraint
        var facet = SolrSearchService.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                query.addFacet($scope.queryname,facet);
                SolrSearchService.updateQuery($scope.target);
            }
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Update the list of facet values.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.items = [];
        // determine if we've added a facet constraint for this field in the target query
        // we do if there is, then we will set isSelected for this field controller so that
        // we can change the display to reflect that
        var targetquery = SolrSearchService.getQuery($scope.target);
        var facets = targetquery.getFacetsAsDictionary();
        if ($scope.queryname in facets) {
            $scope.isSelected = true;
        } else {
            $scope.isSelected = false;
        }
        // get the list of facets for the query
        var query = SolrSearchService.getQuery($scope.queryname);
        var results = query.getFacetCounts();
        if (results && results.facet_fields) {
            if (results.hasOwnProperty('facet_fields')) {
                for (var i = 0; i < results.facet_fields[$scope.field].length && $scope.items.length <$scope.maxItems; i+=2) {
                    var label = results.facet_fields[$scope.field][i];
                    var count = results.facet_fields[$scope.field][i+1];
                    var result = new FacetResult(label,count);
                    $scope.items.push(result);
                }
            }
        }
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
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.queryname);
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
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events on the query and refresh
        // the facet list
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the facet list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
            $scope.handleFacetListUpdate();
        }
    };

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','SolrSearchService'];/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Image based search controller.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 */
function ImageSearchResultsController($scope, CONSTANTS, SolrSearchService, Utils) {

	// parameters
    $scope.itemsPerPage = 16;           // the number of items per page
    $scope.itemsPerRow = 4;             // the number of items per row
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.rows = [];                   // document search results
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
	$scope.query = '';

	///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
	$scope.init = function() {
        // redefine the default search query to ensure that only records with
        // digital objects show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter("imageQuery","+dobj_type:*");
            return query;
        };
        var query = SolrSearchService.createQuery();
        query.setOption("rows",$scope.itemsPerPage);
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
	};

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
	$scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.itemsPerRow) {
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
        updatePageIndex();
	};

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','CONSTANTS','SolrSearchService','Utils'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Displays a map of the current search results and can optionally display
 * error and warning messages to the user.
 * @param $scope Controller scope
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {
    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterResults = true;   // use cluster manager
    $scope.count = 5000;            // the total number of records
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.userquery = "*:*";       // user query

    var categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    var clusterOptions = {
        styles: [
            { height: 53, url: "img/map/m1.png", width: 53 },
            { height: 56, url: "img/map/m2.png", width: 56 },
            { height: 66, url: "img/map/m3.png", width: 66 },
            { height: 78, url: "img/map/m4.png", width: 78 },
            { height: 90, url: "img/map/m5.png", width: 90 }
        ]};
    var infoWindow = new google.maps.InfoWindow();      // google map info window
    var settings = {                                    // map settings
        center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl:false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId:google.maps.MapTypeId.TERRAIN,
        navigationControl:true,
        navigationControlOptions:{
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions:{
            style:google.maps.ZoomControlStyle.LARGE
        }
    };

    /**
     * Determine if two arrays are equal.
     * @param A Array
     * @param B Array
     * @return {Boolean}
     */
    function arraysAreEqual(A, B) {
        return (A.join('') == B.join(''));
    }

    /**
     * Determine if two objects are equal.
     * @param A Object
     * @param B Object
     * @return {Boolean}
     * @see http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
     */
    function objectsAreEqual(A, B) {
        // if both x and y are null or undefined and exactly the same
        if ( A === B ) return true;
        // if they are not strictly equal, they both need to be Objects
        if ( ! ( A instanceof Object ) || ! ( B instanceof Object ) ) return false;
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.
        if ( A.constructor !== B.constructor ) return false;
        for ( var p in A ) {
            // other properties were tested using x.constructor === y.constructor
            if ( ! A.hasOwnProperty( p ) ) continue;
            // allows to compare x[ p ] and y[ p ] when set to undefined
            if ( ! B.hasOwnProperty( p ) ) return false;
            // if they have the same strict value or identity then they are equal
            if ( A[ p ] === B[ p ] ) continue;
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if ( typeof( A[ p ] ) !== "object" ) return false;
            // Objects and Arrays must be tested recursively
            if ( ! Object.equals( A[ p ],  B[ p ] ) ) return false;
        }
        for ( p in B ) {
            // allows x[ p ] to be set to undefined
            if ( B.hasOwnProperty( p ) && ! A.hasOwnProperty( p ) ) return false;
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Handle update event for a related map view query. If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.checkUpdate = function() {
        var defaultQuery = SolrSearchService.getQuery();
        var existingMapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new location query and update the view
        if (defaultQuery.getUserQuery() !== existingMapQuery.getUserQuery() ||
            !objectsAreEqual(defaultQuery.getUserQueryParameters(),existingMapQuery.getUserQueryParameters())) {
            var userQuery = defaultQuery.getUserQuery();
            var userQueryParams = defaultQuery.getUserQueryParameters();
            var query = $scope.getMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams[$scope.queryname] = "+location_0_coordinate:[* TO *]";
            query.setUserQueryParameters(userQueryParams);
            SolrSearchService.setQuery(query,$scope.queryname);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Create a default map query. There is no way to tell Solr to return ALL
     * records, consequently we need to either tell it to return a very large
     * number of records or we need to tell it to return exactly the number of
     * records that are available. There is no processing required if we just
     * ask for a really large number of documents, so we'll do that here.
     */
    $scope.getMapQuery = function() {
        var query = SolrSearchService.createQuery();
        query.setOption('fl','abstract,country,dobj_proxy_small,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,presentation_url,region,title,toDate');
        query.setOption("rows",$scope.count);
        query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
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
    $scope.getMarker = function (Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = categoryToIconMap['default'];
        if (Category != null && Category in categoryToIconMap) {
            icon = categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title
        });
        // attach an info window to the marker
        $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Handle selection events.
     */
    $scope.handleSelection = function() {
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
            // @todo enable multiple selection .. ie. multiple infowindows!
            // this is a bit complicated because the selection set service can hold either single or multiple
            // values. however, for the moment, we want to show only a single info window here.
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
                    $scope.map.setCenter(bounds.getCenter());
                    $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                }
            }
        }
    };

    /**
     * Handle update to search query results.
     */
    $scope.handleUpdate = function () {
        // clear current markers
        $scope.idToMarkerMap = {};
        infoWindow.close();
        $scope.clusterManager.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // marker metadata
                    var content = "";
                    content += "<div class='infowindow'>";
                    if (item.dobj_proxy_small) {
                        content += "<div class='thumb'><a href='" + item.presentation_url + "'>" + "<img src='" + item.dobj_proxy_small + "' />" + "</a></div>";
                    }
                    content += "<div class='title'><a href='" + item.presentation_url + "'>" + item.title + "</a></div>";
                    content += "<div class='existdates'>" + Utils.formatDate(item.fromDate) + " - " + Utils.formatDate(item.toDate) + "</div>";
                    // content +=  "<div class='type'>" + item.type + "</div>";
                    content += "<div class='summary'>" + Utils.truncate(item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + " ";
                    content += "<a href=''>more</a>" + "</div>";
                    content += "</div>" ;
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to clusterer
        $scope.clusterManager.addMarkers($scope.markers);
        // if the force center on start property is set, recenter the view
        if (CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
        } else {
            $scope.map.fitBounds(bounds);
        }
        // if there is an information message
        if ($scope.message && $scope.message != '') {
            console.log("Information message");
        }
        // if there is an error message
        if ($scope.error && $scope.error != '') {
            console.log("Error message");
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows",CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl",CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt","json");
            query.setOption("sort","title+asc");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
            return query;
        };
        // handle update events from the search service on the map query
        $scope.$on($scope.queryname, function() {
            $scope.handleUpdate();
        });
        // handle update events from the search service on the default query
        $scope.$on('defaultQuery', function() {
            $scope.checkUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // create a new mapping query
        var mapQuery = $scope.getMapQuery();
        // set and update the document query
        var defaultQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery(defaultQuery,'defaultQuery');
        SolrSearchService.updateQuery();
        // set and update the map query
        SolrSearchService.setQuery(mapQuery,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add info window to marker
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function (Map, Marker, Content) {
        google.maps.event.addListener(Marker, 'click', function () {
            infoWindow.close();
            infoWindow.setContent(Content);
            infoWindow.open(Map, Marker);
        });
    };

    ///////////////////////////////////////////////////////////////////////////

    // handle close click event on info window
    google.maps.event.addListener(infoWindow, 'close', function () {
        infoWindow.close();
    });

    // create map
    $scope.map = new google.maps.Map(document.getElementById("map"), settings);

    // create marker cluster manager
    $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','SelectionSetService','Utils','CONSTANTS'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // private

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var items = [];
        if ($scope.userquery.length >= minSearchLength) {
            for (var i=0;i<$scope.hints.length;i++) {
                var token = $scope.hints[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery(query,$scope.searchHintsQuery);
        // handle update events from the search service.
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleFacetListUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // if we need to reset the query parameters
        if ($scope.resetOnChange) {
            // create a new query and set the user query property
            // to the value provided by the user
            var query = SolrSearchService.createQuery();
            query.setQuery($scope.userquery);
            SolrSearchService.setQuery(query,$scope.target);
        } else {
            // keep the existing search query but change the current user query
            // value and set the starting document number to 0
            var query = SolrSearchService.getQuery($scope.target);
            query.setQuery($scope.userquery);
            query.setOption("start","0");
        }
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.load = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            var query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // get the new query
        var newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new query is the same as the last query, ignore it
            if (newquery != $scope.queries[0]) {
                // add new query to the top of the queue
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
     * Handle update events from the search service.
     */
    $scope.$on($scope.queryName, function() {
        $scope.handleFacetListUpdate();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];/**
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
    $scope.updateOnInit = false;                // update the facet list during init
    $scope.updateOnTargetChange = true;         // update the date range to reflect the target query results

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
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        // get the target user query
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        // update the start date
        query = SolrSearchService.getQuery($scope.startDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.startDateQueryName);
        // update the end date
        query = SolrSearchService.getQuery($scope.endDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.endDateQueryName);
    };

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
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the date list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.startDateQueryName);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
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
            $scope.handleFacetListUpdate();
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
    $scope.handleFacetListUpdate = function() {
        $scope.updateStartDate();
        $scope.updateEndDate();
        // create and configure the slider control
        /*
        $("#range-slider").slider({
            min: $scope.startDate,
            max: $scope.endDate,
            values: [ $scope.startDate, $scope.endDate ],
            change: function(event,ui) {
                $scope.startDate = ui.values[0];
                $scope.endDate = ui.values[1];
                // $scope.$apply();
            },
            slide: function(event,ui) {
                // console.log("Slide: " + ui.values[0]  + " " + ui.values[1]);
            },
            start: function(event,ui) {
                // console.log("Start :");
            },
            stop: function(event,ui) {
                // console.log("Stop: " + ui.values[0]  + " " + ui.values[1]);
            }
        });
        */
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
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Document search result item.
 * @param Title
 * @param Uri
 * @param Location
 * @param Abstract
 */
function Document(Title, Uri, Location, Abstract) {
    var setIfDefined = function(Val) {
        if (Val) {
            return Val;
        }
        return '';
    };
    this.title = setIfDefined(Title);
    this.uri = setIfDefined(Uri);
    this.location = setIfDefined(Location);
    this.abstract = setIfDefined(Abstract);
}

/**
 * A page in a pagination list
 * @param Name Page name
 * @param Num Page number
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 * @param SelectionSetService Selection set service
 */
function DocumentSearchResultsController($scope, SolrSearchService, Utils, SelectionSetService) {

    // parameters
    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.maxFieldLength = 256;        // maximum length of string for presentation
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
    $scope.view = 'list';               // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        if (Id) {
            SelectionSetService.remove(Id);
        } else {
            SelectionSetService.clear();
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        SelectionSetService.add(Id,null);
    };

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                Utils.truncateField(results.docs[i],'abstract',$scope.maxFieldLength);
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
        updatePageIndex();
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService','Utils','SelectionSetService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 */
function FacetSelectionController($scope, SolrSearchService) {

	// fields
    $scope.facets = [];              // list of facets
    $scope.target = 'defaultQuery';  // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet at the specified index.
     * @param Index Index of facet to remove.
     */
    $scope.remove = function(Index) {
        var facet = $scope.facets[Index];
        var query = SolrSearchService.getQuery($scope.target);
        if (query && facet) {
            query.removeFacet(facet.field);
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var facets = query.getFacets();
            for (var i=0;i<facets.length;i++) {
                $scope.facets.push(facets[i]);
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on($scope.target, function() {
        $scope.handleFacetListUpdate();
    });

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Facet field query controller. Fetches a list of facet values from the
 * search index for the specified field name. When a facet value is selected
 * by the user, it adds a facet constraint to the target named query, If a
 * named query is not specified, it adds and removes the constraint from the
 * default query. We assume here that the target and facet queries will not
 * change names during operation.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $http, SolrSearchService) {

    // parameters
    $scope.facets = [];                 // list of current query facets
    $scope.field = '';                  // facet field name and name of query
    $scope.isSelected = false;          // if the field is part of the target query
    $scope.items = [];                  // list of facet values for the specified field
    $scope.maxItems = 7;                // max number of results to display
    $scope.queryname = '';              // query name
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
        // create a new facet constraint
        var facet = SolrSearchService.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                query.addFacet($scope.queryname,facet);
                SolrSearchService.updateQuery($scope.target);
            }
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Update the list of facet values.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.items = [];
        // determine if we've added a facet constraint for this field in the target query
        // we do if there is, then we will set isSelected for this field controller so that
        // we can change the display to reflect that
        var targetquery = SolrSearchService.getQuery($scope.target);
        var facets = targetquery.getFacetsAsDictionary();
        if ($scope.queryname in facets) {
            $scope.isSelected = true;
        } else {
            $scope.isSelected = false;
        }
        // get the list of facets for the query
        var query = SolrSearchService.getQuery($scope.queryname);
        var results = query.getFacetCounts();
        if (results && results.facet_fields) {
            if (results.hasOwnProperty('facet_fields')) {
                for (var i = 0; i < results.facet_fields[$scope.field].length && $scope.items.length <$scope.maxItems; i+=2) {
                    var label = results.facet_fields[$scope.field][i];
                    var count = results.facet_fields[$scope.field][i+1];
                    var result = new FacetResult(label,count);
                    $scope.items.push(result);
                }
            }
        }
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
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.queryname);
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
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events on the query and refresh
        // the facet list
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the facet list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
            $scope.handleFacetListUpdate();
        }
    };

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','SolrSearchService'];/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Image based search controller.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 */
function ImageSearchResultsController($scope, CONSTANTS, SolrSearchService, Utils) {

	// parameters
    $scope.itemsPerPage = 16;           // the number of items per page
    $scope.itemsPerRow = 4;             // the number of items per row
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.rows = [];                   // document search results
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
	$scope.query = '';

	///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
	$scope.init = function() {
        // redefine the default search query to ensure that only records with
        // digital objects show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter("imageQuery","+dobj_type:*");
            return query;
        };
        var query = SolrSearchService.createQuery();
        query.setOption("rows",$scope.itemsPerPage);
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
	};

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
	$scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.itemsPerRow) {
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
        updatePageIndex();
	};

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','CONSTANTS','SolrSearchService','Utils'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Displays a map of the current search results and can optionally display
 * error and warning messages to the user.
 * @param $scope Controller scope
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {
    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterResults = true;   // use cluster manager
    $scope.count = 5000;            // the total number of records
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.userquery = "*:*";       // user query

    var categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    var clusterOptions = {
        styles: [
            { height: 53, url: "img/map/m1.png", width: 53 },
            { height: 56, url: "img/map/m2.png", width: 56 },
            { height: 66, url: "img/map/m3.png", width: 66 },
            { height: 78, url: "img/map/m4.png", width: 78 },
            { height: 90, url: "img/map/m5.png", width: 90 }
        ]};
    var infoWindow = new google.maps.InfoWindow();      // google map info window
    var settings = {                                    // map settings
        center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl:false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId:google.maps.MapTypeId.TERRAIN,
        navigationControl:true,
        navigationControlOptions:{
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions:{
            style:google.maps.ZoomControlStyle.LARGE
        }
    };

    /**
     * Determine if two arrays are equal.
     * @param A Array
     * @param B Array
     * @return {Boolean}
     */
    function arraysAreEqual(A, B) {
        return (A.join('') == B.join(''));
    }

    /**
     * Determine if two objects are equal.
     * @param A Object
     * @param B Object
     * @return {Boolean}
     * @see http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
     */
    function objectsAreEqual(A, B) {
        // if both x and y are null or undefined and exactly the same
        if ( A === B ) return true;
        // if they are not strictly equal, they both need to be Objects
        if ( ! ( A instanceof Object ) || ! ( B instanceof Object ) ) return false;
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.
        if ( A.constructor !== B.constructor ) return false;
        for ( var p in A ) {
            // other properties were tested using x.constructor === y.constructor
            if ( ! A.hasOwnProperty( p ) ) continue;
            // allows to compare x[ p ] and y[ p ] when set to undefined
            if ( ! B.hasOwnProperty( p ) ) return false;
            // if they have the same strict value or identity then they are equal
            if ( A[ p ] === B[ p ] ) continue;
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if ( typeof( A[ p ] ) !== "object" ) return false;
            // Objects and Arrays must be tested recursively
            if ( ! Object.equals( A[ p ],  B[ p ] ) ) return false;
        }
        for ( p in B ) {
            // allows x[ p ] to be set to undefined
            if ( B.hasOwnProperty( p ) && ! A.hasOwnProperty( p ) ) return false;
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Handle update event for a related map view query. If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.checkUpdate = function() {
        var defaultQuery = SolrSearchService.getQuery();
        var existingMapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new location query and update the view
        if (defaultQuery.getUserQuery() !== existingMapQuery.getUserQuery() ||
            !objectsAreEqual(defaultQuery.getUserQueryParameters(),existingMapQuery.getUserQueryParameters())) {
            var userQuery = defaultQuery.getUserQuery();
            var userQueryParams = defaultQuery.getUserQueryParameters();
            var query = $scope.getMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams[$scope.queryname] = "+location_0_coordinate:[* TO *]";
            query.setUserQueryParameters(userQueryParams);
            SolrSearchService.setQuery(query,$scope.queryname);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Create a default map query. There is no way to tell Solr to return ALL
     * records, consequently we need to either tell it to return a very large
     * number of records or we need to tell it to return exactly the number of
     * records that are available. There is no processing required if we just
     * ask for a really large number of documents, so we'll do that here.
     */
    $scope.getMapQuery = function() {
        var query = SolrSearchService.createQuery();
        query.setOption('fl','abstract,country,dobj_proxy_small,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,presentation_url,region,title,toDate');
        query.setOption("rows",$scope.count);
        query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
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
    $scope.getMarker = function (Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = categoryToIconMap['default'];
        if (Category != null && Category in categoryToIconMap) {
            icon = categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title
        });
        // attach an info window to the marker
        $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Handle selection events.
     */
    $scope.handleSelection = function() {
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
            // @todo enable multiple selection .. ie. multiple infowindows!
            // this is a bit complicated because the selection set service can hold either single or multiple
            // values. however, for the moment, we want to show only a single info window here.
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
                    $scope.map.setCenter(bounds.getCenter());
                    $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                }
            }
        }
    };

    /**
     * Handle update to search query results.
     */
    $scope.handleUpdate = function () {
        // clear current markers
        $scope.idToMarkerMap = {};
        infoWindow.close();
        $scope.clusterManager.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // marker metadata
                    var content = "";
                    content += "<div class='infowindow'>";
                    if (item.dobj_proxy_small) {
                        content += "<div class='thumb'><a href='" + item.presentation_url + "'>" + "<img src='" + item.dobj_proxy_small + "' />" + "</a></div>";
                    }
                    content += "<div class='title'><a href='" + item.presentation_url + "'>" + item.title + "</a></div>";
                    content += "<div class='existdates'>" + Utils.formatDate(item.fromDate) + " - " + Utils.formatDate(item.toDate) + "</div>";
                    // content +=  "<div class='type'>" + item.type + "</div>";
                    content += "<div class='summary'>" + Utils.truncate(item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + " ";
                    content += "<a href='" + item.presentation_url + "' class='more'>more</a>" + "</div>";
                    content += "</div>" ;
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to clusterer
        $scope.clusterManager.addMarkers($scope.markers);
        // if the force center on start property is set, recenter the view
        if (CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
        } else {
            $scope.map.fitBounds(bounds);
        }
        // if there is an information message
        if ($scope.message && $scope.message != '') {
            console.log("Information message");
        }
        // if there is an error message
        if ($scope.error && $scope.error != '') {
            console.log("Error message");
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows",CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl",CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt","json");
            query.setOption("sort","title+asc");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
            return query;
        };
        // handle update events from the search service on the map query
        $scope.$on($scope.queryname, function() {
            $scope.handleUpdate();
        });
        // handle update events from the search service on the default query
        $scope.$on('defaultQuery', function() {
            $scope.checkUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // create a new mapping query
        var mapQuery = $scope.getMapQuery();
        // set and update the document query
        var defaultQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery(defaultQuery,'defaultQuery');
        SolrSearchService.updateQuery();
        // set and update the map query
        SolrSearchService.setQuery(mapQuery,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add info window to marker
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function (Map, Marker, Content) {
        google.maps.event.addListener(Marker, 'click', function () {
            infoWindow.close();
            infoWindow.setContent(Content);
            infoWindow.open(Map, Marker);
        });
    };

    ///////////////////////////////////////////////////////////////////////////

    // handle close click event on info window
    google.maps.event.addListener(infoWindow, 'close', function () {
        infoWindow.close();
    });

    // create map
    $scope.map = new google.maps.Map(document.getElementById("map"), settings);

    // create marker cluster manager
    $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','SelectionSetService','Utils','CONSTANTS'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // private

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var items = [];
        if ($scope.userquery.length >= minSearchLength) {
            for (var i=0;i<$scope.hints.length;i++) {
                var token = $scope.hints[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery(query,$scope.searchHintsQuery);
        // handle update events from the search service.
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleFacetListUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // if we need to reset the query parameters
        if ($scope.resetOnChange) {
            // create a new query and set the user query property
            // to the value provided by the user
            var query = SolrSearchService.createQuery();
            query.setQuery($scope.userquery);
            SolrSearchService.setQuery(query,$scope.target);
        } else {
            // keep the existing search query but change the current user query
            // value and set the starting document number to 0
            var query = SolrSearchService.getQuery($scope.target);
            query.setQuery($scope.userquery);
            query.setOption("start","0");
        }
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.load = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            var query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // get the new query
        var newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new query is the same as the last query, ignore it
            if (newquery != $scope.queries[0]) {
                // add new query to the top of the queue
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
     * Handle update events from the search service.
     */
    $scope.$on($scope.queryName, function() {
        $scope.handleFacetListUpdate();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];/**
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
    $scope.updateOnInit = false;                // update the facet list during init
    $scope.updateOnTargetChange = true;         // update the date range to reflect the target query results

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
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        // get the target user query
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        // update the start date
        query = SolrSearchService.getQuery($scope.startDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.startDateQueryName);
        // update the end date
        query = SolrSearchService.getQuery($scope.endDateQueryName);
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.endDateQueryName);
    };

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
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the date list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.startDateQueryName);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
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
            $scope.handleFacetListUpdate();
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
    $scope.handleFacetListUpdate = function() {
        $scope.updateStartDate();
        $scope.updateEndDate();
        // create and configure the slider control
        /*
        $("#range-slider").slider({
            min: $scope.startDate,
            max: $scope.endDate,
            values: [ $scope.startDate, $scope.endDate ],
            change: function(event,ui) {
                $scope.startDate = ui.values[0];
                $scope.endDate = ui.values[1];
                // $scope.$apply();
            },
            slide: function(event,ui) {
                // console.log("Slide: " + ui.values[0]  + " " + ui.values[1]);
            },
            start: function(event,ui) {
                // console.log("Start :");
            },
            stop: function(event,ui) {
                // console.log("Stop: " + ui.values[0]  + " " + ui.values[1]);
            }
        });
        */
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
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Document search result item.
 * @param Title
 * @param Uri
 * @param Location
 * @param Abstract
 */
function Document(Title, Uri, Location, Abstract) {
    var setIfDefined = function(Val) {
        if (Val) {
            return Val;
        }
        return '';
    };
    this.title = setIfDefined(Title);
    this.uri = setIfDefined(Uri);
    this.location = setIfDefined(Location);
    this.abstract = setIfDefined(Abstract);
}

/**
 * A page in a pagination list
 * @param Name Page name
 * @param Num Page number
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 * @param SelectionSetService Selection set service
 */
function DocumentSearchResultsController($scope, SolrSearchService, Utils, SelectionSetService) {

    // parameters
    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.maxFieldLength = 256;        // maximum length of string for presentation
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
    $scope.view = 'list';               // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        if (Id) {
            SelectionSetService.remove(Id);
        } else {
            SelectionSetService.clear();
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        SelectionSetService.add(Id,null);
    };

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                Utils.truncateField(results.docs[i],'abstract',$scope.maxFieldLength);
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
        updatePageIndex();
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService','Utils','SelectionSetService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Displays and manages the set of facet constraints on a named query.
 * @param $scope Controller scope
 */
function FacetSelectionController($scope, SolrSearchService) {

	// fields
    $scope.facets = [];              // list of facets
    $scope.target = 'defaultQuery';  // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet at the specified index.
     * @param Index Index of facet to remove.
     */
    $scope.remove = function(Index) {
        var facet = $scope.facets[Index];
        var query = SolrSearchService.getQuery($scope.target);
        if (query && facet) {
            query.removeFacet(facet.field);
            SolrSearchService.updateQuery($scope.target);
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        if (query) {
            var facets = query.getFacets();
            for (var i=0;i<facets.length;i++) {
                $scope.facets.push(facets[i]);
            }
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on($scope.target, function() {
        $scope.handleFacetListUpdate();
    });

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Facet field query controller. Fetches a list of facet values from the
 * search index for the specified field name. When a facet value is selected
 * by the user, it adds a facet constraint to the target named query, If a
 * named query is not specified, it adds and removes the constraint from the
 * default query. We assume here that the target and facet queries will not
 * change names during operation.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param SolrSearchService Solr search service
 */
function FieldFacetController($scope, $http, SolrSearchService) {

    // parameters
    $scope.facets = [];                 // list of current query facets
    $scope.field = '';                  // facet field name and name of query
    $scope.isSelected = false;          // if the field is part of the target query
    $scope.items = [];                  // list of facet values for the specified field
    $scope.maxItems = 7;                // max number of results to display
    $scope.queryname = '';              // query name
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
        // create a new facet constraint
        var facet = SolrSearchService.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                query.addFacet($scope.queryname,facet);
                SolrSearchService.updateQuery($scope.target);
            }
        }
        // @see https://github.com/angular/angular.js/issues/1179
        $event.preventDefault();
    };

    /**
     * Update the list of facet values.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.items = [];
        // determine if we've added a facet constraint for this field in the target query
        // we do if there is, then we will set isSelected for this field controller so that
        // we can change the display to reflect that
        var targetquery = SolrSearchService.getQuery($scope.target);
        var facets = targetquery.getFacetsAsDictionary();
        if ($scope.queryname in facets) {
            $scope.isSelected = true;
        } else {
            $scope.isSelected = false;
        }
        // get the list of facets for the query
        var query = SolrSearchService.getQuery($scope.queryname);
        var results = query.getFacetCounts();
        if (results && results.facet_fields) {
            if (results.hasOwnProperty('facet_fields')) {
                for (var i = 0; i < results.facet_fields[$scope.field].length && $scope.items.length <$scope.maxItems; i+=2) {
                    var label = results.facet_fields[$scope.field][i];
                    var count = results.facet_fields[$scope.field][i+1];
                    var result = new FacetResult(label,count);
                    $scope.items.push(result);
                }
            }
        }
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
        query.setQuery(userquery);
        SolrSearchService.updateQuery($scope.queryname);
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
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events on the query and refresh
        // the facet list
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the facet list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
            $scope.handleFacetListUpdate();
        }
    };

}

// inject dependencies
FieldFacetController.$inject = ['$scope','$http','SolrSearchService'];/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Image based search controller.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 */
function ImageSearchResultsController($scope, CONSTANTS, SolrSearchService, Utils) {

	// parameters
    $scope.itemsPerPage = 16;           // the number of items per page
    $scope.itemsPerRow = 4;             // the number of items per row
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.rows = [];                   // document search results
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
	$scope.query = '';

	///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
	$scope.init = function() {
        // redefine the default search query to ensure that only records with
        // digital objects show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter("imageQuery","+dobj_type:*");
            return query;
        };
        var query = SolrSearchService.createQuery();
        query.setOption("rows",$scope.itemsPerPage);
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
	};

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
	$scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.itemsPerRow) {
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
        updatePageIndex();
	};

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','CONSTANTS','SolrSearchService','Utils'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Displays a map of the current search results and can optionally display
 * error and warning messages to the user.
 * @param $scope Controller scope
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {
    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterOptions = {
        styles: [
            { height: 53, url: "img/map/cluster1.png", width: 53 },
            { height: 56, url: "img/map/cluster1.png", width: 56 },
            { height: 66, url: "img/map/cluster2.png", width: 66 },
            { height: 78, url: "img/map/cluster1.png", width: 78 },
            { height: 90, url: "img/map/cluster2.png", width: 90 }
        ]};
    $scope.clusterResults = true;   // use cluster manager
    $scope.count = 5000;            // the total number of records
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.userquery = "*:*";       // user query

    var categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    var infoWindow = new google.maps.InfoWindow();      // google map info window
    var settings = {                                    // map settings
        center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl:false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId:google.maps.MapTypeId.TERRAIN,
        navigationControl:true,
        navigationControlOptions:{
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions:{
            style:google.maps.ZoomControlStyle.LARGE
        }
    };

    /**
     * Determine if two arrays are equal.
     * @param A Array
     * @param B Array
     * @return {Boolean}
     */
    function arraysAreEqual(A, B) {
        return (A.join('') == B.join(''));
    }

    /**
     * Determine if two objects are equal.
     * @param A Object
     * @param B Object
     * @return {Boolean}
     * @see http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
     */
    function objectsAreEqual(A, B) {
        // if both x and y are null or undefined and exactly the same
        if ( A === B ) return true;
        // if they are not strictly equal, they both need to be Objects
        if ( ! ( A instanceof Object ) || ! ( B instanceof Object ) ) return false;
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.
        if ( A.constructor !== B.constructor ) return false;
        for ( var p in A ) {
            // other properties were tested using x.constructor === y.constructor
            if ( ! A.hasOwnProperty( p ) ) continue;
            // allows to compare x[ p ] and y[ p ] when set to undefined
            if ( ! B.hasOwnProperty( p ) ) return false;
            // if they have the same strict value or identity then they are equal
            if ( A[ p ] === B[ p ] ) continue;
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if ( typeof( A[ p ] ) !== "object" ) return false;
            // Objects and Arrays must be tested recursively
            if ( ! Object.equals( A[ p ],  B[ p ] ) ) return false;
        }
        for ( p in B ) {
            // allows x[ p ] to be set to undefined
            if ( B.hasOwnProperty( p ) && ! A.hasOwnProperty( p ) ) return false;
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Handle update event for a related map view query. If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.checkUpdate = function() {
        var defaultQuery = SolrSearchService.getQuery();
        var existingMapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new location query and update the view
        if (defaultQuery.getUserQuery() !== existingMapQuery.getUserQuery() ||
            !objectsAreEqual(defaultQuery.getUserQueryParameters(),existingMapQuery.getUserQueryParameters())) {
            var userQuery = defaultQuery.getUserQuery();
            var userQueryParams = defaultQuery.getUserQueryParameters();
            var query = $scope.getMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams[$scope.queryname] = "+location_0_coordinate:[* TO *]";
            query.setUserQueryParameters(userQueryParams);
            SolrSearchService.setQuery(query,$scope.queryname);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Create a default map query. There is no way to tell Solr to return ALL
     * records, consequently we need to either tell it to return a very large
     * number of records or we need to tell it to return exactly the number of
     * records that are available. There is no processing required if we just
     * ask for a really large number of documents, so we'll do that here.
     */
    $scope.getMapQuery = function() {
        var query = SolrSearchService.createQuery();
        query.setOption('fl','abstract,country,dobj_proxy_small,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,presentation_url,region,title,toDate');
        query.setOption("rows",$scope.count);
        query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
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
    $scope.getMarker = function (Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = categoryToIconMap['default'];
        if (Category != null && Category in categoryToIconMap) {
            icon = categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title
        });
        // attach an info window to the marker
        $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Handle selection events.
     */
    $scope.handleSelection = function() {
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
            // @todo enable multiple selection .. ie. multiple infowindows!
            // this is a bit complicated because the selection set service can hold either single or multiple
            // values. however, for the moment, we want to show only a single info window here.
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
                    $scope.map.setCenter(bounds.getCenter());
                    $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                }
            }
        }
    };

    /**
     * Handle update to search query results.
     */
    $scope.handleUpdate = function () {
        // clear current markers
        $scope.idToMarkerMap = {};
        infoWindow.close();
        $scope.clusterManager.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // marker metadata
                    var content = "";
                    content += "<div class='infowindow'>";
                    if (item.dobj_proxy_small) {
                        content += "<div class='thumb'><a href='" + item.presentation_url + "'>" + "<img src='" + item.dobj_proxy_small + "' />" + "</a></div>";
                    }
                    content += "<div class='title'><a href='" + item.presentation_url + "'>" + item.title + "</a></div>";
                    content += "<div class='existdates'>" + Utils.formatDate(item.fromDate) + " - " + Utils.formatDate(item.toDate) + "</div>";
                    // content +=  "<div class='type'>" + item.type + "</div>";
                    content += "<div class='summary'>" + Utils.truncate(item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + " ";
                    content += "<a href='" + item.presentation_url + "' class='more'>more</a>" + "</div>";
                    content += "</div>" ;
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to clusterer
        $scope.clusterManager.addMarkers($scope.markers);
        // if the force center on start property is set, recenter the view
        if (CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
        } else {
            $scope.map.fitBounds(bounds);
        }
        // if there is an information message
        if ($scope.message && $scope.message != '') {
            console.log("Information message");
        }
        // if there is an error message
        if ($scope.error && $scope.error != '') {
            console.log("Error message");
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows",CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl",CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt","json");
            query.setOption("sort","title+asc");
            query.setQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
            return query;
        };
        // handle update events from the search service on the map query
        $scope.$on($scope.queryname, function() {
            $scope.handleUpdate();
        });
        // handle update events from the search service on the default query
        $scope.$on('defaultQuery', function() {
            $scope.checkUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // create a new mapping query
        var mapQuery = $scope.getMapQuery();
        // set and update the document query
        var defaultQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery(defaultQuery,'defaultQuery');
        SolrSearchService.updateQuery();
        // set and update the map query
        SolrSearchService.setQuery(mapQuery,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add info window to marker
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function (Map, Marker, Content) {
        google.maps.event.addListener(Marker, 'click', function () {
            infoWindow.close();
            infoWindow.setContent(Content);
            infoWindow.open(Map, Marker);
        });
    };

    ///////////////////////////////////////////////////////////////////////////

    // handle close click event on info window
    google.maps.event.addListener(infoWindow, 'close', function () {
        infoWindow.close();
    });

    // create map
    $scope.map = new google.maps.Map(document.getElementById("map"), settings);

    // create marker cluster manager
    $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','SelectionSetService','Utils','CONSTANTS'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // private

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var items = [];
        if ($scope.userquery.length >= minSearchLength) {
            for (var i=0;i<$scope.hints.length;i++) {
                var token = $scope.hints[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery(query,$scope.searchHintsQuery);
        // handle update events from the search service.
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleFacetListUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // if we need to reset the query parameters
        if ($scope.resetOnChange) {
            // create a new query and set the user query property
            // to the value provided by the user
            var query = SolrSearchService.createQuery();
            query.setQuery($scope.userquery);
            SolrSearchService.setQuery(query,$scope.target);
        } else {
            // keep the existing search query but change the current user query
            // value and set the starting document number to 0
            var query = SolrSearchService.getQuery($scope.target);
            query.setQuery($scope.userquery);
            query.setOption("start","0");
        }
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.load = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            var query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // get the new query
        var newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new query is the same as the last query, ignore it
            if (newquery != $scope.queries[0]) {
                // add new query to the top of the queue
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
     * Handle update events from the search service.
     */
    $scope.$on($scope.queryName, function() {
        $scope.handleFacetListUpdate();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];/**
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
    $scope.updateOnInit = false;                // update the facet list during init
    $scope.updateOnTargetChange = true;         // update the date range to reflect the target query results

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
     * Handle update event from the target query. Update the facet list to
     * reflect the target query result set.
     */
    $scope.handleTargetQueryUpdate = function() {
        // get the target user query
        var query = SolrSearchService.getQuery($scope.target);
        var userquery = query.getUserQuery();
        // update the start date
        query = SolrSearchService.getQuery($scope.startDateQueryName);
        query.setUserQuery(userquery);
        SolrSearchService.updateQuery($scope.startDateQueryName);
        // update the end date
        query = SolrSearchService.getQuery($scope.endDateQueryName);
        query.setUserQuery(userquery);
        SolrSearchService.updateQuery($scope.endDateQueryName);
    };

    /**
     * Update the controller state.
     */
    $scope.handleUpdate = function() {
        $scope.updateStartDate();
        $scope.updateEndDate();
    };

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
        // watch the target query for updates and refresh our
        // facet list when the target changes
        if ($scope.updateOnTargetChange) {
            $scope.$on($scope.target, function () {
                $scope.handleTargetQueryUpdate();
            });
        }
        // if we should update the date list during init
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.startDateQueryName);
            SolrSearchService.updateQuery($scope.endDateQueryName);
        }
    };

    /**
     * Set the start and end date facet constraint. The start year must be equal to or less than the end year.
     * @param $event
     * @param Start Start year
     * @param End End year
     */
    $scope.set = function($event,Start,End) {
        if (Start <= End) {
            $scope.startDate = Start;
            $scope.endDate = End;
            // update the facet constraint
            $scope.handleUpdate();
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

}

// inject controller dependencies
DateFacetController.$inject = ['$scope','SolrSearchService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Document search result item.
 * @param Title
 * @param Uri
 * @param Location
 * @param Abstract
 */
function Document(Title, Uri, Location, Abstract) {
    var setIfDefined = function(Val) {
        if (Val) {
            return Val;
        }
        return '';
    };
    this.title = setIfDefined(Title);
    this.uri = setIfDefined(Uri);
    this.location = setIfDefined(Location);
    this.abstract = setIfDefined(Abstract);
}

/**
 * A page in a pagination list
 * @param Name Page name
 * @param Num Page number
 */
function Page(Name,Num) {
    this.name = Name;
    this.number = Num;
    this.isActive = false;
    this.isDisabled = false;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Displays text based search results and pager.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param Utils Utility functions
 * @param SelectionSetService Selection set service
 */
function DocumentSearchResultsController($scope, SolrSearchService, Utils, SelectionSetService) {

    // parameters
    $scope.documents = [];              // document search results
    $scope.itemsPerPage = 10;           // the number of search results per page
    $scope.maxFieldLength = 256;        // maximum length of string for presentation
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
    $scope.view = 'list';               // presentation type

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        if (Id) {
            SelectionSetService.remove(Id);
        } else {
            SelectionSetService.clear();
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        SelectionSetService.add(Id,null);
    };

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.documents = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                // clean up document fields
                results.docs[i].fromDate = Utils.formatDate(results.docs[i].fromDate);
                results.docs[i].toDate = Utils.formatDate(results.docs[i].toDate);
                Utils.truncateField(results.docs[i],'abstract',$scope.maxFieldLength);
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
        updatePageIndex();
    };

}

// inject controller dependencies
DocumentSearchResultsController.$inject = ['$scope','SolrSearchService','Utils','SelectionSetService'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/**
 * Displays and manages the set of facet constraints on a named query.
 *
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 */
function FacetSelectionController($scope, SolrSearchService) {

    $scope.facetkeys = [];              // facet key from target query
    $scope.facets = [];                 // facets
    $scope.target = 'defaultQuery';     // target query name

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Remove the facet constraint from the target query.
     * @param Index Index of facet in the facet list
     */
    $scope.remove = function(Index) {
        var key = $scope.facetkeys[Index];
        var query = SolrSearchService.getQuery($scope.target);
        query.removeFacet(key);
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        $scope.facetkeys = [];
        $scope.facets = [];
        var query = SolrSearchService.getQuery($scope.target);
        var facets = query.getFacets();
        for (var key in facets) {
            $scope.facetkeys.push(key);
            $scope.facets.push(facets[key]);
        }
    };

    /**
     * Handle update events from the search service.
     */
    $scope.$on($scope.target, function() {
        $scope.handleFacetListUpdate();
    });

}

// inject controller dependencies
FacetSelectionController.$inject = ['$scope','SolrSearchService'];
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
        // create a new facet constraint
        var facet = SolrSearchService.createFacet($scope.field,$scope.items[Index].value);
        // check to see if the selected facet is already in the list
        if ($scope.facets.indexOf(facet) == -1) {
            // add the facet, update search results
            var query = SolrSearchService.getQuery($scope.target);
            if (query) {
                var id = Math.floor(Math.random()*101);
                var name = $scope.queryname + id;
                query.addFacet(name,facet);
                SolrSearchService.updateQuery($scope.target);
            }
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
        SolrSearchService.setQuery(query,$scope.queryname);
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
FieldFacetController.$inject = ['$scope','SolrSearchService'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Image based search controller.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service.
 * @param CONSTANTS Application constants
 */
function ImageSearchResultsController($scope, SolrSearchService, CONSTANTS) {

	// parameters
    $scope.itemsPerPage = 16;           // the number of items per page
    $scope.itemsPerRow = 4;             // the number of items per row
    $scope.page = 0;                    // the current search result page
    $scope.pages = [];                  // list of pages in the current navigation set
    $scope.pagesPerSet = 10;            // the number of pages in a navigation set
    $scope.rows = [];                   // document search results
    $scope.queryname = "defaultQuery";  // the query name
    $scope.startPage = 0;               // zero based start page index
    $scope.totalPages = 1;              // count of the total number of result pages
    $scope.totalResults = 0;            // count of the total number of search results
    $scope.totalSets = 1;               // count of the number of search result sets
	$scope.query = '';

	///////////////////////////////////////////////////////////////////////////

    /**
     * Update page index for navigation of search results.
     */
    function updatePageIndex() {
        // the default page navigation set
        $scope.pages = [];
        // get query results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs && results.docs.length > 0) {
            // calculate the total number of pages and sets
            $scope.totalPages = Math.ceil(results.numFound / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // determine the current page, current page set
            var currentPage = Math.floor($scope.page/$scope.itemsPerPage);
            var currentSet = Math.floor(currentPage/$scope.pagesPerSet);
            // determine the first and last page in the set
            var firstPageInSet = currentSet * $scope.pagesPerSet;
            var lastPageInSet = firstPageInSet + $scope.pagesPerSet - 1;
            if (lastPageInSet>=$scope.totalPages) {
                lastPageInSet = lastPageInSet - (lastPageInSet - $scope.totalPages) - 1;
            }
            // link to previous set
            if ($scope.totalSets>1 && currentSet!=0) {
                var previousSet = (currentSet - 1) * $scope.itemsPerPage;
                var prevPage = new Page("«",previousSet);
                $scope.pages.push(prevPage);
            }
            // page links
            for (var i=firstPageInSet;i<=lastPageInSet;i++) {
                var page = new Page(i+1,i*$scope.itemsPerPage);
                if (page.number==$scope.page) {
                    page.isActive = true;
                }
                $scope.pages.push(page);
            }
            // link to next set
            if ($scope.totalSets>1 && currentSet<$scope.totalSets-1) {
                var nextSet = (lastPageInSet*$scope.itemsPerPage) + $scope.itemsPerPage;
                var nextPage = new Page("»",nextSet);
                $scope.pages.push(nextPage);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
	$scope.init = function() {
        // redefine the default search query to ensure that only records with
        // digital objects show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setUserQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter("imageQuery","+dobj_type:*");
            return query;
        };
        var query = SolrSearchService.createQuery();
        query.setOption("rows",$scope.itemsPerPage);
        SolrSearchService.setQuery(query,$scope.queryname);
        // handle update events from the search service
        $scope.$on($scope.queryname, function () {
            $scope.handleFacetListUpdate();
        });
        // update the search results
        SolrSearchService.updateQuery($scope.queryname);
	};

    /**
     * Set the current page.
     * @param PageNumber
     */
    $scope.setPage = function(PageNumber) {
        $scope.page = PageNumber;
        SolrSearchService.setPage(PageNumber,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
	$scope.handleFacetListUpdate = function() {
        // clear current results
        $scope.rows = [];
        // get new results
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            $scope.totalResults = results.numFound;
            $scope.totalPages = Math.ceil($scope.totalResults / $scope.itemsPerPage);
            $scope.totalSets = Math.ceil($scope.totalPages / $scope.pagesPerSet);
            // add new results
            var count = 0;
            var row = [];
            for (var i=0;i<results.docs.length && i<$scope.itemsPerPage;i++) {
                row.push(results.docs[i]);
                count++;
                // create a new row
                if (count >= $scope.itemsPerRow) {
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
        updatePageIndex();
	};

}

// inject dependencies
ImageSearchResultsController.$inject = ['$scope','SolrSearchService','CONSTANTS'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Display a map of search results for documents with location attributes.
 * Unlike other controllers, the map controller tries to display all search
 * results at once.
 * The map controller listens for updates on a specified target query. When an
 * update occurs, the map query duplicates the query but sets the number of
 * rows to $scope.count (a very large number) so that it can show as many
 * documents as possible.
 *
 * @param $scope Controller scope
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {

    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterOptions = {
        styles: [
            { height: 24, url: "img/map/cluster1.png", width: 24 },
            { height: 36, url: "img/map/cluster2.png", width: 36 },
            { height: 48, url: "img/map/cluster3.png", width: 48 },
            { height: 64, url: "img/map/cluster4.png", width: 64 },
            { height: 82, url: "img/map/cluster5.png", width: 82 }
        ]};
    $scope.clusterResults = true;   // use cluster manager
    $scope.count = 5000;            // the total number of records
    $scope.firstUpdate = true;      // flag to
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.target = "defaultQuery"; // query to monitor
    $scope.updateOnInit = true;     // update the result set during init

    var categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    var infoWindow = new google.maps.InfoWindow();      // google map info window
    var settings = {                                    // map settings
        center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl:false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId:google.maps.MapTypeId.TERRAIN,
        navigationControl:true,
        navigationControlOptions:{
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions:{
            style:google.maps.ZoomControlStyle.LARGE
        }
    };

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
        query.setOption('fl','abstract,country,dobj_proxy_small,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,presentation_url,region,title,toDate');
        query.setOption("rows",$scope.count);
        query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
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
    $scope.getMarker = function (Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = categoryToIconMap['default'];
        if (Category != null && Category in categoryToIconMap) {
            icon = categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title
        });
        // attach an info window to the marker
        $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Get the map marker InfoWindow content.
     * @param Item
     * @returns {String} HTML content for map InfoWindow
     */
    $scope.getMarkerContent = function(Item) {
        var content = "<div class='infowindow'>";
        if (Item.dobj_proxy_small) {
            content += "<div class='thumb'><a href='" + Item.presentation_url + "'>" + "<img src='" + Item.dobj_proxy_small + "' />" + "</a></div>";
        }
        content += "<div class='title'><a href='" + Item.presentation_url + "'>" + Item.title + "</a></div>";
        content += "<div class='existdates'>" + Utils.formatDate(Item.fromDate) + " - " + Utils.formatDate(Item.toDate) + "</div>";
        // content +=  "<div class='type'>" + item.type + "</div>";
        content += "<div class='summary'>" + Utils.truncate(Item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + " ";
        content += "<a href='" + Item.presentation_url + "' class='more'>more</a>" + "</div>";
        content += "</div>" ;
        return content;
    };

    /**
     * Handle update to map search results. Clear the existing collection of
     * map markers and add new map markers to the map.
     */
    $scope.handleMapUpdate = function () {
        // make sure that the infowindow is closed
        infoWindow.close();
        // clear current markers
        $scope.idToMarkerMap = {};
        $scope.clusterManager.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // create a marker
                    var content = $scope.getMarkerContent(item);
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to cluster manager
        if ($scope.clusterResults) {
            $scope.clusterManager.addMarkers($scope.markers);
        }
        // center the view on the markers
        if ($scope.firstUpdate &&
            CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
            $scope.firstUpdate = false;
        } else {
            $scope.map.fitBounds(bounds);
        }
    };

    /**
     * Handle selection events. The selection set service can hold either
     * single or multiple values. However, we show only a single info
     * window in the current implementation.
     * @todo enable multiple selection .. ie. multiple infowindows
     */
    $scope.handleSelection = function() {
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
                    $scope.map.setCenter(bounds.getCenter());
                    $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                }
            }
        }
    };

    /**
     * Handle update event for a related map view query. If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.handleTargetUpdate = function() {
        var targetQuery = SolrSearchService.getQuery($scope.target);
        var mapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new map query and update the view
        if (targetQuery.getUserQuery() !== mapQuery.getUserQuery() ||
            !Utils.objectsAreEqual(targetQuery.getUserQueryParameters(),mapQuery.getUserQueryParameters())) {
            var userQuery = targetQuery.getUserQuery();
            var userQueryParams = targetQuery.getUserQueryParameters();
            var query = $scope.createMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams[$scope.queryname] = "+location_0_coordinate:[* TO *]";
            query.setQueryParameters(userQueryParams);
            SolrSearchService.setQuery(query,$scope.queryname);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        // @todo consider implementing this through the application instead
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows",CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl",CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt","json");
            query.setOption("sort","title+asc");
            query.setUserQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
            return query;
        };
        var targetQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery(targetQuery,$scope.target);
        // create a new map query
        var mapQuery = $scope.createMapQuery();
        SolrSearchService.setQuery(mapQuery,$scope.queryname);
        // handle update events on the target query
        $scope.$on($scope.target, function() {
            $scope.handleTargetUpdate();
        });
        // handle update events on the map query
        $scope.$on($scope.queryname, function() {
            $scope.handleMapUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // update search results
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Add info window to marker
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function (Map, Marker, Content) {
        google.maps.event.addListener(Marker, 'click', function () {
            infoWindow.close();
            infoWindow.setContent(Content);
            infoWindow.open(Map, Marker);
        });
    };

    ///////////////////////////////////////////////////////////////////////////

    // handle close click event on info window
    google.maps.event.addListener(infoWindow, 'close', function () {
        infoWindow.close();
    });

    // create map
    $scope.map = new google.maps.Map(document.getElementById("map"), settings);

    // create marker cluster manager
    $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','SelectionSetService','Utils','CONSTANTS'];/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides auto-complete and extended search support aids.
 * @param $scope Controller scope
 * @param SolrSearchService Apache Solr search service interface
 * @param Utils Utility functions
 * @see http://jsfiddle.net/DNjSM/17/
 */
function SearchBoxController($scope, SolrSearchService, Utils) {

    // the list of search hints
    $scope.hints = [];

    // If true, when a user enters a new query string, the target query will be
    // replaced with a new query and the user query property will be set, If
    // false, only the user query and start properties will be changed and the
    // query results will be reloaded.
    $scope.resetOnChange = false;

    // the field name where search hints are taken from
    $scope.searchHintsField = 'title_city';

    // the name of the query that returns the list of search hints
    $scope.searchHintsQuery = "searchHintsQuery";

    // the name of the main query
    $scope.target = "defaultQuery";

    // the query string provided by the user
    $scope.userquery = "";

    // private

    // the minimum number characters that the user should enter before the list
    // of search hints is displayed
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @return {Array}
     */
    $scope.getHints = function() {
        var items = [];
        if ($scope.userquery.length >= minSearchLength) {
            for (var i=0;i<$scope.hints.length;i++) {
                var token = $scope.hints[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // create a query to get a list of search hints
        var query = SolrSearchService.createQuery();
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",$scope.searchHintsField);
        SolrSearchService.setQuery(query,$scope.searchHintsQuery);
        // handle update events from the search service.
        $scope.$on($scope.searchHintsQuery, function() {
            $scope.handleFacetListUpdate();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.searchHintsQuery);
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        // clean up the user query
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        // if we need to reset the query parameters
        if ($scope.resetOnChange) {
            // create a new query and set the user query property
            // to the value provided by the user
            var query = SolrSearchService.createQuery();
            query.setUserQuery($scope.userquery);
            SolrSearchService.setQuery(query,$scope.target);
        } else {
            // keep the existing search query but change the current user query
            // value and set the starting document number to 0
            var query = SolrSearchService.getQuery($scope.target);
            query.setUserQuery($scope.userquery);
            query.setOption("start","0");
        }
        // update the search results
        SolrSearchService.updateQuery($scope.target);
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        var query = SolrSearchService.getQuery($scope.searchHintsQuery);
        var results = query.getFacetCounts();
        if (results && results.hasOwnProperty('facet_fields')) {
            // get the hint list, which we expect is already
            // sorted and contains only unique terms
            var result = results.facet_fields[$scope.searchHintsField];
            if (result) {
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    $scope.hints.push(item);
                }
            }
        }
    };

}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','SolrSearchService', 'Utils'];
/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Search history controller. Lists the last N user search queries. Takes the
 * form of a queue.
 * @param $scope Controller scope
 * @param SolrSearchService Solr search service
 * @param CONSTANTS Application constants
 */
function SearchHistoryController($scope,SolrSearchService,CONSTANTS) {

    // parameters
    $scope.maxItems = 5;                // the maximum number of items to display
    $scope.queries = [];                // list of user queries in reverse order
    $scope.queryName = 'defaultQuery';  // the name of the query to watch

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Load the specified query into the view.
     * @param QueryIndex The index of the query object in the queries list.
     * @todo complete this function
     */
    $scope.load = function(QueryIndex) {
        if (QueryIndex >= 0 && QueryIndex <= $scope.queries.length) {
            var query = $scope.queries[QueryIndex];
            if (query) {
                // set the query in the search service, then force it to update
            }
        }
    };

    /**
     * Update the controller state.
     */
    $scope.handleFacetListUpdate = function() {
        // get the new query
        var newquery = SolrSearchService.getQuery($scope.queryName);
        // if there are existing queries
        if ($scope.queries.length > 0) {
            // if the new query is the same as the last query, ignore it
            if (newquery != $scope.queries[0]) {
                // add new query to the top of the queue
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
     * Handle update events from the search service.
     */
    $scope.$on($scope.queryName, function() {
        $scope.handleFacetListUpdate();
    });

};

// inject controller dependencies
SearchHistoryController.$inject = ['$scope','SolrSearchService','CONSTANTS'];