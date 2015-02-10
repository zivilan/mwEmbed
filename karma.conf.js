// Karma configuration
// Generated on Mon Jan 19 2015 12:28:38 GMT+0200 (IST)
// https://github.com/karma-runner/karma/blob/master/docs/config/01-configuration-file.md

//TODO: add QUnit.reset(); in all html test pages <script> (to clear the DOM)
//TODO: add either origin ignore in header or flag in all browser launchers so it won't have internet security
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['qunit'],
    //plugins: ['karma-qunit'],

    // list of files / patterns to load in the browser
    files: [
      'resources/jquery/jquery.min.js',
      'tests/qunit/testsPresequence.js'



      //'mwEmbed/resources/jquery/jquery.min.js',
      //'mwEmbed/tests/qunit/testsPresequence.js',
      //'http://localhost/html5.kaltura/mwEmbed/modules/KalturaSupport/tests/AccessControlNewApi.qunit.html'
      //'mwEmbed/resources/jquery/jquery.min.js',
      //'mwEmbed/tests/qunit/testsPresequence.js',
      //'http://localhost/html5.kaltura/mwEmbed/modules/KalturaSupport/tests/AccessControlNewApi.qunit.html'



      //'http://localhost/html5.kaltura/mwEmbed/modules/KalturaSupport/tests/AccessControlNewApi.qunit.html'
    ],


    // list of files to exclude
    exclude: [
      //'mwEmbed/resources/*',
      //'mwEmbed/tests/*',
      //'mwEmbed/**/phantom.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: { '*.html': 'html2js' },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    //reporters: ['progress','dots'],
    reporters : ['dots', 'junit'],
    junitReporter : {
      outputFile: 'test-results.xml'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,

    browserNoActivityTimeout: 5000,
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],//, 'Safari', 'Firefox', 'IE'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
