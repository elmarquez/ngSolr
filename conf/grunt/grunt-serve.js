/**
 * Start a local web server and serve the application on the first available
 * network port. Open the default web browser to view the home page.
 * @param grunt Grunt
 */
module.exports = function (grunt) {
    grunt.registerTask('serve',
        'Start web server and serve the application',
        ['compile','connect::keepalive']);
};
