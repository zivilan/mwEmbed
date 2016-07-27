
( function( mw, $ ) { "use strict";
	// Add chromecast player:
	$( mw ).bind('EmbedPlayerUpdateMediaPlayers', function( event, mediaPlayers ){
		var chromecastSupportedProtocols = ['video/h264', 'video/mp4', 'application/vnd.apple.mpegurl'];
		var chromecastReceiverPlayer = new mw.MediaPlayer('chromecastReceiver', chromecastSupportedProtocols, 'ChromecastReceiver');
		mediaPlayers.addPlayer(chromecastReceiverPlayer);
	});

	mw.EmbedPlayerChromecastReceiver = {
		// Instance name:
		instanceOf : 'ChromecastReceiver',
		bindPostfix: '.embedPlayerChromecastReceiver',
		// List of supported features:
		supports : {
			'playHead' : true,
			'pause' : true,
			'stop' : true,
			'volumeControl' : true,
			'overlays': true
		},
		seeking: false,
		triggerReplayEvent: false, // since native replay is not supported in the Receiver, we use this flag to send a replay event to Analytics
		currentTime: 0,
		nativeEvents: [
			'loadstart',
			'progress',
			'suspend',
			'abort',
			'error',
			'emptied',
			'stalled',
			'play',
			'pause',
			'loadedmetadata',
			'loadeddata',
			'waiting',
			'playing',
			'canplay',
			'canplaythrough',
			'seeking',
			'seeked',
			'timeupdate',
			'ended',
			'ratechange',
			'durationchange',
			'volumechange'
		],

		setup: function( readyCallback ) {
			$(this).bind('layoutBuildDone', function(){
				this.getVideoHolder().find('video').remove();
			});
			this.setPlayerElement(parent.document.getElementById('receiverVideoElement'));
			this.addBindings();
			this.applyMediaElementBindings();
			mw.log('EmbedPlayerChromecastReceiver:: Setup. Video element: '+this.getPlayerElement().toString());
			this.getPlayerElement().src = '';
			$(this).trigger("chromecastReceiverLoaded");
			this._propagateEvents = true;
			$(this.getPlayerElement()).css('position', 'absolute');
			this.stopped = false;
			readyCallback();
		},
		/**
		 * Apply player bindings for getting events from mpl.js
		 */
		addBindings: function(){
			var _this = this;
			this.bindHelper("layoutBuildDone", function(){
				_this.getVideoHolder().css("backgroundColor","transparent");
				$("body").css("backgroundColor","transparent");

			});
			this.bindHelper("replay", function(){
				_this.triggerReplayEvent = true;
				_this.triggerHelper("playerReady"); // since we reload the media for replay, trigger playerReady to reset Analytics
			});
			this.bindHelper("postEnded", function(){
				_this.currentTime = _this.getPlayerElement().duration;
				_this.updatePlayheadStatus();
			});
			this.bindHelper("onAdOpen", function(event, id, system, type){
				_this.triggerHelper("broadcastToSender", ["chromecastReceiverAdOpen"]);
			});
			this.bindHelper("AdSupport_AdUpdateDuration", function(event, duration){
				_this.triggerHelper("broadcastToSender", ["chromecastReceiverAdDuration|" + duration]);
			});
			this.bindHelper("onAdComplete", function(){
				_this.triggerHelper("broadcastToSender", ["chromecastReceiverAdComplete"]);
				_this.triggerHelper("cancelAllAds");
			});
			this.bindHelper("ccSelectClosedCaptions sourceSelectedByLangKey", function(e, label){
				_this.triggerHelper("propertyChangedEvent", {"plugin": "closedCaptions", "property":"captions", "value": typeof label === "string" ? label : label[0]});
				$(parent.document.getElementById('captionsOverlay')).empty();
			});
			this.bindHelper("chromecastSwitchMedia", function(e, eid){
				_this.sendNotification("changeMedia", {entryId: eid[0]});
			});

		},
		changeMediaCallback: function (callback) {
			// Check if we have source
			if (!this.getSource()) {
				callback();
				return;
			}
			var _this = this;
			// If switching a Persistent native player update the source:
			// ( stop and play won't refresh the source  )
			_this.switchPlaySource(this.getSource(), function () {
				callback();
			});
		},
		playerSwitchSource: function (source, switchCallback, doneCallback) {
			var _this = this;
			var src = source.getSrc();
			var vid = this.getPlayerElement();
			var switchBindPostfix = '.playerSwitchSource';
			this.isPauseLoading = false;

			// Make sure the switch source is different:
			if (!src || src == vid.src) {
				if ($.isFunction(switchCallback)) {
					switchCallback(vid);
				}
				// Delay done callback to allow any non-blocking switch callback code to fully execute
				if ($.isFunction(doneCallback)) {
					_this.ignoreNextError = false;
					doneCallback();
				}
				return;
			}

			// remove preload=none
			$(vid).attr('preload', 'auto');

			// only display switch msg if actually switching:
			this.log('playerSwitchSource: ' + src + ' native time: ' + vid.currentTime);

			// set the first embed play flag to true, avoid duplicate onPlay event:
			this.ignoreNextNativeEvent = true;

			// Update some parent embedPlayer vars:
			this.currentTime = 0;
			this.previousTime = 0;
			if (vid) {
				try {
					// Remove all old switch player bindings
					$(vid).unbind(switchBindPostfix);

					// pause before switching source
					vid.pause();

					var originalControlsState = vid.controls;
					// Hide controls ( to not display native play button while switching sources )
					vid.removeAttribute('controls');

					// dissable seeking ( if we were in a seeking state before the switch )
					_this.seeking = false;

					// Workaround for 'changeMedia' on Android & iOS
					// When changing media and not playing entry before spinner is stuck on black screen
					if (!_this.firstPlay) {
						// add a loading indicator:
						_this.addPlayerSpinner();
						//workaround bug where thumbnail appears for a second, add black layer on top of the player
						_this.addBlackScreen();
					}

					// empty out any existing sources:
					$(vid).empty();

					if (mw.isIOS7() && mw.isIphone()) {
						vid.src = null;
						var sourceTag = document.createElement('source');
						sourceTag.setAttribute('src', src);
						vid.appendChild(sourceTag);
					} else {
						// Do the actual source switch:
						vid.src = src;
					}
					// load the updated src
					//only on desktop safari we need to load - otherwise we get the same movie play again.
					if (mw.isDesktopSafari()) {
						vid.load();
					}

					// hide the player offscreen while we switch
					_this.hidePlayerOffScreen();

					// restore position once we have metadata
					$(vid).bind('loadedmetadata' + switchBindPostfix, function () {
						$(vid).unbind('loadedmetadata' + switchBindPostfix);
						_this.log(" playerSwitchSource> loadedmetadata callback for:" + src);
						// ( do not update the duration )
						// Android and iOS <5 gives bogus duration, depend on external metadata

						// keep going towards playback! if  switchCallback has not been called yet
						// we need the "playing" event to trigger the switch callback
						if (!mw.isIOS71() && $.isFunction(switchCallback) && !_this.isVideoSiblingEnabled()) {
							vid.play();
						} else {
							_this.removeBlackScreen();
						}
					});

					var handleSwitchCallback = function () {
						//Clear pause binding on switch exit in case it wasn't triggered.
						$(vid).unbind('pause' + switchBindPostfix);
						// restore video position ( now that we are playing with metadata size  )
						_this.restorePlayerOnScreen();
						// play hide loading spinner:
						_this.hideSpinner();
						// Restore
						vid.controls = originalControlsState;
						_this.ignoreNextError = false;
						_this.ignoreNextNativeEvent = false;
						// check if we have a switch callback and issue it now:
						if ($.isFunction(switchCallback)) {
							_this.log(" playerSwitchSource> call switchCallback");
							// restore event propagation:
							switchCallback(vid);
							switchCallback = null;
						}
					};

					// once playing issue callbacks:
					$(vid).bind('playing' + switchBindPostfix, function () {
						$(vid).unbind('playing' + switchBindPostfix);
						_this.log(" playerSwitchSource> playing callback: " + vid.currentTime);
						handleSwitchCallback();
						setTimeout(function () {
							_this.removeBlackScreen();
						}, 100);

					});

					// Add the end binding if we have a post event:
					if ($.isFunction(doneCallback)) {
						var sentDoneCallback = false;
						$(vid).bind('ended' + switchBindPostfix, function (event) {
							if (_this.disableSwitchSourceCallback) {
								return;
							}
							// Check if Timeout was activated, if true clear
							if (_this.mobileChromeTimeoutID) {
								clearTimeout(_this.mobileChromeTimeoutID);
								_this.mobileChromeTimeoutID = null;
							}
							sentDoneCallback = true;
							// remove end binding:
							$(vid).unbind(switchBindPostfix);
							// issue the doneCallback
							doneCallback();

							return false;
						});

						// Check if ended event was fired on chrome (android devices), if not fix by time difference approximation
						if (mw.isMobileChrome()) {
							$(vid).bind('timeupdate' + switchBindPostfix, function (e) {
								var _this = this;
								var timeDiff = this.duration - this.currentTime;

								if (timeDiff < 0.5 && this.duration != 0) {
									_this.mobileChromeTimeoutID = setTimeout(function () {
										_this.mobileChromeTimeoutID = null;
										// Check if timeDiff was changed in the last 2 seconds
										if (timeDiff <= (_this.duration - _this.currentTime)) {
											_this.log('playerSwitchSource> error in getting ended event, issue doneCallback directly.');
											if (!sentDoneCallback) {
												$(vid).unbind(switchBindPostfix);
												sentDoneCallback = true;
												doneCallback();
											}

										}
									}, 2000);
								}
							});
						}
					}

					// issue the play request:
					if (_this.isInSequence()){
						vid.play();
					}else{
						if ( !( _this.playlist && mw.isAndroid() ) ){
							_this.play();
						}

					}
					if (mw.isMobileDevice()) {
						setTimeout(function () {
							handleSwitchCallback();
						}, 100);
					}
					// check if ready state is loading or doing anything ( iOS play restriction )
					// give iOS 5 seconds to ~start~ loading media
					setTimeout(function () {
						// Check that the player got out of readyState 0
						if (vid.readyState === 0 && $.isFunction(switchCallback) && !_this.canAutoPlay()) {
							_this.log(" Error: possible play without user click gesture, issue callback");
							// hand off to the swtich callback method.
							handleSwitchCallback();
							// make sure we are in a pause state ( failed to change and play media );
							_this.pause();
						}
					}, 10000);


				} catch (e) {
					this.log("Error: switching source playback failed");
				}
			}
		},
		/**
		 * Apply media element bindings
		 */
		applyMediaElementBindings: function () {
			var _this = this;
			this.log("MediaElementBindings");
			var vid = this.getPlayerElement();
			if (!vid) {
				this.log(" Error: applyMediaElementBindings without player elemnet");
				return;
			}
			$.each(_this.nativeEvents, function (inx, eventName) {
				$(vid).unbind(eventName + _this.bindPostfix).bind(eventName + _this.bindPostfix, function () {
					// make sure we propagating events, and the current instance is in the correct closure.
					if (_this._propagateEvents && _this.instanceOf == 'ChromecastReceiver') {
						var argArray = $.makeArray(arguments);
						// Check if there is local handler:
						if (_this[ '_on' + eventName ]) {
							_this[ '_on' + eventName ].apply(_this, argArray);
						} else {
							// No local handler directly propagate the event to the abstract object:
							$(_this).trigger(eventName, argArray);
						}
					}
				});
			});
		},

		/**
		 * Handle the native paused event
		 */
		_onpause: function () {
			this.pause();
			$(this).trigger('onPlayerStateChange', [ "pause", "play" ]);

		},
		_onplaying:function(){
			this.hideSpinner();
			this.triggerHelper("playing");
			this.triggerHelper( 'hidePlayerControls' );
		},
		/**
		 * Handle the native play event
		 */
		_onplay: function () {
			this.restoreEventPropagation();
			if (this.currentState === "pause" || this.currentState === "start"){
				this.play();
				this.triggerHelper('onPlayerStateChange', [ "play", this.currentState ]);
			}
			if (this.triggerReplayEvent){
				this.triggerHelper('replayEvent');
				this.triggerReplayEvent = false;
			}
			this.triggerHelper( 'hidePlayerControls' );

		},
		replay: function(){
			var _this = this;
			this.restoreEventPropagation();
			this.restoreComponentsHover();
		},

		_onseeking: function () {
			this.triggerHelper( 'hidePlayerControls' );
			if (!this.seeking) {
				this.seeking = true;
				if ( this._propagateEvents && !this.isLive() ) {
					this.triggerHelper('seeking');
				}
			}
		},

		_onseeked: function () {
			if (this.seeking) {
				this.seeking = false;
				if (this._propagateEvents && !this.isLive()) {
					this.triggerHelper('seeked', [this.getPlayerElementTime()]);
					this.syncCurrentTime();
					this.updatePlayheadStatus();
				}
			}
		},

		// override these functions so embedPlayer won't try to sync time
		syncCurrentTime: function(){
			this.currentTime = this.getPlayerElementTime();
		},

		isInSequence: function(){return false;},
		_ondurationchange: function (event, data) {
			if ( this.playerElement && !isNaN(this.playerElement.duration) && isFinite(this.playerElement.duration) ) {
				this.setDuration(this.getPlayerElement().duration);
				return;
			}
		},

		setPlayerElement: function (mediaElement) {
			this.playerElement = mediaElement;
		},
		getPlayerElement: function () {
			return this.playerElement;
		},

		getPlayerElementTime: function(){
			return this.getPlayerElement().currentTime;
		},

		isVideoSiblingEnabled: function() {
			return false;
		}
	};
	} )( mediaWiki, jQuery );
