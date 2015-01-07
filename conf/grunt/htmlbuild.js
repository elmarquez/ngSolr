/**
 * Build the HTML file, injecting arguments and external resources references
 * into the document.
 */
module.exports = {
    dist: {
        src: '<%= src %>/examples/index.html',
        dest: '<%= dist %>/examples/index.html',
        options: {
            beautify: true,
            scripts: {
                app: [
                    'dist/<%= dist %>/js/**/*.js',
                    '!dist/<%= dist %>/js/**/*.min.js',
                    '!dist/<%= dist %>/js/mock/**/*'
                ],
                head: [
                    'dist/<%= dist %>/vendor/jquery/jquery.js',
                    'dist/<%= dist %>/vendor/angular/angular.js',
                    'dist/<%= dist %>/vendor/angular-cookies/*.min.js',
                    'dist/<%= dist %>/vendor/angular-loader/*.min.js',
                    'dist/<%= dist %>/vendor/angular-resource/*.min.js',
                    'dist/<%= dist %>/vendor/angular-route/*.min.js',
                    'dist/<%= dist %>/vendor/angular-sanitize/*.min.js',
                    'dist/<%= dist %>/vendor/sass-bootstrap/bootstrap.js'
                ],
                ie: [
                    'dist/<%= dist %>/vendor/es5-shim/es5-shim.min.js',
                    'dist/<%= dist %>/vendor/json3/json3.min.js'
                ],
                mock: [],
                vendor: [
                    'dist/<%= dist %>/vendor/csg/csg.js',
                    'dist/<%= dist %>/vendor/ng-scrollbar/dist/ng-scrollbar.min.js',
                    'dist/<%= dist %>/vendor/paper/dist/paper-full.min.js'
                ]
            },
            styles: {
                bower: ['dist/<%= dist %>/vendor/**/*.min.css'],
                head: [
                    'dist/<%= dist %>/css/**/*.css',
                    '!dist/<%= dist %>/css/**/*.min.css',
                    'dist/<%= dist %>/vendor/fontawesome/css/font-awesome.min.css',
                    'dist/<%= dist %>/vendor/ng-scrollbar/dist/ng-scrollbar.min.css'
                ]
            },
            sections: {},
            data: {
                description: "<%= pkg.description %>",
                name: "<%= pkg.name %>",
                release: "<%= buildTimeStamp %>",
                version: "<%= pkg.version %>"
            }
        }
    }
};