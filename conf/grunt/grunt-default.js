/**
 * Display the list of high-level Grunt tasks.
 * @param grunt Grunt
 */
module.exports = function (grunt) {
    grunt.registerTask('default', ['availabletasks:main']);
};
