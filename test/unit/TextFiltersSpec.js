/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
'use strict';

describe('the textFilters module', function() {

    var injector = angular.injector(['ng','TextFilters']);

    var cleanFacetLabelFilter = injector.get('cleanFacetLabelFilter');
    var prettyFacetLabelFilter = injector.get('prettyFacetLabelFilter');
    var stripFilter = injector.get('stripFilter');
    var substituteFilter = injector.get('substituteFilter');
    var swapFacetLabelsFilter = injector.get('swapFacetLabelsFilter');
    var trimFilter = injector.get('trimFilter');
    var truncateFilter = injector.get('truncateFilter');

    it('should have a cleanFacetLabelFilter', function() {
       expect(cleanFacetLabelFilter).not.toBe(null);
    });

    it('should have a prettyFacetLabelFilter', function() {
        expect(prettyFacetLabelFilter).not.toBe(null);
    });

    it('should have a stripFilter', function() {
        expect(stripFilter).not.toBe(null);
    });

    it('should have a substituteFilter', function() {
        expect(substituteFilter).not.toBe(null);
    });

    it('should have a swapFacetLabelsFilter', function() {
        expect(swapFacetLabelsFilter).not.toBe(null);
    });

    it('should have a trimFilter', function() {
        expect(trimFilter).not.toBe(null);
    });

    it('should have a truncateFilter', function() {
        expect(truncateFilter).not.toBe(null);
    });

    describe('the cleanFacetLabelFilter', function() {

        it('should remove punctuation and escaped chars from the facet name', function() {
            var cases = {
              'some text with (braces) in it': 'some text with braces in it',
              'some [square brackets]': 'some square brackets',
              'I love** unit testing': 'I love unit testing',
              'lets %2A escape this crap': 'lets escape this crap'
            };
            for (var key in cases) {
                var expected = cases[key];
                var result = cleanFacetLabelFilter(expected);
                expect(result).toBe(expected);
            }
        });

    });

    describe('the prettyFacetLabelFilter', function() {
    });

    describe('the stripFilter', function() {
    });

    describe('the substituteFilter', function() {
        var cases = {
            'ACT':'Australian Capital Territory',
            'NSW':'New South Wales',
            'NA': 'Australia',
            'NT': 'Northern Territory',
            'QLD':'Queensland',
            'SA': 'South Australia',
            'TAS':'Tasmania',
            'VIC':'Victoria',
            'WA': 'Western Australia'
        };
        for (var key in cases) {
            var expected = cases[key];
            var result = substituteFilter(key);
            expect(result).toBe(expected);
        }
    });

    describe('the swapFacetLabelsFilter', function() {
    });

    describe('the trimFilter', function() {
        var cases = {
            "No spaces at the beginning or end.":"No spaces at the beginning or end.",
            "    Spaces at the beginning.":"Spaces at the beginning.",
            "Spaces at the end.     ":"Spaces at the end."
        };
        for (var key in cases) {
            var expected = cases[key];
            var result = trimFilter(key);
            expect(result).toBe(expected);
        }
    });

    describe('the truncateFilter', function() {
        var cases = [
            {data:"No spaces at the beginning or end.", length:26, expect:"No spaces at the beginning ..."},
            {data:"Spaces at the beginning.", length:14, expect:"Spaces at the ..."}
        ];
        for (var the_case in cases) {
            var data = the_case['data'];
            var length = the_case['length'];
            var expected = the_case['expect'];
            var result = truncateFilter(data, length);
            expect(result).toBe(expected);
        }
    });

});
