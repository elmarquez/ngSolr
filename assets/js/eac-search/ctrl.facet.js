/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/**
 * Search facet
 * @see http://wiki.apache.org/solr/SimpleFacetParameters#rangefaceting
 */
function Facet(Field) {
  // basic faceting
  this.field = Field;     // field name
  this.sort = 'count';    // sort based on item count, lexicographi index
  this.limit = 100;       // maximum instances to be returned
  this.mincount = 0;      // minimum instance count for the facet to be returned
  // range faceting
  this.range = '';        // parameter name
  this.range.start = '';  // start value
  this.range.end = '';    // end value
  // build a query fragment for this facet
  this.getQueryFragment = function() {
    var query = '';
    for (var key in this) {
      query = query + "&" + key + "=" + encodeURIComponent(this[key]);
    }
    return query;
  }
}

function FacetResult(Name,Score) {
    this.name = Name;
    this.score = Score;
}

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/**
 * Parse result list into a format that is easier to present.
 */
function parse(FacetList,Limit) {
    var items = new Array();
    if (FacetList) {
        for (var i=0,j=1;j<FacetList.length,items.length<Limit;i+=2,j+=2) {
            var result = new FacetResult(FacetList[i],FacetList[j]);
            items.push(result);
        }
    }
    return items;
}

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * EAC Facet Controller
 */
function facetCtrl($scope, $http, CONSTANTS) {
    // parameters
    $scope.fieldname = '';   // facet field name
    $scope.items = null;     // results
    $scope.maxresults = 5;  // max number of results to display
    // query 
    var query = new SearchQuery(CONSTANTS.SOLRBASE);
    query.setOption("facet","true");
    query.setOption("wt","json");
    // Update the result set
    $scope.update = function() {
        $scope.error = null;
        $scope.message = null;
        // we update this here on the assumption that it has been 
        // updated since first defining the controller 
        // through an ng-init
        query.setOption("facet.field",$scope.fieldname);
        console.log("GET " + query.getQuery());
        $http.get(query.getQuery())
            .success(function(data) {
                $scope.items = parse(data.facet_counts.facet_fields[$scope.fieldname],$scope.maxresults);
            })
            .error(function(data,status,headers,config) {
                console.log("Could not load facet results for '" + $scope.fieldname + "'");
            });
    }
}
facetCtrl.$inject = ['$scope','$http','CONSTANTS'];
