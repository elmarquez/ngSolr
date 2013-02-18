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
 * @param SolrSearchService Search service
 * @param MapMarkerService Map marker service
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, MapMarkerService, CONSTANTS) {
    // parameters
    $scope.markers = [];
    $scope.settings = {
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
     * Initialize the controller.
     */
    $scope.init = function () {
        // update the search query to include geolocation properties
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
        // clear current markers
        $scope.markerClusterer.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        if (SolrSearchService) {
            var results = SolrSearchService.getQueryResults();
            // create new map markers
            for (var i = 0; i < results.length; i++) {
                var item = results[i];
                if (item.location) {
                    // marker metadata
                    var content = "<div class='infowindow'><div class='title'>" + item.title + "</div><div class='type'>" +
                                  item.type + "</div><div class='summary'>" + item.summary + "</div></div>" ;
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = MapMarkerService.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                }
            }
        }
        // add markers to clusterer
        $scope.markerClusterer.addMarkers($scope.markers);
        // zoom and center the map view to fit search results
        $scope.map.fitBounds(bounds);
        //setZoom($scope.getBoundsZoomLevel(bounds));
        //$scope.map.setCenter(bounds.getCenter());
        // if there is an information message
        if ($scope.message && $scope.message != '') {
            console.log("Information message");
        }
        // if there is an error message
        if ($scope.error && $scope.error != '') {
            console.log("Error message");
        }
    };

    ///////////////////////////////////////////////////////////////////////////

    // create a marker clusterer
    var clusterOptions = {
        styles: [{
            height: 53,
            url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m1.png",
            width: 53
        },
        {
            height: 56,
            url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m2.png",
            width: 56
        },
        {
            height: 66,
            url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m3.png",
            width: 66
        },
        {
            height: 78,
            url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m4.png",
            width: 78
        },
        {
            height: 90,
            url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m5.png",
            width: 90
        }]};
    $scope.markerClusterer = new MarkerClusterer($scope.map, $scope.markers, clusterOptions);

    /**
     * Handle update events from the search service.
     */
    $scope.$on('update', function () {
        $scope.update();
    });

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','MapMarkerService','CONSTANTS'];