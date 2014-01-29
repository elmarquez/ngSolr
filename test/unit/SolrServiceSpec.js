/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';



describe('the Solr module', function() {

    var injector = angular.injector(['ng','Solr']);
    var service = injector.get('SolrSearchService',['ng']);

    it('should return a SolrSearchService instance', function() {
        expect(service).not.toBe(null);
    });

    describe('the SolrSearchService instance', function() {

    });

});


/*---------------------------------------------------------------------------*/
/* SolrFacet                                                                 */

describe('the SolrFacet object', function() {

    it('should retain the field, value settings', function() {
        var cases = {
            'name':'value',
            'abc':'def',
            'xyz':'123'
        };
        for (var key in cases) {
            var name = key;
            var value = cases[key];
            var f = new SolrFacet(name, value);
            expect(f).not.toBe(null);
            expect(f.field).toBe(name);
            expect(f.value).toBe(value);
        }
    });

    it('should retain option settings', function() {
        var cases = {
            'name':'value',
            'abc':'def',
            'facet.mincount':'1'
        };
        for (var key in cases) {
            var f = new SolrFacet('name', 'value');
            f.setOption(key, cases[key]);
            var option = f.getOption(key);
            expect(option).toBe(cases[key]);
        }
    });

    it('should produce a Solr compatible query fragment', function() {
        var cases = [];
        for (var i in cases) {
            var f = new SolrFacet('name','value');
            var url = f.getUrlFragment();
            expect(url).not.toBe(null);
        }
    });

});


/*---------------------------------------------------------------------------*/
/* SolrQuery                                                                 */

describe('the SolrQuery object', function() {

});
