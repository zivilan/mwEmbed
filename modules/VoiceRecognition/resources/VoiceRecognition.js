( function( mw, $ ) {"use strict";


	mw.PluginManager.add( 'voiceRecognition', mw.KBaseComponent.extend({

		defaultConfig: {
			'parent': 'controlsContainer',
			'order': 66,
			'visible': true,
			'align': "right",
			'showTooltip': true,
			'autoStart':false,
			'tooltip': gM( 'mwe-VoiceRecognition-tooltip' )
		},

		setup: function( embedPlayer ) {
			var _this = this;
			//this.addBindings();

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
			annyang.start({autoRestart: true, continuous: true});
		},

		stopVoiceRecognition: function(){
			annyang.pause();
		},

		addBindings: function() {

		},

		setupCommands: function(){
			var embedPlayer = this.embedPlayer;

			var commands = {
				'Player play': function () {
					embedPlayer.play();
				},
				'Player stop': function () {
					embedPlayer.stop();
				},
				'Player pause': function () {
					embedPlayer.pause();
				},
				'Player go to *seekTime': function (seekTime) {
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
					if (!isNaN(parseFloat(seekTimeTotal)) && isFinite(seekTimeTotal) && seekTimeTotal !== 0) {
						embedPlayer.seek(seekTimeTotal);
					}
				},
				'Player captions': function () {
					embedPlayer.getInterface().find(".icon-cc").trigger("click");
				},
				'Player select *captLanguage captions': function (captLanguage) {
					embedPlayer.triggerHelper('showClosedCaptions', captLanguage);
					embedPlayer.getInterface().find(".icon-cc").trigger("click");
				},
				'Player volume Up': function () {
					embedPlayer.setVolume(embedPlayer.volume + 0.2);
				},
				'Player volume Down': function () {
					embedPlayer.setVolume(embedPlayer.volume - 0.2);
				},
				'Player volume Max': function () {
					embedPlayer.setVolume(1);
				},
				'Player volume Mute': function () {
					embedPlayer.setVolume(0);
				},
				'full': function () {
					embedPlayer.openNewWindow();
				}
			};
			annyang.addCommands(commands);
		},

		getComponent: function() {
			var _this = this;
			if( !this.$el ) {
				this.$el = $( '<button/>' )
					.attr( 'title', this.tooltip )
					.addClass( "btn icon-mic" + this.getCssClass() )
						.click( function(){
							_this.isActive = !_this.isActive;
								if(_this.isActive){
									_this.startVoiceRecognition();
								} else {
									_this.stopVoiceRecognition();
								}
							var iconColor = _this.isActive ? "LawnGreen" : "white";
							$(_this.embedPlayer.getInterface().find(".icon-mic").css("color", iconColor));
						});
			}
			return this.$el;
		}
	}));
} )( window.mw, window.jQuery );