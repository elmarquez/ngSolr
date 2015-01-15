module.exports = function (grunt) {
    grunt.registerTask('compile',
        "Compile a distributable version of the application in dist/",
        function () {
            grunt.task.run([
                'clean:dist',
                'jshint:src',
                'compass:dist',
                'copy:dist',
                'cssmin:dist',
                'concat:app',
                'sed:dist_use_strict',
                'concat:dist',
                'uglify',
                'jshint:dist',
                'template'
            ]);
        }
    );
};
