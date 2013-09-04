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
 * results at once.
 * The map controller listens for updates on a specified target query. When an
 * update occurs, the map query duplicates the query but sets the number of
 * rows to $scope.count (a very large number) so that it can show as many
 * documents as possible.
 *
 * @param $scope Controller scope
 * @param SolrSearchService Search service
 * @param SelectionSetService Selection set service
 * @param Utils Utility functions
 * @param CONSTANTS Application constants
 */
function MapController($scope, SolrSearchService, SelectionSetService, Utils, CONSTANTS) {

    // parameters
    $scope.clusterManager = null;   // clustering marker manager
    $scope.clusterOptions = {
        styles: [
            { height: 24, url: "img/map/cluster1.png", width: 24 },
            { height: 36, url: "img/map/cluster2.png", width: 36 },
            { height: 48, url: "img/map/cluster3.png", width: 48 },
            { height: 64, url: "img/map/cluster4.png", width: 64 },
            { height: 82, url: "img/map/cluster5.png", width: 82 }
        ]};
    $scope.clusterResults = true;   // use cluster manager
    $scope.count = 5000;            // the total number of records
    $scope.firstUpdate = true;      // flag to
    $scope.idToMarkerMap = {};      // id to marker map
    $scope.map = undefined;         // google map
    $scope.markers = [];            // list of markers
    $scope.queryname = "mapQuery";  // name of the query
    $scope.showMessages = true;     // show info messages window
    $scope.showErrors = true;       // show error messages window
    $scope.target = "defaultQuery"; // query to monitor
    $scope.updateOnInit = true;     // update the result set during init

    var categoryToIconMap = {
        default:"img/icon/house.png",
        corporateBody:"img/icon/corporatebody.png",
        government:"img/icon/corporatebody.png",
        organization:"img/icon/corporatebody.png",
        person:"img/icon/person.png"
    };
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
        query.setOption('fl','abstract,country,dobj_proxy_small,fromDate,id,localtype,location,location_0_coordinate,location_1_coordinate,presentation_url,region,title,toDate');
        query.setOption("rows",$scope.count);
        query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
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
        content += "<div class='summary'>" + Utils.truncate(Item.abstract,CONSTANTS.MAX_FIELD_LENGTH) + " ";
        content += "<a href='" + Item.presentation_url + "' class='more'>more</a>" + "</div>";
        content += "</div>" ;
        return content;
    };

    /**
     * Handle update to map search results. Clear the existing collection of
     * map markers and add new map markers to the map.
     */
    $scope.handleMapUpdate = function () {
        // make sure that the infowindow is closed
        infoWindow.close();
        // clear current markers
        $scope.idToMarkerMap = {};
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
                    // create a marker
                    var content = $scope.getMarkerContent(item);
                    // ISSUE: Solr index is returning an array rather than a string for coordinate values
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
        // center the view on the markers
        if ($scope.firstUpdate &&
            CONSTANTS.hasOwnProperty('MAP_FORCE_START_LOCATION') &&
            CONSTANTS.MAP_FORCE_START_LOCATION === true) {
            var lat = CONSTANTS.MAP_START_LATITUDE;
            var lng = CONSTANTS.MAP_START_LONGITUDE;
            var point = new google.maps.LatLng(lat,lng);
            $scope.map.setCenter(point, 8);
            $scope.firstUpdate = false;
        } else {
            $scope.map.fitBounds(bounds);
        }
    };

    /**
     * Handle selection events. The selection set service can hold either
     * single or multiple values. However, we show only a single info
     * window in the current implementation.
     * @todo enable multiple selection .. ie. multiple infowindows
     */
    $scope.handleSelection = function() {
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
                }
            }
        }
    };

    /**
     * Handle update event for a related map view query. If the user query
     * portion of that query has changed, construct a new query in the current
     * view to correspond.
     */
    $scope.handleTargetUpdate = function() {
        var targetQuery = SolrSearchService.getQuery($scope.target);
        var mapQuery = SolrSearchService.getQuery($scope.queryname);
        // if the user specified query elements have changed, then create a
        // new map query and update the view
        if (targetQuery.getUserQuery() !== mapQuery.getUserQuery() ||
            !Utils.objectsAreEqual(targetQuery.getUserQueryParameters(),mapQuery.getUserQueryParameters())) {
            var userQuery = targetQuery.getUserQuery();
            var userQueryParams = targetQuery.getUserQueryParameters();
            var query = $scope.createMapQuery();
            query.setUserQuery(userQuery);
            userQueryParams[$scope.queryname] = "+location_0_coordinate:[* TO *]";
            query.setQueryParameters(userQueryParams);
            SolrSearchService.setQuery($scope.queryname,query);
            SolrSearchService.updateQuery($scope.queryname);
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function () {
        // redefine the default search query to ensure that only records with
        // location properties show up in the results
        // @todo consider implementing this through the application instead
        SolrSearchService.createQuery = function() {
            var query = new SolrQuery(CONSTANTS.SOLR_BASE, CONSTANTS.SOLR_CORE);
            query.setOption("fl",CONSTANTS.DEFAULT_FIELDS);
            query.setOption("json.wrf", "JSON_CALLBACK");
            query.setOption("rows",10);
            query.setOption("sort","title+asc");
            query.setOption("wt","json");
            query.setUserQuery(CONSTANTS.DEFAULT_QUERY);
            query.setQueryParameter($scope.queryname,"+location_0_coordinate:[* TO *]");
            return query;
        };
        var targetQuery = SolrSearchService.createQuery();
        SolrSearchService.setQuery($scope.target,targetQuery);
        // create a new map query
        var mapQuery = $scope.createMapQuery();
        SolrSearchService.setQuery($scope.queryname,mapQuery);
        // handle update events on the target query
        $scope.$on($scope.target, function() {
            $scope.handleTargetUpdate();
        });
        // handle update events on the map query
        $scope.$on($scope.queryname, function() {
            $scope.handleMapUpdate();
        });
        // handle update events from the selection set service
        $scope.$on("selectionSetUpdate", function() {
            $scope.handleSelection();
        });
        // update search results
        if ($scope.updateOnInit) {
            SolrSearchService.updateQuery($scope.queryname);
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