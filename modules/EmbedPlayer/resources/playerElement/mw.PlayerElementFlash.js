( function( mw, $ ) {"use strict";

// Class defined in resources/class/class.js
	mw.PlayerElementFlash = mw.PlayerElement.extend({
		jsReadyFunName: 'elementJsReadyFunc',
		playerElement: null,
		currentTime: 0,
		duration: 0,
		paused: true,
		muted: false,
		volume: 1,
		id: null,
		readyState: 0,
		disabled: false,
		//counter for listneres function names, in case we want to subscribe more than one func to the same kdp notification
		listenerCounter: 0,
		targetObj: null,
		/**
		 * initialize the class, creates flash embed
		 * @param containerId container for the flash embed
		 * @param playerId id of the object to create
		 * @param elementFlashvars additional flashvars to pass to the flash object
		 * @param target target class to run subscribed functions on
		 * @param readyCallback to run when player is ready
		 * @returns {*}
		 */
		init: function( containerId , playerId , elementFlashvars, target, readyCallback ){
			var _this = this;
			this.element = this;			
			this.id = playerId;
			this.targetObj = target;

			var flashvars = {};
			flashvars.jsCallBackReadyFunc = this.jsReadyFunName;
			flashvars.externalInterfaceDisabled = "false";
			flashvars.disableOnScreenClick = true;

			//if debug mode
			if( mw.getConfig( 'debug', true ) ){
				flashvars.debugMode = 'true';
			}

			if ( elementFlashvars ) {
				$.extend ( flashvars, elementFlashvars );
			}

			var kdpPath = mw.getMwEmbedPath() + 'modules/EmbedPlayer/binPlayers/kaltura-player/kdp3.swf';
			//var kdpPath = "http://localhost/lightKdp/KDP3/bin-debug/kdp3.swf";

			window[this.jsReadyFunName] = function( playerId ){
				// We wrap everything in setTimeout to avoid Firefox race condition with empty cache
				setTimeout(function(){
					_this.playerElement = $('#' + playerId )[0];

					//if this is the target object: add event listeners
					//if a different object is the target: it should take care of its listeners (such as embedPlayerKPlayer)
					if ( !_this.targetObj ) {
						_this.targetObj = _this;

						var bindEventMap = {
							'playerPaused' : 'onPause',
							'playerPlayed' : 'onPlay',
							'durationChange' : 'onDurationChange',
							'playerPlayEnd' : 'onClipDone',
							'playerUpdatePlayhead' : 'onUpdatePlayhead',
							'playerSeekEnd': 'onPlayerSeekEnd',
							'alert': 'onAlert',
							'mute': 'onMute',
							'unmute': 'onUnMute',
							'volumeChanged': 'onVolumeChanged'
						};

						$.each( bindEventMap, function( bindName, localMethod ) {
							_this.bindPlayerFunction(bindName, localMethod);
						});
					}

					//imitate html5 video readyState
					_this.readyState = 4;
					// Run ready callback
					if( $.isFunction( readyCallback ) ){
						readyCallback.apply( _this );
					}

					//notify player is ready
					$( _this ).trigger('playerJsReady');
				},0);
			};

			kWidget.outputFlashObject(
				containerId,
				{
					id :				playerId,
					src : 				kdpPath,
					version :			[10,0],
					'targetId': 		containerId,
					flashvars: 			flashvars,
					params:				{ wmode: 'transparent'},
					objectParams:		{ id: playerId, name:playerId, width: '100%', height: '100%', title:"video content" ,role:"video content" },
					addAsChild: 		true,
					useOriginalId:		true
				},
				window.document
			);

			return this;
		},
		play: function(){
			this.sendNotification( 'doPlay' );
		},
		pause: function(){
			this.sendNotification( 'doPause' );
		},
		seek: function( val ){
			this.sendNotification( 'doSeek', val );
			$( this ).trigger( 'seeking' );
		},
		load: function(){
			this.sendNotification('changeMedia', {'entryUrl': this.src}) ;
		},
		changeVolume: function( volume ){
			this.sendNotification( 'changeVolume', volume );
		},
        sendNotification: function ( noteName, value ) {
            if ( this.disabled ){
                return false;
            }
            if ( this.playerElement ) {
                this.playerElement.sendNotification( noteName, value ) ;
            }else{
                $( this ).bind('playerJsReady', function(){
                    if ( !this.disabled ){
                        this.playerElement.sendNotification( noteName, value );
                    }
                });
            }
        },
		setKDPAttribute: function( obj, property, value ) {
			if ( this.playerElement && !this.disabled ) {
				this.playerElement.setKDPAttribute( obj, property, value );
			}
		},
		addJsListener: function( eventName, methodName ) {
			if ( this.playerElement ) {
				this.bindPlayerFunction( eventName, methodName );
			}
		},
		getCurrentTime: function() {
			if ( this.playerElement ) {
				return this.playerElement.getCurrentTime();
			}
			return null;
		},
		/**
		 * add js listener for the given callback. Creates generic methodName and adds it to this playerElement
		 * @param callback to call
		 * @param eventName notification name to listen for
		 */
		subscribe: function ( callback, eventName ) {
			if ( this.playerElement ) {
				var methodName = eventName + this.listenerCounter;
				this.listenerCounter++;
				this.targetObj[methodName] = callback;

				this.bindPlayerFunction( eventName, methodName );
			}

		},
		/**
		 * Bind a Player Function,
		 *
		 * Build a global callback to bind to "this" player instance:
		 *
		 * @param {String}
		 *			flash binding name
		 * @param {String}
		 *			function callback name
		 *
		 *@param {object}
		 * 		target object to call the listening func from
		 */
		bindPlayerFunction : function(bindName, methodName, target) {
			var _this = this;
			mw.log( 'PlayerElementFlash:: bindPlayerFunction:' + bindName );
			// The kaltura kdp can only call a global function by given name
			var gKdpCallbackName = 'kdp_' + methodName + '_cb_' + this.id.replace(/[^a-zA-Z 0-9]+/g,'');

			// Create an anonymous function with local player scope
			var createGlobalCB = function(cName) {
				window[ cName ] = function(data) {
					// Track all events ( except for playerUpdatePlayhead and bytesDownloadedChange )
					if( bindName != 'playerUpdatePlayhead' && bindName != 'bytesDownloadedChange' ){
						mw.log("PlayerElementFlash:: event: " + bindName);
					}
					_this.targetObj[methodName](data);
				};
			}(gKdpCallbackName, this);
			// Remove the listener ( if it exists already )
			this.playerElement.removeJsListener( bindName, gKdpCallbackName );
			// Add the listener to the KDP flash player:
			this.playerElement.addJsListener( bindName, gKdpCallbackName);
		},
		onUpdatePlayhead : function ( playheadVal ) {
			this.currentTime = playheadVal;
		},
		onPause : function() {
			this.paused = true;
			//TODO trigger event?
		},
		onPlay : function() {
			this.paused = false;
			$( this ).trigger( 'playing' );
		},
		onDurationChange : function( data, id ) {
			this.duration = data.newValue;
			$( this ).trigger( 'loadedmetadata' );
		},
		onClipDone : function() {
			$( this ).trigger( 'ended' );
		},
		onPlayerSeekEnd: function() {
			$( this ).trigger( 'seeked' );
		},
		onAlert : function ( data, id ) {
			//TODO?
		},
		onMute: function () {
			this.muted = true;
		},
		onUnMute: function () {
			this.muted = false;
		},
		onVolumeChanged: function ( data ) {
			this.volume = data.newVolume;
			$( this).trigger( 'volumechange' );
		}
	});

} )( window.mw, jQuery );