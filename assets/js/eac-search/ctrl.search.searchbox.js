/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Classes                                                                   */

/*---------------------------------------------------------------------------*/
/* Functions                                                                 */

/** 
 * Determine if the string s1 starts with the string s2
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
 * @see http://jsfiddle.net/DNjSM/17/
 */
function searchBoxCtrl($scope,$http,CONSTANTS) {
    // private
    var fieldname = "title";
    var tokens = new Array();
    var query = new SearchQuery(CONSTANTS.SOLRBASE);
    var minSearchLength = 1;
    query.setOption("wt","json");
    query.setOption("facet","true");
    query.setOption("facet.limit","-1");
    query.setOption("facet.field",fieldname);
    // get the term list
    $http.get(query.getQuery())
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
            console.log("Could not load autocomplete results. Server returned error code " + status + ".");
        });
    // update the presented autocomplete list
    $scope.getHints = function (term) {
        var items = new Array();
        if (term.length>= minSearchLength) {
            for (var i=0;i<tokens.length;i++) {
                var token = tokens[i];
                if (startsWith(token,term)) {
                    items.push(token);
                }
            }
        }
        return items;
    }
    // update the search results
    $scope.update = function() {
        // this needs to be fixed somehow ... very sloppy
        $rootScope.query = $scope.query;
        $rootScope.updateResults();
    }
}
searchBoxCtrl.$inject = ['$scope','$http','CONSTANTS'];
