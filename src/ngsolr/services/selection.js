/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/**
 * Maintains a selection set and notifies listeners when changes occur to the
 * set.
 * @param $scope Controller scope
 * @param $rootScope Root scope
 * @todo consider having a default and named selection sets
 */
angular
    .module('ngSolr')
    .factory('SelectionSetService', ['$rootScope', function ($rootScope) {

    // parameters
    var svc = {};
    svc.documents = {};             // selected documents list
    svc.multipleSelection = false;  // allow multiple selection

    ///////////////////////////////////////////////////////////////////////////

    // Array Remove - By John Resig (MIT Licensed)
    Array.prototype.remove = function(from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Add document to the selection list and notify observers of the change.
     * @param Key Document identifier
     * @param Doc Optional document
     */
    svc.add = function(Key, Doc) {
        if (!svc.multipleSelection) {
            svc.documents = {};
        }
        svc.documents[Key] = (Doc);
        $rootScope.$broadcast('selectionSetUpdate');
    };

    /**
     * Clear the selection list and notify observers of the change.
     */
    svc.clear = function() {
        svc.documents = {};
        $rootScope.$broadcast('selectionSetUpdate');
    };

    /**
     * Clear the selection list but do not notify observers.
     */
    svc.clearSilent = function() {
        svc.documents = {};
    };

    /**
     * Get the document identified by the key.
     * @param Key Document identifier
     * @return {*}
     */
    svc.get = function(Key) {
        return svc.documents[Key];
    };

    /**
     * Get the selection set.
     * @return {*}
     */
    svc.getSelectionSet = function() {
        return svc.documents;
    };

    /**
     * Remove the document from the selection list and notify observers of the
     * change.
     * @param Key Document identifier
     */
    svc.remove = function(Key) {
        delete svc.documents[Key];
        $rootScope.$broadcast('selectionSetUpdate');
    };

    // return the service instance
    return svc;

}]);
