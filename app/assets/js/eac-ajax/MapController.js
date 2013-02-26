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
    $scope.clusterResults = true;       // use cluster manager
    $scope.markers = [];                // list of markers
    $scope.queryname = "defaultQuery";  // name of the query
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
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.map = new google.maps.Map(document.getElementById("map"), $scope.settings);
    $scope.markerClusterer = new MarkerClusterer($scope.map, $scope.markers, clusterOptions);

    /**
     * Trim whitespace from start and end of string.
     * @param Val String to trim
     */
    function trim(Val) {
        if (Val) {
            // remove preceding white space
            while (Val.length >= 1 && Val[0] == ' ') {
                Val = Val.substring(1,Val.length-1);
            }
            // remove trailing white space
            while (Val.length >= 1 && Val[Val.length-1] == ' ') {
                Val = Val.substring(0,Val.length-2);
            }
        }
        return Val;
    }

    /**
     * Truncate the field to the specified length.
     * @param Field
     * @param Length
     * @return {*}
     */
    function truncate(Field,Length) {
        if (Field.length > Length) {
            // remove start/end whitespace
            Field = trim(Field);
            // truncate the document to the specified length
            Field = Field.substring(0,Math.min(Length,Field.length));
            // find the last word and truncate after that
            var i = Field.lastIndexOf(" ");
            if (i != -1) {
                Field = Field.substring(0,i) + " ...";
            }
        }
        return Field;
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // update the search query to include geolocation properties
        var query = SolrSearchService.getQuery();
        query.setOption("rows","3000");
         // handle update events from the search service.
        $scope.$on($scope.queryname, function () {
            $scope.update();
        });
        // update the result set and the display
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Update the controller state.
     */
    $scope.update = function () {
        // clear current markers
        $scope.markerClusterer.clearMarkers();
        $scope.markers = [];
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryname);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // marker metadata
                    var content = "<div class='infowindow'>" +
                                  "<div class='title'><a href='" + item.referrer_uri + "'>" + item.title + "</a></div>" +
                                  "<div class='type'>" + item.type + "</div>" +
                                  "<div class='summary'>" + truncate(item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + "</div>" +
                                  "</div>" ;
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
        // if the force center on start property is set, recenter the view
        if (CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
        } else {
            $scope.map.fitBounds(bounds);
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

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','MapMarkerService','CONSTANTS'];