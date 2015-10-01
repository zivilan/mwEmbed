(function (mw, $) {
    "use strict";
    $.cpObject = {};
    $.quizParams = {};
    mw.PluginManager.add('quiz', mw.KBaseScreen.extend({
        defaultConfig: {
            parent: "controlsContainer",
            order: 5,
            align: "right",
            tooltip:  gM( 'mwe-quiz-tooltip' ),
            visible: false,
            showTooltip: true,
            displayImportance: 'medium',
            templatePath: '../Quiz/resources/templates/quiz.tmpl.html',
            usePreviewPlayer: false,
            previewPlayerEnabled: false
        },

        entryData: null,
        state: "start",
        currentQuestionNumber:0,
        kQuizUserEntryId:null,
        reviewMode:false,
        ansReviewMode:true,
        showCorrectKeyOnAnswer:false,
        showResultOnAnswer:false,
        showCorrectAfterSubmission: false,
        inVideoTip:null,
        canDownloadQuestions:'',
        canSkip:null,
        showTotalScore:'',
        score:null,



        setup: function () {
            var _this = this;
            var getQuizuserEntryIdAndQuizParams =  [{
                'service': 'userEntry',
                'action': 'list',
                'filter:objectType':'KalturaQuizUserEntryFilter',
                'filter:entryIdEqual':_this.embedPlayer.kentryid,
                'filter:userIdEqualCurrent':'1',
                'filter:orderBy':'-createdAt'
            },{
                'service': 'quiz_quiz',
                'action': 'get',
                'entryId': _this.embedPlayer.kentryid
            }

            ];

            _this.getKClient().doRequest(getQuizuserEntryIdAndQuizParams, function (data) {
                if (typeof data[0].code !== 'undefined' || typeof data[1].code !== 'undefined') {
                    console.log('Error Connecting to Quiz : ' + (data[0].code));
                    return
                }
                if (data[0].totalCount > 0 &&  !$.isEmptyObject(data[0].objects[0])  ) {
                    _this.kQuizUserEntryId = data[0].objects[0].id;

                    switch(String(data[0].objects[0].status)) {

                        case 'quiz.3':
                            _this.score = (data[0].objects[1].score);
                            _this._getQuestionCpAPI(_this._populateCpObject);
                            break;
                        case '1':
                            _this._getQuestionCpAPI(_this._populateCpObject);
                            break;
                        case '2':
                            _this.state = "deleted";
                            break;
                    }
                }
                else{
                    var createQuizuserEntryId =  {
                         'service': 'userEntry',
                         'action': 'add',
                         'userEntry:objectType':'KalturaQuizUserEntry',
                         'userEntry:entryId':_this.embedPlayer.kentryid
                    };
                    _this.getKClient().doRequest(createQuizuserEntryId, function (data) {
                        _this.kQuizUserEntryId = data.id;
                        _this._getQuestionCpAPI(_this._populateCpObject);
                    });
                }
                $.quizParams = data[1];
            });
            this.addBindings();
        },
        addBindings: function () {
            var _this = this;
            var embedPlayer = this.getPlayer();
            this.bind('layoutBuildDone', function () {
                var entryRequest = {
                    'service': 'baseEntry',
                    'action': 'get',
                    'entryId': embedPlayer.kentryid
                };
                _this.getKClient().doRequest(entryRequest, function (entryDataResult) {
                    _this.entryData = entryDataResult;
                    _this._initParams();
                    if (_this.state == 'deleted'){
                        _this._showDeletedScreen()
                    }else{
                        _this._showWelcomeScreen();
                    }

                 });

            });

            this.bind( 'KalturaSupport_CuePointReached', function ( e, cuePointObj ) {
                 _this.qCuePointHandler( e, cuePointObj );
            });
        },
      getKClient: function () {
            if (!this.kClient) {
                this.kClient = mw.kApiGetPartnerClient(this.embedPlayer.kwidgetid);
            }
            return this.kClient;
        },

        getTemplateHTML: function(data){
            var _this = this;
            var defer = $.Deferred();
            this.getPlayer().disablePlayControls();
            var quizStartTemplate = this.getTemplatePartialHTML("quizstart");

            var $template =  $(quizStartTemplate({
                'quiz': this,
                quizStartTemplate: quizStartTemplate
            }));

            $template
                .find('[data-click],[data-notification]')
                .click(function(e){
                    var data = $(this).data();
                    return _this.handleClick( e, data );
                });

            return defer.resolve($template);
        },
        handleClick: function( e, data ){
            e.preventDefault();

            if( data.click && $.isFunction(this[data.click]) ){
                this[data.click]( e, data );
            }

            if( data.notification ){
                this.getPlayer().sendNotification( data.notification, data );
            }
            return false;
        },

        continuePlay:function(){
            this.getPlayer().enablePlayControls();
            this.removeScreen();
            this.getPlayer().play();
        },

       _initParams:function(){
           var _this = this;
           $.grep($.quizParams.uiAttributes ,function(e){

               if (e.key == "canSkip"){
                   _this.canSkip = e.value;
               }

               if (e.key == "inVideoTip"){
                   _this.inVideoTip = e.value;
               }
           });
       },

        _showWelcomeScreen:function(){
           var _this = this;
             $.grep($.quizParams.uiAttributes ,function(e){
               if (e.key == "welcomeMessage"){
                    _this.state = 'welcome';
                    _this.showScreen();
                    $(".sub-text").html(e.value );
                   $(".confirm-box").html(gM('mwe-quiz-continue'));
               }
           });
            $(document).on('click','.confirm-box', function (){
                _this.checkIfDone(0);
            });
       },
        _showDeletedScreen:function(){
            var _this = this;
            _this.state ='contentScreen';
            _this.showScreen();
            $(".title-text").html(gM('mwe-quiz-no-longer-exist'));
            $(".confirm-box").html(gM('mwe-quiz-continue'))
                .on('click', function (){
                    $(document).off();
                    _this.removeScreen();
                    _this.continuePlay();
                });
        },

        _gotoScrubberPos:function(questionNr){
           var kdp = this.getPlayer();
               kdp.sendNotification('doSeek',($.cpObject.cpArray[questionNr].startTime)/900);
        },
        qCuePointHandler:function  (e, cuePointObj){

            var _this = this;
            $.each($.cpObject.cpArray,function(key,val){
                    if ($.cpObject.cpArray[key].startTime === cuePointObj.cuePoint.startTime){
                        _this.currentQuestionNumber = key;
                        _this.setCurrentQuestion(key);
                    }
            });
        },

        showUnAnswered:function(cPo,questionNr){
            var _this = this;
            _this._selectAnswerConroller(cPo,questionNr);
        },
        showAnswered:function(cPo,questionNr){
            var _this = this;
            $.each( cPo.answeres, function( key, value ) {
                if (key == $.cpObject.cpArray[questionNr].selectedAnswer){
                    $('#'+key).css({"width":"76vw","height":$(this).outerHeight(),"overflow":"hidden","color":"black"})
                        .after( "<div class='single-answer-box-apply'>gM('mwe-quiz-applied')</div>" );
                    $($('#'+key).parent().css( {"background-image": "url(../resources/ApplliedBG.png)"}));
                }
            });

            if ($.quizParams.allowAnswerUpdate){
                _this._selectAnswerConroller(cPo,questionNr);
            }
        },
        _selectAnswerConroller:function(cPo,questionNr){
            var _this = this;
            var selectedAnswer = null;

            if (_this.score !=null)return;

            $(document).off();
            $(document).on('click','.single-answer-box', function () {
                $(".single-answer-box").each(function( index ) {
                    $(".single-answer-box-apply" ).detach();
                    $(this).css({"width":"96vw","height":"","overflow":"","color":""}).parent().css({"background-image":""});
                });
                $( this ).css( {"width":"76vw","height":$(this).outerHeight(),"overflow":"hidden","color":"black"})
                    .after( "<div class='single-answer-box-apply'>Apply</div>")
                    .parent().css( {"background-image": "url(../resources/ApplyBG.png)"});
                selectedAnswer = $( this ).attr('id');
            });

            $(document).on('click','.single-answer-box-apply', function (){
                $.cpObject.cpArray[questionNr].selectedAnswer = selectedAnswer;

               var answerParams = {};
               var  quizSetAnswer = {
                    'service': 'cuepoint_cuepoint',
                    'cuePoint:objectType': "KalturaAnswerCuePoint",
                    'cuePoint:answerKey': _this.i2q(selectedAnswer),
                    'cuePoint:quizUserEntryId': _this.kQuizUserEntryId
                };

                if ($.cpObject.cpArray[questionNr].isAnswerd){
                    answerParams =   {
                        'action': 'update',
                        'id':$.cpObject.cpArray[questionNr].answerCpId,
                        'cuePoint:entryId': _this.embedPlayer.kentryid
                    }
                }else{
                    $.cpObject.cpArray[questionNr].isAnswerd = true;
                    answerParams ={
                        'action': 'add',
                        'cuePoint:entryId': $.cpObject.cpArray[questionNr].cpEntryId,
                        'cuePoint:parentId': $.cpObject.cpArray[questionNr].cpId,
                        'cuePoint:startTime':'0'
                    };
                }
                 _this._addAnswerAPI(
                     _this.i2q(questionNr),
                     $.extend(quizSetAnswer, answerParams)
                );

                $(this).html("Applied")
                    .parent().css({"background-image":"url(../resources/ApplliedBG.png)"});
                $(this).delay(1000).fadeIn(function(){
                    _this.removeScreen();
                    _this.checkIfDone(questionNr)
                });

            });
        },
        _addAnswerAPI:function(questionNr,quizSetAnswer){

            var _this = this;
            new kWidget.api({'wid':_this.getKClient().wid} ).doRequest( quizSetAnswer, function( result ){
                $.cpObject.cpArray[_this.q2i(questionNr)].isCorrect = result.isCorrect;
                $.cpObject.cpArray[_this.q2i(questionNr)].explanation = result.explenation;
                $.cpObject.cpArray[_this.q2i(questionNr)].correctAnswerKeys = result.correctAnswerKeys;
                return result;
            });

        },
        almostDone:function(unAnswerdArr){
            var _this = this;
            _this.removeScreen();
            _this.state = "contentScreen";

            _this.showScreen();

            $("div").removeClass('confirm-box');
            $(".title-text").html("Almost Done");
            $(".sub-text").html("It appears that the following questions remained unanswered"+"</br>"+"Press on relevant question to answer");

            $.each( unAnswerdArr, function( key, value ) {
                $(".display-content").append("<div class ='q-box' id="+value+">"+ _this.i2q(value) +"</div>" );
            });
              $(document).on('click','.q-box', function (){
                var selectQ = $(this).attr('id');
                _this._gotoScrubberPos(selectQ);
            });

        },

        checkIfDone:function(questionNr){
            var _this = this;
            if (_this.score!=null){
                _this.submitted(_this.score);
            }else {

                if ( $.isEmptyObject( $.grep( $.cpObject.cpArray, function(el){return el.isAnswerd === false}))  ){

                    _this.allCompleted();
                }
                else{
                    if (questionNr === ($.cpObject.cpArray.length) - 1){
                        _this.almostDone(_this.getUnansweredQuestNrs());
                    }else{
                        _this.continuePlay();
                    }
                }
            }
        },
        getUnansweredQuestNrs:function(){
            var unanswerdArr = [];
            $.each($.cpObject.cpArray,function(key,val){
                if ($.cpObject.cpArray[key].isAnswerd === false){
                    unanswerdArr.push( $.cpObject.cpArray[key].key);
                }
            });

            if ($.isEmptyObject(unanswerdArr)) return false;
            else return unanswerdArr;
        },
        displayHint:function(questionNr){
            var _this=this;

                $(".header-container").append("<div class ='hint-box'>HINT</div>");
                $(document).on('click', '.hint-box', function () {
                    _this.removeScreen();
                    _this.state = "hint";
                    _this.showScreen();
                    $(".hint-container").append($.cpObject.cpArray[questionNr].hintText + 'hint');
                    $('.confirm-box').html("Back to Question");
                    $(document).off('click', '.confirm-box').on('click', '.confirm-box', function () {
                        _this.removeScreen();
                        _this.setCurrentQuestion(questionNr);
                    });
                })

        },

        displayWhy:function(questionNr){
            var _this=this;
            $(document).off();
            $(".header-container").append("<div class ='hint-box'>WHY</div>");
            $(".hint-container").append($.cpObject.cpArray[questionNr].explanation );
            $('.confirm-box').html("Back ");
            $(document).off('click', '.confirm-box').on('click', '.confirm-box', function () {
                _this.state = "reviewAnswer";
                _this.removeScreen();
                _this.reviewAnswer(_this.score);
            });

        },

        setCurrentQuestion:function(questionNr) {
            var _this = this;
            var cPo = $.cpObject.cpArray[questionNr];
            _this.removeScreen();
            this.state = "question";
            _this.showScreen();
            $(document).off();
            $(".display-question").html(cPo.question );
            $.each( cPo.answeres, function( key, value ) {
                $(".answers-container").append(
                    "<div class ='single-answer-box-bk'>" +
                    "<div class ='single-answer-box' id="+key+">"+value+"</div></div>"
                );
            });

            $(".single-answer-box-bk")
                .hover(function() {
                    $(this).animate({opacity: '0.8'}, "fast");
                }, function () {
                    $(this).animate({opacity: '1'}, "fast");
                });

            if ( cPo.isAnswerd) {
                _this.showAnswered(cPo, questionNr);
            }
            else{
                _this.showUnAnswered(cPo, questionNr);
            }

            if (_this.inVideoTip) {
                _this.displayHint(questionNr);
            }
            this.addFooter(questionNr);
        },

        addFooter:function(questionNr){
            var _this = this;
            if (this.reviewMode){
                $(".ftr-left").html("DONE REVIEW").on('click', function (){
                    _this.removeScreen();
                    _this.allCompleted();
                });
                $(".ftr-right").html("REVIEW NEXT QUESTION").on('click', function (){
                    _this.removeScreen();
                    function nextQuestionNr (questionNr){
                        if (questionNr == $.cpObject.cpArray.length -1){
                            return 0;
                        }else{
                            return ++questionNr;
                        }
                    }
                    _this.setCurrentQuestion(nextQuestionNr(questionNr));
                });
            }else{
                $(".ftr-left").html("QUESTION NR " + this.i2q(questionNr));
                if (_this.canSkip) {
                    $(".ftr-right").html("SKIP FOR NOW").on('click', function () {
                        _this.checkIfDone(questionNr);
                    });
                }
            }
        },

        allCompleted:function(){
            var _this = this;
            this.state = "contentScreen";
            this.reviewMode = true;
            _this.removeScreen();
            _this.showScreen();

            $(".title-text").html("Completed");
            $(".sub-text").html("Take a moment to review your answeres below, or go ahead and submit.");

            $.each( $.cpObject.cpArray, function( key, value ) {
                $(".display-content").append("<div class ='q-box' id="+key+">"+ _this.i2q(key) +"</div>" );
            });

            $(document).on('click','.q-box', function (){
                this.currentQuestionNumber = $(this).attr('id');
                _this.setCurrentQuestion(this.currentQuestionNumber);
            });

            $(".confirm-box").html("Submit");

            $(document).on('click','.confirm-box', function (){

                _this._submitQuizApi();

            });
        },

        _submitQuizApi:function(){
            var _this = this;
            var submitQuizParams =  {
                'service': 'userEntry',
                'action': 'submitQuiz',
                'id':_this.kQuizUserEntryId
            };
            _this.getKClient().doRequest(submitQuizParams, function (data) {
                _this.score = data.score;
                _this.submitted(data.score);
            });
        },
        submitted:function(score){
            var _this = this;
            var cPo = $.cpObject.cpArray;
            _this.removeScreen();
            this.state = "contentScreen";
            _this.showScreen();

            $(".title-text").html("Submitted");

            if (!this.ansReviewMode){
                $(".sub-text").html("you completed the quiz, your score is "+score+" ");
            }else{
                $(".sub-text").html("you completed the quiz, your score is "+score+" press any question to review submission ");

                $.each( cPo, function( key, value ) {
                    var className = (function(){
                        if (value.isCorrect){
                            return 'q-box';
                        }
                        else{
                            return 'q-box-false';
                        }
                    })();

                    $(".display-content").append("<div class ="+className+" id="+key+">"+ _this.i2q(key) +"</div>");
                    $(document).on('click','.q-box', function (){
                        _this.removeScreen();
                        _this.state = "reviewAnswer";
                        _this.reviewAnswer($(this).attr('id'));
                    });
                    $(document).on('click','.q-box-false', function (){
                        _this.removeScreen();
                        _this.state = "reviewAnswer";
                        _this.reviewAnswer($(this).attr('id'));
                    });
                });
            }


            $(".confirm-box").html("Ok")
                .on('click', function (){
                    $(document).off();
                    _this.removeScreen();
                    _this.state = "contentScreen";
                    _this.showScreen();

                    $(".title-text").html("Thank You.");
                    $("div").removeClass('confirm-box');

                });
        },
        reviewAnswer:function(selectedQuestion){
            var _this = this;
            _this.showScreen();
            $(document).off();

            $(".header-container").append("<div class ='hint-box'>WHY</div>");



            $(document).on('click', '.hint-box', function () {
                _this.removeScreen();
                _this.state = "why";
                _this.showScreen();
                _this.displayWhy(selectedQuestion);
            });

            $(".reviewAnswerNr").append( _this.i2q(selectedQuestion) );
            $(".theQuestion").html("Q:  "+$.cpObject.cpArray[selectedQuestion].question );
            $(".yourAnswerText").html("Your Answer:");
            $(".yourAnswer").html($.cpObject.cpArray[selectedQuestion].answeres[$.cpObject.cpArray[selectedQuestion].selectedAnswer] );
            if (!$.cpObject.cpArray[selectedQuestion].isCorrect){
                $(".yourAnswer").addClass("wrongAnswer")
            }
            $(".correctAnswerText").html("Correct Answer:");
            $(".correctAnswer").html(function(){
                    if (!$.isEmptyObject($.cpObject.cpArray[selectedQuestion].correctAnswerKeys)) {
                        return ($.cpObject.cpArray[selectedQuestion].correctAnswerKeys[0])
                    }
                    else return ""
            });
            $('.gotItBox').html("Got It !").bind('click',function(event) {
                _this.submitted(_this.score);
            });

        },

    _getQuestionCpAPI:function(callback){
            var _this = this;
            var getcp =[{
                'service': 'cuepoint_cuepoint',
                'action': 'list',
                'filter:entryIdEqual':_this.embedPlayer.kentryid,
                'filter:objectType':'KalturaCuePointFilter',
                'filter:cuePointTypeEqual':	'quiz.QUIZ_QUESTION',
                'filter:orderBy':'+startTime'
            },
            {
                'service': 'cuepoint_cuepoint',
                'action': 'list',
                'filter:objectType':'KalturaAnswerCuePointFilter',
                'filter:entryIdEqual':_this.embedPlayer.kentryid,
                'filter:userIdCurrent':'true',
                'filter:cuePointTypeEqual':	'quiz.QUIZ_ANSWER'
            }];

              _this.getKClient().doRequest(getcp,function( data ){
                  callback (data);
            });
        },

        _populateCpObject:function(data){
            var _this = this;
            var cpArray = [];

                for (var i = 0; i < (data[0].objects.length); i++) {
                    var arr = [];
                    $.each(data[0].objects[i].optionalAnswers , function( key, value ) {
                        arr.push(value.text.toString());
                    });

                    var ansP = {
                        isAnswerd:false,
                        selectedAnswer:null,
                        answerCpId:null,
                        isCorrect:null,
                        correctAnswerKeys:null,
                        explenation:null
                    };
                    if (!$.isEmptyObject( data[1].objects)){
                        $.grep( data[1].objects, function(el) {
                            if (el.parentId === data[0].objects[i].id) {
                                ansP.isAnswerd = true;
                                ansP.selectedAnswer = (parseInt(el.answerKey)-1);
                                ansP.answerCpId = el.id;
                                ansP.isCorrect = el.isCorrect;
                                ansP.correctAnswerKeys = el.correctAnswerKeys;
                                ansP.explenation = el.explanation;
                                return el
                            }
                        });
                    }
                    cpArray.push({
                        key: i,
                        question:data[0].objects[i].question,
                        answeres: arr,
                        isAnswerd:ansP.isAnswerd,
                        selectedAnswer:ansP.selectedAnswer,
                        isCorrect:ansP.isCorrect,
                        correctAnswerKeys:ansP.correctAnswerKeys,
                        explenation:ansP.explenation,
                        hintText:data[0].objects[i].hint,
                        startTime:data[0].objects[i].startTime,
                        cpId:data[0].objects[i].id,
                        cpEntryId:data[0].objects[i].entryId,
                        answerCpId:ansP.answerCpId

                    });
                }
            $.cpObject.cpArray = cpArray;
        },
        i2q:function(i){
            return parseInt(i)+1;
        },
        q2i:function(i){
            return parseInt(i)-1;
        }
    }));
})(window.mw, window.jQuery);