/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

describe('the Solr module', function() {

    var injector = angular.injector(['ng','Solr']);
    var service = injector.get('SolrSearchService',['ng']);

    it('should return a SolrSearchService service instance', function() {
        expect(service).not.toBe(null);
    });

    describe('the SolrSearchService instance', function() {

    });

});
