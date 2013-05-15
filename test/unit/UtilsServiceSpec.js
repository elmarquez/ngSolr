/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Unit Tests                                                                */

/**
 * Unit tests for Utils Service.
 */
describe('UtilsService:', function() {

    beforeEach(angular.mock.module('solr-ajax'));

    it('should include Utils service', inject(['Utils',function(Utils) {
        expect(Utils).toBeDefined();
    }]));

});