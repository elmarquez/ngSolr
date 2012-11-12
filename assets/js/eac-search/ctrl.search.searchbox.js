/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/** 
 * Determine if the string s1 starts with the string s2
 * @param s1 String 1
 * @param s2 String 2
 */
function startsWith(s1,s2) {
    if (s1 && s2) {
        return s1.slice(0, s2.length) == s2;
    }
    return false;
};

/*---------------------------------------------------------------------------*/
/* Controllers                                                               */

/**
 * Provides autocomplete and extended search support aids. This is a 
 * rudimentary, non-optimal implementation.
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 * @see http://jsfiddle.net/DNjSM/17/
 * @todo Reimplement with a proper data structure for search set
 */
function SearchBoxController($scope,$http,CONSTANTS) {
    // private
    var fieldname = "title";
    var tokens = new Array();
    var minSearchLength = 1;
    var userQuery = "";
    
    var query = new SearchQuery(CONSTANTS.SOLR_BASE,CONSTANTS.SOLR_CORE);
    query.setOption("wt","json");
    query.setOption("facet","true");
    query.setOption("facet.limit","-1");
    query.setOption("facet.field",fieldname);

    // get the hints list once
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
    
    /**
     * Update the list of search hints.
     * @param userQuery Current user query fragment
     */
    $scope.getHints = function(userQuery) {
        var items = new Array();
        if (userQuery.length>= minSearchLength) {
            for (var i=0;i<tokens.length;i++) {
                var token = tokens[i];
                if (startsWith(token,userQuery)) {
                    items.push(token);
                }
            }
        }
        return items;
    }

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
    }
    
    /**
     * Update the user query value
     * @param userQuery
     */
    $scope.updateQuery = function(userQuery) {
        $scope.$parent.userQuery = userQuery;
    }
}

// inject controller dependencies
SearchBoxController.$inject = ['$scope','$http','CONSTANTS'];
