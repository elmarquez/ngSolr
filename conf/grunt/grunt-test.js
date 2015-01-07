/**
 * Execute the application test suite.
 * @param grunt Grunt
 */
module.exports = function (grunt) {
    grunt.registerTask('test',
        "Execute test suite",
        function() {
            grunt.task.run([
                'clean:dist'
            ]);
        }
)};
