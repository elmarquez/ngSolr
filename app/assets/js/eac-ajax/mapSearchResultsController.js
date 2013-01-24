/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Map search results controller displays a paginated text listing of 
 * search results, similar to the Google Maps interface.
 * @param $scope Controller scope
 * @param $routeParams Route parameters
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function MapSearchResultsController($scope, $routeParams, $http, CONSTANTS) {
	// parameters
    $scope.mapOptions = {
        center: new google.maps.LatLng(35.784, -78.670),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    $scope.markers = [];
	$scope.userQuery = '';

	///////////////////////////////////////////////////////////////////////////

	/**
	 * Initialize the map display.
	 */
	$scope.init = function() {
		// initial location
        var start = new google.maps.LatLng(-32.3456,141.4346);
        // map presentation settings
        var settings = {
            center: start,
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
        var map = new google.maps.Map(document.getElementById("map"),settings);
        map.panTo(start)
	};

	/**
	 * Update the map display.
	 */
	$scope.update = function() {
		// update the result set
	};

};

// inject dependencies
MapSearchResultsController.$inject = ['$scope','$routeParams','$http','CONSTANTS'];