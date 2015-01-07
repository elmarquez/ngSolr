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
            '<%= dist %>/examples/css/<%= pkg.name %>.min.css': [
                '<%= src %>/examples/css/*.css'
            ]
        }
    }
};
