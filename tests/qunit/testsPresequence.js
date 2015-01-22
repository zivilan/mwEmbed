/**
 * Created by itayi on 1/21/15.
 */
//$("body").append('<div id="myVideoTarget" style="width:400px;height:330px;"></div>');
$("body").append('<div id="kdp" style="width:400px;height:330px;"></div>');
//QUnit.reset();  // should clear the DOM before the test - in case we want to rerun the test
//QUnit.init();   // resets the qunit test environment - calls start which is bad for us


//$("body").bind('tests-listener', function(resultsObject){
//    QUnit.test(resultsObject.title, function (assert) {
//        assert.ok(resultsObject.success(), resultsObject.message);
//    });
//
//});