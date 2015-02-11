module.exports = function(grunt) {

    grunt.initConfig({
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            category1: {
                options: {
                    files: [
                        'mwEmbed/resources/jquery/jquery.min.js',
                        'mwEmbed/tests/qunit/testsPresequence.js',
                        'http://localhost/html5.kaltura/mwEmbed/modules/DoubleClick/tests/DoubleClickAdEvents.qunit.html']
                    junitReporter : {
                      outputFile: 'test-results1.xml'
                    }
                }
            },
            category2: {
                options: {
                    files: [
                        'mwEmbed/resources/jquery/jquery.min.js',
                        'mwEmbed/tests/qunit/testsPresequence.js',
                        'http://localhost/html5.kaltura/mwEmbed/modules/KalturaSupport/tests/AccessControlNewApi.qunit.html']
                    junitReporter : {
                        outputFile: 'test-results2.xml'
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default',['karma:category1','karma:category2']);//

};


