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
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {
    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterResults = true;   // use cluster manager
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.userquery = "*:*";       // user query

    var categoryToIconMap = {
        default:"img/icon/information.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    var clusterOptions = {
        styles: [
            { height: 53, url: "img/map/m1.png", width: 53 },
            { height: 56, url: "img/map/m2.png", width: 56 },
            { height: 66, url: "img/map/m3.png", width: 66 },
            { height: 78, url: "img/map/m4.png", width: 78 },
            { height: 90, url: "img/map/m5.png", width: 90 }
        ]};
    var infoWindow = new google.maps.InfoWindow();      // google map info window
    var settings = {                                    // map settings
        center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
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

    /**
     * Compare two arrays are determine if they are equal.
     * @param ary1
     * @param ary2
     */
    function arraysAreEqual(ary1,ary2){
        return (ary1.join('') == ary2.join(''));
    }

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Handle update event for a related map view query.  If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.checkUpdate = function() {
        var defaultQuery = SolrSearchService.getQuery();
        var existingMapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new location query and update the view
        if (defaultQuery.getUserQuery() !== existingMapQuery.getUserQuery() ||
            !arraysAreEqual(defaultQuery.getUserQueryParameters(),existingMapQuery.getUserQueryParameters())) {
            var userQuery = defaultQuery.getUserQuery();
            var userQueryParams = defaultQuery.getUserQueryParameters();
            var query = $scope.getMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams.push("+location_0_coordinate:[* TO *]");
            query.setUserQueryParameters(userQueryParams);
            SolrSearchService.setQuery(query,$scope.queryname);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Create a default map query.
     */
    $scope.getMapQuery = function() {
        var query = SolrSearchService.createQuery();
        // we've modified the default query elsewhere to include only those documents that have location data
        // var parameters = ["+location_0_coordinate:[* TO *]"];
        // query.setUserQueryParameters(parameters);
        // @todo to get ALL records we need two queries ... one for the total document count and the other for the actual records
        query.setOption('fl','abstract,country,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,referrer_uri,region,title,toDate');
        query.setOption("rows","5000"); // we're assuming the count will always be less than this
        return query;
    };

    /**
     * Get a map marker.
     * @param Map Map
     * @param Title Tooltip label
     * @param Content Popup window HTML content
     * @param Category Item category
     * @param Lat Latitude
     * @param Lng Longitude
     */
    $scope.getMarker = function (Map, Title, Content, Category, Lat, Lng) {
        // get the marker icon
        var icon = categoryToIconMap['default'];
        if (Category != null && Category in categoryToIconMap) {
            icon = categoryToIconMap[Category];
        }
        // create the marker
        var marker = new google.maps.Marker({
            icon: icon,
            map: Map,
            position: new google.maps.LatLng(Lat, Lng),
            title: Title
        });
        // attach an info window to the marker
        $scope.setInfoWindow(Map, marker, Content);
        // return result
        return marker;
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("rows", CONSTANTS.ITEMS_PER_PAGE);
            query.setOption("fl", CONSTANTS.DEFAULT_FIELDS);
            query.setOption("wt", "json");
            query.setUserQuery(CONSTANTS.DEFAULT_QUERY);
            query.setUserQueryParameters(["+location_0_coordinate:[* TO *]"]);
            return query;
        };
        var defaultQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery(defaultQuery,'defaultQuery');
        SolrSearchService.updateQuery();
        // handle update events from the search service on the map query
        $scope.$on($scope.queryname, function() {
            $scope.update();
        });
        // handle update events from the search service on the default query
        $scope.$on('defaultQuery', function() {
            $scope.checkUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.select();
        });
        // create a new mapping query
        var mapQuery = $scope.getMapQuery();
        // set and update the query
        SolrSearchService.setQuery(mapQuery,$scope.queryname);
        SolrSearchService.updateQuery($scope.queryname);
    };

    /**
     * Handle selection events.
     */
    $scope.select = function() {
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
            // @todo enable multiple selection .. ie. multiple infowindows!
            // this is a bit complicated because the selection set service can hold either single or multiple
            // values. however, for the moment, we want to show only a single info window here.
            var keys = [];
            for (var key in selected) {
                if (selected.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            // get the first key only
            if (keys.length > 0) {
                var id = keys[0];
                var marker = $scope.idToMarkerMap[id];
                if (marker) {
                    var bounds = new google.maps.LatLngBounds();
                    bounds.extend(marker.position);
                    $scope.map.setCenter(bounds.getCenter());
                    $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                }
            }
        }
    };

    /**
     * Add info window to marker
     * @param Map Google map
     * @param Marker Map marker
     * @param Content HTML content to be displayed in the info window
     */
    $scope.setInfoWindow = function (Map, Marker, Content) {
        google.maps.event.addListener(Marker, 'click', function () {
            infoWindow.close();
            infoWindow.setContent(Content);
            infoWindow.open(Map, Marker);
        });
    };

    /**
     * Update the controller state.
     */
    $scope.update = function () {
        // clear current markers
        $scope.idToMarkerMap = {};
        infoWindow.close();
        $scope.clusterManager.clearMarkers();
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
                    var content = "";
                    content += "<div class='infowindow'>";
                    content += "<div class='title'><a href='" + item.referrer_uri + "'>" + item.title + "</a></div>";
                    content += "<div class='existdates'>" + Utils.formatDate(item.fromDate) + " - " + Utils.formatDate(item.toDate) + "</div>";
                    // content +=  "<div class='type'>" + item.type + "</div>";
                    content += "<div class='summary'>" + Utils.truncate(item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + "</div>";
                    content += "</div>" ;
                    var lat = item.location_0_coordinate;
                    var lng = item.location_1_coordinate;
                    // create a marker
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to clusterer
        $scope.clusterManager.addMarkers($scope.markers);
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

    ///////////////////////////////////////////////////////////////////////////

    // handle close click event on info window
    google.maps.event.addListener(infoWindow, 'close', function () {
        infoWindow.close();
    });

    // create map
    $scope.map = new google.maps.Map(document.getElementById("map"), settings);

    // create marker cluster manager
    $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);

} // MapController

// inject dependencies
MapController.$inject = ['$scope','SolrSearchService','SelectionSetService','Utils','CONSTANTS'];