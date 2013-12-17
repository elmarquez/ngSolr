/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* TextFilters                                                               */

var filters = angular.module('Filters',[]);

filters.filter('cleanFacetLabel', function() {
    /**
     * Remove punctuation and escaped chars from facet name.
     * @param text
     * @return {String} Substitution text
     */
    return function(text) {
        // ISSUE #28 remove all replacement characters
        var val = text.split('(').join('');
        val = val.split(')').join('');
        val = val.split('[').join('');
        val = val.split(']').join('');
        val = val.split('*').join(' ');
        val = val.split('%2A').join(' ');
        val = val.split('?').join(' ');
        val = val.split('%3F').(' ');
        return val;
    }
});

filters.filter('prettyFacetLabel', function() {
    /**
     * Clean up the facet label so that its more readily legible to the user.
     * @param facet
     * @return {String} Substitution text
     */
    return function(facet) {
        // convert field name from camel case to sentence case
        var result = facet.field.replace(/([A-Z])/g, " $1");
        var label = result.charAt(0).toUpperCase() + result.slice(1);
        // ISSUE #28 clean up the value text, remove all replacement characters
        var val = facet.value.split('(').join('');
        val = val.split(')').join('');
        val = val.split('[').join('');
        val = val.split(']').join('');
        val = val.split('*').join(' ');
        val = val.split('%2A').join(' ');
        val = val.split('?').join(' ');
        val = val.split('%3F').join(' ');
        val = val.replace(' TO ','');
        val = val.replace('-01-01T00:00:00Z','');
        val = val.replace('-12-31T23:59:59Z','');
        return label + ": " + val;
    }
});

filters.filter('strip', function() {
    /**
     * Strip the leading month value from a date.
     * @param text
     * @return {String} Year value
     */
    return function(text) {
        if (text == undefined) return text;
        var i = text.indexOf(', ');
        if (i != -1) {
            return text.substring(i + 2);
        }
        return text;
    }
});

filters.filter('substitute', function() {
    /**
     * Return the substitution text for the specified key.
     * @param text
     * @return {String} Substitution text
     */
    var map = {
        'ACT':'Australian Capital Territory',
        'NSW':'New South Wales',
        'NT': 'Northern Territory',
        'QLD':'Queensland',
        'SA': 'South Australia',
        'TAS':'Tasmania',
        'VIC':'Victoria',
        'WA': 'Western Australia'
    };
    return function(text) {
        if (text in map) {
            return map[text];
        }
        return text;
    }
});

filters.filter('trim', function() {
    /**
     * Trim starting and ending spaces from the string.
     * @param text
     */
    return function(text) {
        if (text == undefined) return text;
        return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
});

filters.filter('truncate', function() {
    /**
     * Truncate the text to the maximum specified length.
     * @param text Text
     * @param limit Maximum number of characters allowed before truncation
     * @return {*}
     */
    return function(text, limit) {
        if (text == undefined) return text;
        if (text.length > limit) {
            var t = text.substring(0,Math.min(limit,text.length));
            var i = t.lastIndexOf(" ");
            if (i != -1) {
                return text.substring(0,i) + " ...";
            }
        }
        return text;
    }
});
