/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Map controller displays a map of the current search results.
 * @param $scope Controller scope
 * @param $routeParams Route parameters
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function MapController($scope, $routeParams, $http, CONSTANTS) {
	// parameters
    $scope.markers = [];
    $scope.query = '';
    $scope.settings = {
        center: new google.maps.LatLng(CONSTANTS.MAP_START_LOCATION),
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControl: false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId: google.maps.MapTypeId.TERRAIN,                
        navigationControl: true,
        navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
        // overviewMapControl:true,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom: 5,
        zoomControl:true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE
        },
    };
	$scope.userQuery = '';

	///////////////////////////////////////////////////////////////////////////

	/**
	 * Initialize the controller.
	 */
	$scope.init = function() {
        // map presentation settings
        // create the map
        $scope.map = new google.maps.Map(document.getElementById("map"),$scope.settings);
        // $scope.map.panTo(start);
        // update the display with an initial result set
        $scope.update();
	};

	/**
	 * Update the controller state.
	 */
	$scope.update = function() {
        // reset messages
        $scope.error = null;
        $scope.message = null;
        // update the browser location to reflect the query
        // setLocation($location,$scope,CONSTANTS.QUERY_DELIMITER);
        // query.setOption("callback","JSON_CALLBACK");
        // log the current query
        console.log("GET " + $scope.query.getUrl());
        // fetch the search results
        $http.get($scope.query.getUrl()).success(
          function (data) {
            // if there are search results
            if (data.response && data.response.docs && data.response.docs.length > 0) {
                // reformat data for presenation, build page navigation index
                $scope.results = format(data.response.docs,CONSTANTS.MAX_FIELD_LENGTH);
                var markers = [];
                for (var i=0;i<$scope.results.length;i++) {
                    var item = $scope.results[i];
                    var marker = new google.maps.Marker({
                        position: item.location,
                    });
                    marker.setMap($scope.map);
                }
            } else {
                $scope.message = "No results found for query '" + $scope.query.getUserQuery() + "'.";
            }
        }).error(
          function(data, status, headers, config) {
            $scope.error = "Could not get search results from server. Server responded with status code " + status + ".";
        });
	};

};

// inject dependencies
MapController.$inject = ['$scope','$routeParams','$http','CONSTANTS'];