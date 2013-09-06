/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* SelectionController                                                       */

/**
 * Selection controller.
 * @param $scope
 * @param $attrs
 * @param SelectionSetService
 */
function SelectionController($scope, $attrs, SelectionSetService) {

    // allow only a single item to be selected at a time
    $scope.singleSelection = true;

    /**
     * Clear the selection set. If an Id is provided, remove the specific
     * document by Id. Otherwise, clear all values.
     */
    $scope.clearSelection = function(Id) {
        try {
            SelectionSetService.remove(Id);
            SelectionSetService.clear();
        } catch (err) {
            if (window.console) {
                console.log(err.message);
            }
        }
    };

    /**
     * Initialize the controller.
     */
    $scope.init = function() {
        // apply configured attributes
        for (var key in $attrs) {
            if ($scope.hasOwnProperty(key)) {
                $scope[key] = $attrs[key];
            }
        }
    };

    /**
     * Add the selected document to the selection set.
     * @param Id Document identifier
     */
    $scope.select = function(Id) {
        if ($scope.singleSelection) {
            SelectionSetService.clearSilent();
        }
        SelectionSetService.add(Id,null);
    };

    // initialize the controller
    $scope.init();

}

// inject controller dependencies
SelectionController.$inject = ['$scope', '$attrs', 'SelectionSetService'];
