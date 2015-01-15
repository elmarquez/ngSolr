module.exports = {
    src: {
        options: {
            base: '<%= dist %>/examples',
            debug: true,
            hostname: '0.0.0.0',
            livereload: false,
            open: true,
            port: 8080,
            protocol: 'http',
            useAvailablePort: true
        }
    }
};
