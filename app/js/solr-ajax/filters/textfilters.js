/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* TextFilters                                                               */

var module = angular.module('TextFilters', []);

module.filter('cleanFacetLabel', function() {
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
        val = val.split('%3F').join(' ');
        return val;
    }
});

module.filter('prettyFacetLabel', function() {
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

module.filter('strip', function() {
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

module.filter('substitute', function() {
    /**
     * Return the substitution text for the specified key.
     * @param text
     * @return {String} Substitution text
     */
    var map = {
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
    return function(text) {
        if (text in map) {
            return map[text];
        }
        return text;
    }
});

module.filter('swapDateFacetLabels', function() {
    /**
     * The date range filter matches on those entities that exist within a
     * specified time period. TheSolr query that matches those entities has an
     * unintuitive reversal of the fromDate and toDate query components, This
     * filter reverses the fromDate/toDate labels in the presentation layer so
     * that the user sees these facets appear in the way they would understand
     * the query intuitively.
     * @see ISSUE #29
     */
    return function(label) {
        if (label.indexOf('fromDate') == 0) {
            label = "toDate" + label.substring(8);
        } else if (label.indexOf('From Date') == 0) {
            label = "To Date" + label.substring(9);
        } else if (label.indexOf('toDate') == 0) {
            label = "fromDate" + label.substring(6);
        } else if (label.indexOf('To Date') == 0) {
            label = "From Date" + label.substring(7);
        }
        return label;
    }
});

module.filter('trim', function() {
    /**
     * Trim starting and ending spaces from the string.
     * @param text
     */
    return function(text) {
        if (text == undefined) return text;
        return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
});

module.filter('truncate', function() {
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
