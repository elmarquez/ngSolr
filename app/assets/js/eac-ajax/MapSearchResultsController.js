/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Map search results controller displays a paginated text listing of 
 * search results, similar to the Google Maps interface.
 * @param $scope Controller scope
 * @param $routeParams Route parameters
 * @param $http HTTP service
 * @param CONSTANTS Application constants
 */
function MapSearchResultsController($scope, $routeParams, $http, CONSTANTS) {

    $scope.items = [];
    $scope.itemsPerPage = 5;
    $scope.pages = [];

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the controller.
     */
    $scope.init = function(SearchResults) {
        $scope.results = SearchResults;
        $scope.watch(SearchResults);
    };

	/**
	 * Update the controller state.
	 */
	$scope.update = function() {
		// clear current results
        $scope.items = [];
        $scope.pages = [];
        // update result listing
        // update page listing
	};

    /**
     * Watch the specified variable for changes.
     * @param variable Variable to watch
     */
    $scope.watch = function(variable) {
        $scope.$watch(variable,$scope.update);
    };

};

// inject dependencies
MapSearchResultsController.$inject = ['$scope','$routeParams','$http','CONSTANTS'];