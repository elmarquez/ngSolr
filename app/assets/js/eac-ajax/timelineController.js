/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Timeline controller.
 * @param $scope Controller scope
 * @param $routeParams Route parameters
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function TimelineController($scope, $routeParams, $http, CONSTANTS) {
	// parameters

	///////////////////////////////////////////////////////////////////////////

	/**
	 * Initialize the controller.
	 */
	$scope.init = function() {
	};

	/**
	 * Update the controller.
	 */
	$scope.update = function() {
	};

};

// inject dependencies
TimelineController.$inject = ['$scope','$routeParams','$http','CONSTANTS'];