'use strict';

/**
 * Minimize JavaScript and CSS files.
 */
module.exports = {
    dist: {
        options: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
            compress: {},
            mangle: false,
            sourceMap: true
        },
        files: {
            '<%= dist %>/ngsolr.min.js': ['dist/ngsolr.js'],
            '<%= dist %>/examples/js/ngsolr/ngsolr.min.js': ['dist/ngsolr.js']
        }
    }
};
