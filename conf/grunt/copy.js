/**
 * Copy files to the specified locations.
 */
module.exports = {
    dist: {
        files: [
            {
                cwd: '<%= src %>/examples',
                expand: true,
                src: ['**/*', '!**/sass'],
                dest: '<%= dist %>/examples'
            },
            {
                cwd: '<%= src %>/ngsolr',
                expand: true,
                src: ['**/*', '!**/banner.js'],
                dest: '<%= dist %>/examples/js/ngsolr'
            },
            {
                cwd: '<%= bower_components %>',
                expand: true,
                src: ['**/*'],
                dest: '<%= dist %>/examples/vendor'
            }
        ]
    }
};
