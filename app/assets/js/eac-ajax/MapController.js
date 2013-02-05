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
 * @param SearchService Search service
 * @param CONSTANTS Application constants
 */
function MapController($scope, SearchService, CONSTANTS) {
    // parameters
    $scope.markers = [];
    $scope.settings = {
        // center: new google.maps.LatLng(CONSTANTS.MAP_START_LATITUDE,CONSTANTS.MAP_START_LONGITUDE),
        center:new google.maps.LatLng(-32.3456, 141.4346), // hard code to start at Australia
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
    $scope.showMessages = true;
    $scope.showErrors = true;

    $scope.map = new google.maps.Map(document.getElementById("map"), $scope.settings);

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Create a marker popup window.
     * @param map
     * @param marker
     * @param item
     */
    var makeInfoWindow = function (map, marker, item) {
        // create info window
        var infowindow = new google.maps.InfoWindow();
        // assign content
        if (item.title) {
            infowindow.content = item.title;
        } else {
            infowindow.content = "unknown";
        }
        // handle close event
        google.maps.event.addListener(infowindow, 'closeclick', function () {
            infowindow.close();
        });
        // handle open event
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, marker);
        });
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // update the display for the first time
        $scope.update();
    };

    /**
     * Update the controller state.
     * @param newValue
     * @param oldValue
     * @param scope
     */
    $scope.update = function (newValue, oldValue, scope) {
        console.log("Updating map");
        // if there are results to display
        if (SearchService) {
            var results = SearchService.getQueryResults();
            $scope.markers = [];
            // create new map markers
            for (var i = 0; i < results.length; i++) {
                var item = results[i];
                if (item.location) {
                    // marker metadata
                    var category = "Home";
                    var url = "http://www.example.com";
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = new google.maps.Marker({
                        map:$scope.map,
                        position:new google.maps.LatLng(lat, lng)
                    });
                    // create an info window
                    marker.infowindow = makeInfoWindow($scope.map, marker, item);
                    markers.push(marker);
                    $scope.map.addOverlay(marker);
                }
            }
            // center and zoom to fit search results
            /*
             var bounds = new GLatLngBounds();
             for (var m =0;m<markers.length;m++) {
             bounds.extend(marker.position);
             }
             $scope.map.setCenter(bounds.getCenter(), $scope.map.getBoundsZoomLevel(bounds));
             */
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
     * Handle update events from the search service.
     */
    $scope.$on('update', function () {
        $scope.update();
    });

} // MapController

// inject dependencies
MapController.$inject = ['$scope', 'SolrSearchService', 'CONSTANTS'];