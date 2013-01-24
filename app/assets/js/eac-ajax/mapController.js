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
        // center: new google.maps.LatLng(CONSTANTS.MAP_START_LOCATION),
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
	$scope.userQuery = '';

	///////////////////////////////////////////////////////////////////////////

    /**
     * Reformat a collection of document records for presentation. Truncate each 
     * field to the maximum length specified.
     * @param Items
     * @param FieldName
     * @param Length
     * @todo consider merging this into a single function that can handle one or more objects. 
     */
    function format(Items,FieldName,Length) {
      // if the item is an array
      if (Items) {
        for (var i=0;i<Items.length;i++) {
          truncateField(Items[i],FieldName,Length);
        }
      }
      // if an item is an object
      return Items;
    };

    /**
     * Build a default query object.
     * @param CONSTANTS Application constants
     */
    function getDefaultQuery(CONSTANTS) {
      var query = new SearchQuery(CONSTANTS.SOLR_BASE,CONSTANTS.SOLR_CORE);
      query.setOption("fl","location,location_0_coordinate,location_1_coordinate,title,uri");
      query.setOption("wt","json");
      query.setOption("q",CONSTANTS.DEFAULT_QUERY);  
      return query;
    };

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
        // open event
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(contentString);
            infowindow.open(map, marker);
        });
        // close event
        google.maps.event.addListener(infowindow,'closeclick',function() {
            infowindow.close();
        });
    }

    /**
     * Truncate the field to the specified length.
     * @param Document Document
     * @param FieldName Field name to truncate
     * @param Length Maximum field length
     */
    function truncateField(Document,FieldName,Length) {
      if (Document && Document[FieldName]) {
        if (Document[FieldName] instanceof Array) {
          Document[FieldName] = Document[FieldName][0];
        }
        if (Document[FieldName].length > Length) {
          // truncate the document to the specified length
          Document[FieldName] = Document[FieldName].substring(0,Math.min(Length,Document[FieldName].length));
          // find the last word and truncate after that
          var i = Document[FieldName].lastIndexOf(" ");
          if (i != -1) {
            Document[FieldName] = Document[FieldName].substring(0,i) + " ...";
          }
        }
      }
    };

    ///////////////////////////////////////////////////////////////////////////

	/**
	 * Initialize the controller.
	 */
	$scope.init = function() {
        // init
        $scope.userQuery = CONSTANTS.DEFAULT_QUERY;
        $scope.query = getDefaultQuery(CONSTANTS);
        // create the map
        $scope.map = new google.maps.Map(document.getElementById("map"),$scope.settings);
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
                $scope.markers = [];
                $scope.results = format(data.response.docs,CONSTANTS.MAX_FIELD_LENGTH);
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
                    }
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