/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* MapController                                                             */

/**
 * Display a map of search results for documents with location attributes.
 * Unlike other controllers, the map controller tries to display all search
 * results at once. The map controller listens for updates on a specified
 * target query. When an update occurs, the map query duplicates the query
 * but sets the number of rows to $scope.count (a very large number) so that
 * it can show as many documents as possible.
 *
 * @param $scope
 * @oaram $attrs
 * @param $location
 * @param $log Log service
 * @param $route
 * @param $routeParams
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 */
function MapController($scope, $attrs, $location, $log, $route, $routeParams, SolrSearchService, SelectionSetService, Utils) {

    $scope.categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
    $scope.centerOnStart = true;        // center the map on the start location
    $scope.clusterManager = null;       // clustering marker manager
    $scope.clusterOptions = {
        styles: [
            { height: 24, url: "img/map/cluster1.png", width: 24 },
            { height: 36, url: "img/map/cluster2.png", width: 36 },
            { height: 48, url: "img/map/cluster3.png", width: 48 },
            { height: 64, url: "img/map/cluster4.png", width: 64 },
            { height: 82, url: "img/map/cluster5.png", width: 82 }
        ]};
    $scope.clusterResults = true;       // use cluster manager
    $scope.count = 5000;                // the total number of records
    $scope.fields = '*';                // field to fetch from solr
    $scope.firstUpdate = true;          // flag to
    $scope.idToMarkerMap = {};          // id to marker map
    $scope.infoWindow = new google.maps.InfoWindow(); // google map info window
    $scope.loading = false;             // results loading flag
    $scope.map = undefined;             // google map
    $scope.markers = [];                // list of markers
    $scope.maxFieldLength = 120;        // maximum length of text fields in infowindow
    $scope.queryName = "mapQuery";      // name of the query
                                        // map settings
    $scope.settings = {
        // center:new google.maps.LatLng(-30.3456, 141.4346), // hard code to start at Australia
        mapTypeControl: false,
        // mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        navigationControl: true,
        navigationControlOptions: {
            style:google.maps.NavigationControlStyle.SMALL
        },
        overviewMapControl:false,
        panControl:true,
        rotateControl:true,
        scaleControl:true,
        streetViewControl:false,
        zoom:5,
        zoomControl:true,
        zoomControlOptions: {
            style:google.maps.ZoomControlStyle.LARGE
        }
    };
    $scope.showMessages = true;         // show info messages window
    $scope.showErrors = true;           // show error messages window
    $scope.source = undefined;          // url to solr core
    $scope.startLatitude = undefined;   // on start, center the map on latitude
    $scope.startLongitude = undefined;  // on start, center the map on longitude
    $scope.target = "defaultQuery";     // query to monitor

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Create a default map query. There is no way to tell Solr to return ALL
     * records, consequently we need to either tell it to return a very large
     * number of records or we need to tell it to return exactly the number of
     * records that are available. There is no processing required if we just
     * ask for a really large number of documents, so we'll do that here.
     */
    $scope.createMapQuery = function() {
        var query = SolrSearchService.createQuery();
        query.setOption('fl', $scope.fields);
        query.setOption("rows", $scope.count);
        query.addQueryParameter("+location_0_coordinate:*");
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
        var icon = $scope.categoryToIconMap['default'];
        if (Category != null && Category in $scope.categoryToIconMap) {
            icon = $scope.categoryToIconMap[Category];
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
     * Get the map marker InfoWindow content.
     * @param Item
     * @returns {String} HTML content for map InfoWindow
     */
    $scope.getMarkerContent = function(Item) {
        var content = "<div class='infowindow'>";
        if (Item.dobj_proxy_small) {
            content += "<div class='thumb'><a href='" + Item.presentation_url + "'>" + "<img src='" + Item.dobj_proxy_small + "' />" + "</a></div>";
        }
        content += "<div class='title'><a href='" + Item.presentation_url + "'>" + Item.title + "</a></div>";
        content += "<div class='existdates'>" + Utils.formatDate(Item.fromDate) + " - " + Utils.formatDate(Item.toDate) + "</div>";
        // content +=  "<div class='type'>" + item.type + "</div>";
        content += "<div class='summary'>" + Utils.truncate(Item.abstract,$scope.maxFieldLength) + " ";
        content += "<a href='" + Item.presentation_url + "' class='more'>more</a>" + "</div>";
        content += "</div>" ;
        return content;
    };

    /**
     * Handle selection events. The selection set service can hold either
     * single or multiple values. However, we show only a single info
     * window in the current implementation.
     * @todo enable multiple selection .. ie. multiple infowindows
     */
    $scope.handleSelection = function() {
        $log.info("Map selection updated");
        var selected = SelectionSetService.getSelectionSet();
        if (selected) {
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
                    // $scope.map.setCenter(bounds.getCenter());
                    // $scope.map.fitBounds(bounds);
                    google.maps.event.trigger(marker,'click');
                    // center the map on the results
                    $scope.map.fitBounds(bounds);
                }
            }
        }
    };

    /**
     * Handle update to map search results. Clear the existing collection of
     * map markers and add new map markers to the map.
     */
    $scope.handleUpdate = function () {
        // create marker bounds
        var bounds = new google.maps.LatLngBounds();
        // if there are results to display
        var results = SolrSearchService.getResponse($scope.queryName);
        if (results && results.docs) {
            // create new map markers
            for (var i = 0; i < results.docs.length; i++) {
                var item = results.docs[i];
                if (item.location) {
                    // create a marker
                    var content = $scope.getMarkerContent(item);
                    // ISSUE: Solr4 returns an array rather than a string for coordinate values
                    if (typeof item.location_0_coordinate === 'string') {
                        var lat = item.location_0_coordinate;
                    } else {
                        var lat = item.location_0_coordinate[0];
                    }
                    if (typeof item.location_1_coordinate === 'string') {
                        var lng = item.location_1_coordinate;
                    } else {
                        var lng = item.location_1_coordinate[0];
                    }
                    var marker = $scope.getMarker($scope.map, item.title, content, item.type, lat, lng);
                    // add marker to bounds
                    bounds.extend(marker.position);
                    // add marker to list
                    $scope.markers.push(marker);
                    $scope.idToMarkerMap[item.id] = marker;
                }
            }
        }
        // add markers to cluster manager
        if ($scope.clusterResults) {
            $scope.clusterManager.addMarkers($scope.markers);
        }
        // center the map on the results
        $scope.map.fitBounds(bounds);
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        Utils.applyAttributes($attrs, $scope);
        // create map, marker cluster manager. add close handler for infowindow
        $scope.map = new google.maps.Map(document.getElementById("map"), $scope.settings);
        $scope.clusterManager = new MarkerClusterer($scope.map, $scope.markers, $scope.clusterOptions);
        google.maps.event.addListener($scope.infoWindow, 'close', function() {
            $scope.infoWindow.close();
        });
        // handle updates on the query
        $scope.$on($scope.queryName, function() {
            $scope.handleUpdate();
        });
        // handle update on the selection set
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // handle location change event, update query results
        $scope.$on("$routeChangeSuccess", function() {
            // if there is a query in the current location
            $scope.query = ($routeParams.query || "");
            if ($scope.query) {
                // reset state
                $scope.loading = false;
                // get the current query
                var query = SolrSearchService.getQueryFromHash($scope.query, $scope.source);
                // if there is a data source specified, override the default
                if ($scope.source) {
                    query.solr = $scope.source;
                }
                // make sure that the infowindow is closed
                $scope.infoWindow.close();
                // clear current markers
                $scope.idToMarkerMap = {};
                $scope.clusterManager.clearMarkers();
                $scope.markers = [];
                // update query results
                SolrSearchService.setQuery($scope.queryName, query);
                $scope.loading = true;
                SolrSearchService.updateQuery($scope.queryName);
            }
        });
        // draw the map for the first time
        if ($scope.startLatitude && $scope.startLongitude) {
            var point = new google.maps.LatLng($scope.startLatitude, $scope.startLongitude);
            $scope.map.setCenter(point, 8);
        } else {
            var bounds = new google.maps.LatLngBounds();
            $scope.map.fitBounds(bounds);
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
            $scope.infoWindow.close();
            $scope.infoWindow.setContent(Content);
            $scope.infoWindow.open(Map, Marker);
        });
    };

    // initialize the controller
    $scope.init();

} // MapController

// inject dependencies
MapController.$inject = ['$scope','$attrs','$location','$log','$route','$routeParams','SolrSearchService','SelectionSetService','Utils'];