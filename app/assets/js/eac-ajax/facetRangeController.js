/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Range facet controller. Examples of a range type include date, geolocation,
 * numeric.
 * @see [link to Solr docs]
 * @param $scope Controller scope
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function FacetRangeController($scope, $http, CONSTANTS) {
    // parameters
    $scope.field = '';      // facet field name
    $scope.type = '';       // date

    // query
    var query = new SearchQuery(CONSTANTS.SOLR_BASE,CONSTANTS.SOLR_CORE);
    query.setOption("facet","true");
    query.setOption("wt","json");

}

// inject controller dependencies
RangeFacetController.$inject = ['$scope','$http','CONSTANTS'];
