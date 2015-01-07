/**
 * Minimize JavaScript and CSS files.
 */
module.exports = {
    js: {
        options: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %> */',
            compress: true,
            mangle: false,
            sourceMap: true
        },
        files: {
            '<%= dist %>/ngsolr.min.js': [
                '<%= src %>/ngsolr/app.js',
                '<%= src %>/ngsolr/**/*.js',
                '!<%= src %>/ngsolr/app/*.js'
            ],
            '<%= dist %>/examples/js/ngsolr/ngsolr.min.js': [
                '<%= src %>/ngsolr/app.js',
                '<%= src %>/ngsolr/**/*.js',
                '!<%= src %>/ngsolr/app/*.js'
            ]
        }
    }
};
