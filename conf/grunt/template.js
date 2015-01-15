/**
 * Build application HTML page
 */
module.exports = {
    options: {
        data: '<%= manifest %>'
    },
    dist: {
        files: {
            '<%= dist %>/examples/index.html': [ '<%= src %>/examples/index.html' ],
            '<%= dist %>/examples/searchbox.html': [ '<%= src %>/examples/searchbox.html' ]
        }
    }
};