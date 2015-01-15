/**
 * Minimize JavaScript and CSS files.
 */
module.exports = {
    js: {
        options: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
            compress: true,
            mangle: false,
            sourceMap: true
        },
        files: {
            '<%= dist %>/ngsolr.min.js': [
                'dist/ngsolr.js'
            ],
            '<%= dist %>/examples/js/ngsolr/ngsolr.min.js': [
                'dist/ngsolr.js'
            ]
        }
    }
};
