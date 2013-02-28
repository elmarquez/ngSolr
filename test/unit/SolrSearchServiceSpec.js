/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Unit Tests                                                                */

/**
 * Unit tests for SolrFacet object.
 */
describe('SolrFacet', function() {

    beforeEach(function() {
        var name = "abc";
        var val = "xyz";
        var facet = new SolrFacet(name,val);
    });

    it('should return a new instance', function() {
        var name = "abc";
        var val = "xyz";
        var facet = new SolrFacet(name,val);
        expect(facet).not.toBeUndefined();
    });

    it('should create facet with name and value properties', function() {
        var name = "abc";
        var val = "xyz";
        var facet = new SolrFacet(name,val);
        expect(facet.name).toBe(name);
        expect(facet.value).toBe(val);
    });

    it('should set and return same option value', function() {
        var name = "abc";
        var val = "xyz";
        var facet = new SolrFacet(name,val);

        var optionname1 = "abc1";
        var optionname2 = "abc2";

        var optionval1 = "xyz1";
        var optionval2 = "xyz2";

        facet.setOption(optionname1,optionval1);
        facet.setOption(optionname2,optionval2);

        expect(facet.getOption(optionname1)).toBe(optionval1);
        expect(facet.getOption(optionname2)).toBe(optionval2);
    });

    it('should return valid URL fragment', function() {
        var name = "abc";
        var val = "xyz";
        var facet = new SolrFacet(name,val);

    });

});

/**
 * Unit tests for SolrQuery object.
 */
describe('SolrQuery', function() {

    it('should create a default query with Solr URL and Core name', function() {
        expect(1).toBe(1);
    });
});

/**
 * Unit tests for Solr Search Service.
 */
describe('SolrSearchService', function() {

    it('should return a new instance', function() {
        var url = "http://www.example.com:8080/";
        var core = "CORE";
        var solr = new SolrSearchService(url,core);
        expect(solr).toBeUndefined();
    });

});
