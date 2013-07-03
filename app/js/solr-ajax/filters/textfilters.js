/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */

'use strict';

/*---------------------------------------------------------------------------*/
/* TextFilters                                                               */

angular.module('Filters',[]).filter('trim', function() {
    /**
     * Trim starting and ending spaces from the string.
     * @param text
     */
    return function(text) {
        return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
});

angular.module('Filters',[]).filter('truncate', function() {
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
