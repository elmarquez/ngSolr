/**
 * Create a minified version of one or more CSS source files.
 */
module.exports = {
    dist: {
        options: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        files: {
            '<%= dist %>/examples/css/ngsolr.min.css': [
                '<%= src %>/examples/css/*.css'
            ]
        }
    }
};
