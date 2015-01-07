/**
 * Concatenate files together.
 */
module.exports = {
    app: {
        options: {
            separator: ';\n\n'
        },
        src: [
            '<%= src %>/ngsolr/app.js',
            '<%= src %>/ngsolr/**/*.js',
            '!<%= src %>/ngsolr/app/*.js'
        ],
        dest: '<%= dist %>/ngsolr.js'
    }
};
