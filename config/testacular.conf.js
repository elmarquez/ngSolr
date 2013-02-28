basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'app/lib/angular/angular.js',
  'app/lib/angular/angular-*.js',
  'test/lib/angular/angular-mocks.js',
  'app/js/eac-ajax/*.js',
  'app/js/app.js',
  'app/js/controllers.js',
  'app/js/directives.js',
  'app/js/filters.js',
  'app/js/services.js',
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['chromium-browser'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
