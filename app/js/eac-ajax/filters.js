/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';

/*---------------------------------------------------------------------------*/
/* Filters                                                                   */

var filters = angular.module('Filters',[]);

filters.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
}]);

filters.filter('trim', function() {
    /**
     * Trim starting and ending spaces from the string.
     * @param Val
     */
    return function(text) {
        return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
});

filters.filter('truncate', function() {
    /**
     * Truncate the text to a maximum length of 256 characters.
     * @param text
     * @return {*}
     */
    return function(text) {
        var t = text.substring(0,Math.min(512,text.length));
        var i = t.lastIndexOf(" ");
        if (i != -1) {
            return text.substring(0,i) + " ...";
        }
    }
});
