autoWatch = true;
basePath = '../';

// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
// CLI --browsers Chrome,Firefox,Safari
browsers = ['Firefox'];

// list of files to exclude
exclude = [
    'app/assets/js/**/*.min.js'
];

// list of files / patterns to load in the browser
files = [
  JASMINE,
  JASMINE_ADAPTER,
  'app/assets/js/angular/angular.js',
  'app/assets/js/angular/angular-mocks.js',
  'app/assets/js/eac-ajax/*.js',
  'test/unit/*.js'
];

// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
// CLI --log-level debug
logLevel = LOG_DEBUG;

junitReporter = {
  outputFile: 'test/output/unit.xml',
  suite: 'unit'
};
