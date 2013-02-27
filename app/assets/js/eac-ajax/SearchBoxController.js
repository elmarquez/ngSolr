/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides autocomplete and extended search support aids. This is a 
 * rudimentary, non-optimal implementation.
 * @param $scope Controller scope
 * @param SolrSearchService Document search service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 * @see http://jsfiddle.net/DNjSM/17/
 * @todo reimplement to use SolrSearchService to execute all queries
 */
function SearchBoxController($scope, $http, SolrSearchService, Utils, CONSTANTS) {

    $scope.target = "defaultQuery";
    $scope.userquery = "";

    // private
    var fieldname = "title";
    var tokens = new Array();
    var minSearchLength = 1;

    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * Update the list of search hints.
     * @param userQuery Current user query fragment
     */
    $scope.getHints = function() {
        var items = new Array();
        if ($scope.userquery.length>= minSearchLength) {
            for (var i=0;i<tokens.length;i++) {
                var token = tokens[i];
                if (Utils.startsWith(token,$scope.userquery)) {
                    items.push(token);
                }
            }
        }
        return items;
    }

    /**
     * Initialize the controller.
     * @todo move the query entity into the SolrSearchService
     */
    $scope.init = function() {
        // build hint list query
        var query = new SolrQuery(CONSTANTS.SOLR_BASE,CONSTANTS.SOLR_CORE);
        query.setOption("wt","json");
        query.setOption("facet","true");
        query.setOption("facet.limit","-1");
        query.setOption("facet.field",fieldname);
        // get results once
        console.log("GET " + query.getUrl());
        $http.get(query.getUrl())
            .success(function(data) {
                // get the term list, which we expect is already 
                // sorted and contains only unique terms
                var result = data.facet_counts.facet_fields[fieldname];
                // transform all results to lowercase, add to list
                for (var i=0;i<result.length;i+=2) {
                    var item = result[i].toLowerCase();
                    tokens.push(item);
                }
            })
            .error(function(data,status,headers,config) {
                console.log("Could not load search hints. Server returned error code " + status + ".");
            });
    };

    /**
     * Handle submit event.
     */
    $scope.submit = function() {
        var trimmed = Utils.trim($scope.userquery);
        if (trimmed === '') {
            $scope.userquery = "*:*";
        }
        SolrSearchService.setUserQuery($scope.userquery);
        SolrSearchService.updateQuery($scope.target);
    }

};

// inject controller dependencies
SearchBoxController.$inject = ['$scope','$http','SolrSearchService', 'Utils', 'CONSTANTS'];
