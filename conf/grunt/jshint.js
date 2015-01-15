/**
 * Lint JavaScript source files to identify errors and poor code
 * implementation.
 */
module.exports = {
    options: {
        jshintrc: 'conf/.jshintrc',
        reporter: require('jshint-stylish')
    },
    dist: [
        'dist/ngsolr.js'
    ],
    src: [
        'Gruntfile.js',
        '<%= src %>/**/*.js',
        '!<%= src %>/examples/js/**/*.js'
    ],
    test: {
        src: ['test/**/*.js']
    }
};
