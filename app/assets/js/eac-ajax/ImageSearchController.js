/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Image grid based search controller.
 * @param $scope Controller scope
 * @param $routeParams Route parameters
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function ImageSearchController($scope, $routeParams, $http, CONSTANTS) {
	// parameters
	$scope.userQuery = '';

	///////////////////////////////////////////////////////////////////////////

	$scope.init = function() {

	}

	$scope.update = function() {

	}

};

// inject dependencies
ImageSearchController.$inject = ['$scope','$routeParams','$http','CONSTANTS'];