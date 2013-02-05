/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Jasmine Tests                                                             */

/**
 * Unit tests for Field Facet Controller.
 */
describe('FieldFacetController', function() {
	var scope, ctrl, mockQueryService;
 
    beforeEach(function() {
      scope = {},
      ctrl = new FieldFacetController(scope, mockQueryService);
    });

    it('should list three facet instances', function() {
      expect(scope.items.length).toBe(3);
    });

});


