module.exports = {
    dist: {
        files: ['<%= conf %>/**/*','<%= src %>/**/*','Gruntfile.js'],
        tasks: [ 'compile' ],
        options: {}
    }
};
