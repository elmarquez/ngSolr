/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Location based search controller.
 * @param $scope Controller scope
 * @param $routeParams Route parameters
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function LocationSearchController($scope, $routeParams, $http, CONSTANTS) {
	// parameters
    $scope.mapOptions = {
        center: new google.maps.LatLng(35.784, -78.670),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    $scope.markers = [];
	$scope.userQuery = '';

	///////////////////////////////////////////////////////////////////////////

	$scope.init = function() {

	}

	$scope.update = function() {

	}

};

// inject dependencies
LocationSearchController.$inject = ['$scope','$routeParams','$http','CONSTANTS'];