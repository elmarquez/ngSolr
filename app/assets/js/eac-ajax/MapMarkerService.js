/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Service                                                                   */

var services = angular.module('Services',[]);

/**
 * Executes a document search against a Solr index.
 * @param $http HTTP service
 * @param $location Location service
 * @param CONSTANTS Application constants
 */
services.factory('MapMarkerService',
    ['CONSTANTS',function(CONSTANTS) {

        var categoryToIconMap = {
            categoryName1:"iconfilename1.png",
            categoryName2:"iconfilename2.png",
            categoryName3:"iconfilename3.png",
            categoryName4:"iconfilename4.png"
        };

        /**
         * Create a marker popup window.
         * @param map
         * @param marker
         * @param item
         */
        var makeInfoWindow = function(map, marker, item) {
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

        var service = {};

        /**
         * Get a map marker.
         */
        service.getMarker = function() {

        }

        // return the service instance
        return service;

    }]);