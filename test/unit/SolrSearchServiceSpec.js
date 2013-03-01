/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

/*---------------------------------------------------------------------------*/
/* Unit Tests                                                                */

/**
 * Unit tests for Solr Search Service, SolrFacet and SolrQuery.
 */
describe('SolrSearchService:', function() {

    describe('Module:', function() {

        beforeEach(function() {
            angular.mock.module('eacajax');
        });

        it('eacajax should include SolrSearchService service', inject(['SolrSearchService',function(SolrSearchService) {
            expect(SolrSearchService).toBeDefined();
        }]));
    });

    //-------------------------------------------------------------------------
    // SolrFacet tests

    describe('SolrFacet:', function() {

        beforeEach(function() {
            angular.mock.module('eacajax');
        });

        it('service instance should not be null', inject(function(SolrSearchService) {
            expect(SolrSearchService).toBeDefined();
            var query = SolrSearchService.createQuery();
            expect(query).toBeDefined();
        }));

        it('instance should be created', inject(function(SolrSearchService) {
            var name = "abc";
            var val = "xyz";
            var facet = SolrSearchService.createFacet(name,val);
            console.log(facet);
            expect(facet).toBeDefined();
        }));

        it('should create facet with name and value properties', inject(function(SolrSearchService) {
            var name = "abc";
            var val = "xyz";
            var facet = SolrSearchService.createFacet(name,val);
            expect(facet.field).toBe(name);
            expect(facet.value).toBe(val);
        }));

        it('should set and return same option value', inject(function(SolrSearchService) {
            var name = "abc";
            var val = "xyz";
            var facet = SolrSearchService.createFacet(name,val);

            var optionname1 = "abc1";
            var optionname2 = "abc2";

            var optionval1 = "xyz1";
            var optionval2 = "xyz2";

            facet.setOption(optionname1,optionval1);
            facet.setOption(optionname2,optionval2);

            expect(facet.getOption(optionname1)).toBe(optionval1);
            expect(facet.getOption(optionname2)).toBe(optionval2);
        }));

        it('should return a non-null URL fragment', inject(function(SolrSearchService) {
            var name = "abc";
            var val = "xyz";
            var facet = SolrSearchService.createFacet(name,val);

            var url = facet.getUrlFragment();
            expect(url).not.toBe(null);
        }));

    });

    //-------------------------------------------------------------------------
    // SolrQuery tests

    describe('SolrQuery:', function() {

        /*
         it('instance should be created', function() {
         var query = SolrSearchService.createQuery();
         expect(query).not.toBe(null);
         });
         */

    });

});