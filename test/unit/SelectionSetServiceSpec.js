/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

describe('the Selection module', function() {

    var injector = angular.injector(['ng','Selection']);
    var service = injector.get('SelectionSetService',['ng']);

    it('should return a service instance', function() {
        expect(service).not.toBe(null);
    });

    describe('the SelectionSetService instance', function() {

    });

});
