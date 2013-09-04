/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* TextFilters                                                               */

var filters = angular.module('Filters',[]);

filters.filter('strip', function() {
    /**
     * Strip the leading month value from a date.
     * @param text
     * @return {String} Year value
     */
    return function(text) {
        var i = text.indexOf(', ');
        if (i != -1) {
            return text.substring(i + 2);
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
