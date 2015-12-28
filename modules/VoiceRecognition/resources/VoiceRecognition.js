( function( mw, $ ) {"use strict";


	mw.PluginManager.add( 'voiceRecognition', mw.KBaseComponent.extend({

		defaultConfig: {
			'parent': 'controlsContainer',
			'order': 66,
			'visible': true,
			'align': "right",
			'showTooltip': true,
			'autoStart':false, //should voice recognition automatically start
			'continuous':false, //when the user stops talking, speech recognition will end
			'autoRestart':true, //Should voice recognition restart itself if it is closed indirectly, because of silence or window conflicts
			'tooltip': gM( 'mwe-VoiceRecognition-tooltip' )
		},

		active: false,

		isSafeEnviornment: function(){
			return mw.isChrome();
		},

		setup: function( embedPlayer ) {
			var _this = this;

			//start commands
			this.setupCommands();

			//set language
			annyang.setLanguage("en-US");

			//auto start voice recognition
			if(this.getConfig('autoStart')){
				this.startVoiceRecognition();
			}
			//debugging
			annyang.addCallback('result', function (userSaid) {
				mw.log( "VoiceRecognition:: said: " + userSaid);
			});

		},
		startVoiceRecognition: function(){
			annyang.start({autoRestart: this.getConfig('autoRestart'), continuous: this.getConfig('continuous')});
			this.displayMessage("Voice Recognition Active");
			this.updateTooltip( "Voice Recognition On" );
		},

		stopVoiceRecognition: function(){
			annyang.pause();
			this.displayMessage("Voice Recognition Paused");
			this.updateTooltip( "Voice Recognition Off" );
		},

		displayMessage: function(message){
			var embedPlayer = this.embedPlayer;
			if ($(embedPlayer).find(".voiceRecogMsg").length === 0){
				$(embedPlayer).append($('<span />').addClass( 'voiceRecogMsg' ));
			}
			$(embedPlayer).find(".voiceRecogMsg").html( message ).hide().fadeIn(1500).fadeOut(1500);
		},

		setupCommands: function(){
			var _this = this;
			var embedPlayer = this.embedPlayer;

			var commands = {
				'(Kaltura) play': function () {
					embedPlayer.play();
					_this.displayMessage("Playing");
				},
				'(Kaltura) play next': function () {
					embedPlayer.triggerHelper( 'playNextClip' );
					_this.displayMessage("Playing next video");
				},
				'(Kaltura) play previous': function () {
					embedPlayer.triggerHelper( 'playPreviousClip' );
					_this.displayMessage("Playing previous video");
				},
				'(Kaltura) stop': function () {
					embedPlayer.stop();
					_this.displayMessage("Stop");
				},
				'(Kaltura) pause': function () {
					embedPlayer.pause();
					_this.displayMessage("Pause");
				},
				'(Kaltura) go to *seekTime': function (seekTime) {
					var hours, minutes, seconds, seekTimeTotal;
					//some times the numbers appear as words need to replace them
					var wordToNumber = {
						one: "1",
						two: "2",
						three: "3"
					};
					seekTime = seekTime.replace(/one|two|three/gi, function (matched) {
						return wordToNumber[matched];
					});

					//locate hours minutes and seconds if exist in sentence
					hours = (parseInt(seekTime.match(/([\d]+)(?= hour)/)) * 60 * 60) || 0;
					minutes = (parseInt(seekTime.match(/([\d]+)(?= minute)/)) * 60) || 0;
					seconds = parseInt(seekTime.match(/([\d]+)(?= second)/)) || 0;

					//Combine time
					seekTimeTotal = hours + minutes + seconds;

					//check if is a number and seek
					if (!isNaN(parseFloat(seekTimeTotal)) && isFinite(seekTimeTotal) &&
						seekTimeTotal !== 0 &&
						seekTimeTotal <= embedPlayer.duration) {
						embedPlayer.seek(seekTimeTotal);
						_this.displayMessage("Seeking to: " + seekTime);
					} else {
						_this.displayMessage("Can't seek to invalid time");
					}
				},
				'(Kaltura) captions': function () {
					embedPlayer.getInterface().find(".icon-cc").trigger("click");
					_this.displayMessage("Show captions menu");
				},
				'(Kaltura) select *captLanguage captions': function (captLanguage) {
					embedPlayer.triggerHelper('showClosedCaptions', captLanguage);
					embedPlayer.getInterface().find(".icon-cc").trigger("click");
					_this.displayMessage("Selected " + captLanguage + " captions");
				},
				'(Kaltura) volume Up': function () {
					embedPlayer.setVolume(embedPlayer.volume + 0.2);
					_this.displayMessage("Volume up");
				},
				'(Kaltura) volume Down': function () {
					embedPlayer.setVolume(embedPlayer.volume - 0.2);
					_this.displayMessage("Volume down");
				},
				'(Kaltura) volume Max': function () {
					embedPlayer.setVolume(1);
					_this.displayMessage("Volume max");
				},
				'(Kaltura) volume Mute': function () {
					embedPlayer.setVolume(0);
					_this.displayMessage("Volume mute");
				},
				'(Kaltura) download': function () {
					embedPlayer.triggerHelper('downloadMedia');
					_this.displayMessage("Download media");
				},
				'(Kaltura) full screen': function () {
					embedPlayer.toggleFullscreen();
					_this.displayMessage("Open full screen");
				}
			};
			annyang.addCommands(commands);
		},

		getComponent: function() {
			var _this = this;
			if( !this.$el ) {
				this.$el = $( '<button/>' )
					.attr( 'title', this.getConfig('tooltip') )
					.addClass( "btn icon-mic" + this.getCssClass() )
						.click( function(){
							_this.active = !_this.active;
								if(_this.active){
									_this.startVoiceRecognition();
								} else {
									_this.stopVoiceRecognition();
								}
							var iconColor = _this.active ? "LawnGreen" : "white";
							$(_this.embedPlayer.getInterface().find(".icon-mic").css("color", iconColor));
						});
			}
			return this.$el;
		}
	}));
} )( window.mw, window.jQuery );