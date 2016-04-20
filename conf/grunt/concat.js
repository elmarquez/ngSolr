'use strict';

/**
 * Concatenate files together.
 */
module.exports = {
    app: {
        options: {
            separator: '\n',
            stripBanners: true
        },
        src: [
            '<%= src %>/ngsolr/app.js',
            '<%= src %>/ngsolr/**/*.js',
            '!<%= src %>/ngsolr/app/*.js'
        ],
        dest: '<%= dist %>/ngsolr.js'
    },
    dist: {
        src: [
            '<%= src %>/ngsolr/banner.js',
            'dist/ngsolr.js'
        ],
        dest: 'dist/ngsolr.js'
    }
};
