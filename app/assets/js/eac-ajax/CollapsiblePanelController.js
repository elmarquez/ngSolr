/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

/*---------------------------------------------------------------------------*/
/* Controller                                                                */

/**
 * Collapsible panel controller.
 * @param $scope Controller scope
 */
function CollapsiblePanelController($scope) {

  ///////////////////////////////////////////////////////////////////////////

  /**
   * Initialize the controller.
   * @param Toggle variable controls open/closed state of panel.
   */
  $scope.init = function(Toggle, Width) {
    $scope.toggle = Toggle;
    $scope.width = Width;
  };

	/**
	 * Update the controller state.
   * @param newValue
   * @param oldValue
	 */
	$scope.update = function(newValue,oldValue) {
	};

  /**
   * Watch the specified variable for changes.
   * @param variable Variable to watch
   */
  $scope.watch = function(variable) {
    $scope.$watch(variable,$scope.update(),true);
  }

};

// inject dependencies
CollapsiblePanelController.$inject = ['$scope'];