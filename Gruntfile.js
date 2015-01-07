'use strict';

var Path = require('path');

module.exports = function (grunt) {
    // Load the Grunt task definitions and configurations from the /conf/grunt
    // folder.
    require('load-grunt-config')(grunt, {
        init: true,
        configPath: Path.join(process.cwd(), 'conf', 'grunt'),
        loadGruntTasks: {
            pattern: 'grunt-*',
            config: require('./package.json'),
            scope: 'devDependencies'
        }
    });
    grunt.config('pkg', grunt.file.readJSON('package.json'));

    // Set global options
    grunt.config('bower_components', 'vendor');
    grunt.config('buildTimeStamp', new Date().toISOString());
    grunt.config('conf','conf');
    grunt.config('dist', 'dist');
    grunt.config('src', 'src');
};
