/**
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
 * @param CONSTANTS Application constants
 */
function MapController($scope, CONSTANTS) {
	// parameters
    // category to icon mapping ... this should be moved outside the controller and passed in
    $scope.categoryToIconMap = {
        categoryName1:"iconfilename1.png",
        categoryName2:"iconfilename2.png",
        categoryName3:"iconfilename3.png",
        categoryName4:"iconfilename4.png",
    };
    $scope.markers = [];
    $scope.settings = {
        // center: new google.maps.LatLng(CONSTANTS.MAP_START_LATITUDE,CONSTANTS.MAP_START_LONGITUDE),
        center: new google.maps.LatLng(-32.3456,141.4346), // hard code to start at Australia
        mapTypeControl: false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        navigationControl: true,
        navigationControlOptions: {
            style: google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
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
    $scope.showMessages = true;
    $scope.showErrors = true;

	///////////////////////////////////////////////////////////////////////////

    /**
     * Create a marker popup window.
     */
    function makeInfoWindow(map, marker, item) {
        // create info window
        var infowindow = new google.maps.InfoWindow();
        // assign content
        if (item.title) {
            infowindow.content = item.title;
        } else {
            infowindow.content = "unknown";
        }
        // handle close event
        google.maps.event.addListener(infowindow,'closeclick',function() {
            infowindow.close();
        });
        // handle open event
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
        });
    }

    ///////////////////////////////////////////////////////////////////////////

	/**
	 * Initialize the controller.
     * @param SearchResults
     * @param Message
     * @param Error
	 */
	$scope.init = function(SearchResults) {
        // watch for changes
        $scope.results = SearchResults;
        if ($scope.results) {
            $scope.watch($scope.results);
        }
        //$scope.watch(Message);
        //$scope.watch(Error);
        // create the map
        $scope.map = new google.maps.Map(document.getElementById("map"),$scope.settings);
        // update the display 
        $scope.update();
	};

	/**
	 * Update the controller state.
     * @param newValue
     * @param oldValue
	 */
	$scope.update = function(newValue,oldValue) {
        // if there are results to display
        if ($scope.results && $scope.results.length > 0) {
            $scope.markers = [];
            // create info window
            var infowindow = new google.maps.InfoWindow();
            // create new map markers
            for (var i=0;i<$scope.results.length;i++) {
                var item = $scope.results[i];
                if (item.location) {
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = new google.maps.Marker({
                        // position:  new google.maps.LatLng(-37.7833,144.9667),
                        map: $scope.map,
                        position:  new google.maps.LatLng(lat,lng),
                    });
                    // create an info window
                    marker.infowindow = makeInfoWindow($scope.map, marker, item); 
                    markers.push(marker);
                }
            }
            // pan the window to the start location and set default zoom level
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
     * Watch the specified variable for changes.
     * @param variable Variable to watch
     * @see http://docs.angularjs.org/api/ng.$rootScope.Scope#$watch
     */
    $scope.watch = function(variable) {
        $scope.$watch(variable,$scope.update(),true);
    };

};

// inject dependencies
MapController.$inject = ['$scope','CONSTANTS'];