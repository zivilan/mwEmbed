/**
 * Created by itayk on 8/4/14.
 */
( function( mw, $ ) {
	"use strict";

	mw.PluginManager.add( 'kAnalony' , mw.KBasePlugin.extend( {
		PlayerEvent:{
			"IMPRESSION": 1,
			"PLAY_REQUEST": 2,
			"PLAY": 3,
			"RESUME": 4,
			"PLAY_25PERCENT": 11,
			"PLAY_50PERCENT": 12,
			"PLAY_75PERCENT": 13,
			"PLAY_100PERCENT": 14,
			"SHARE_CLICKED": 21,
			"SHARE_NETWORK": 22,
			"DOWNLOAD": 23,
			"REPORT_CLICKED": 24,
			"REPORT_SUBMITED": 25,
			"ENTER_FULLSCREEN": 31,
			"EXIT_FULLSCREEN": 32,
			"PAUSE": 33,
			"REPLAY": 34,
			"SEEK": 35,
			"RELATED_CLICKED": 36,
			"RELATED_SELECTED": 37,
			"CAPTIONS": 38,
			"SOURCE_SELECTED": 39,
			"INFO": 40,
			"SPEED": 41,
			"VIEW": 99
		},
		startTime: null,
		reportingInterval : 10000,
		bufferTime : 0,
		eventIndex : 1,
		currentBitRate: -1,
		currentFlavourId: -1,
		eventType: 1,
		firstPlay: true,
		viewEventInterval: null,
		savedPosition: null,
		monitorIntervalObj:{},

		_p25Once: false,
		_p50Once: false,
		_p75Once: false,
		_p100Once: false,
		hasSeeked: false,
		dvr: false,

		smartSetInterval:function(callback,time,monitorObj) {
			var _this = this;
			//create the timer speed, a counter and a starting timestamp
			var speed = time,
				counter = 1,
				start = new Date().getTime();

			//timer instance function
			var instance = function ()
			{
				if (monitorObj.cancel ){
					return;
				}
				callback();
				//work out the real and ideal elapsed time
				var real = (counter * speed),
					ideal = (new Date().getTime() - start);

				//increment the counter
				counter++;

				//calculate and display the difference
				var diff = (ideal - real);
				monitorObj.counter = counter;
				monitorObj.diff = diff;

				var nextSpeed = speed - diff;
				if (Math.abs(nextSpeed) > speed){
					nextSpeed = speed;
				}
				_this.viewEventInterval = window.setTimeout(function() { instance(); }, nextSpeed);
			};

			//now kick everything off with the first timer instance
			_this.viewEventInterval = window.setTimeout(function() { instance(); }, speed);
		},

		setup: function( ) {
			this.eventIndex = 1;
			this.bufferTime = 0;
			this.currentBitRate = -1;
			this.addBindings();
	    },

		addBindings : function() {
			var _this = this;
			var playerEvent = this.PlayerEvent;
			this.embedPlayer.bindHelper( 'playerReady' , function () {
				_this.resetPlayerflags();
		        if ( _this.kalturaContextData && _this.kalturaContextData.flavorAssets && _this.kalturaContextData.flavorAssets.length === 1 ){
			        _this.currentBitRate = _this.kalturaContextData.flavorAssets[0].bitrate;
		        }
				_this.sendAnalytics(playerEvent.IMPRESSION);
			});

			this.embedPlayer.bindHelper( 'onChangeMedia' , function () {
				_this.firstPlay = true;
			});

			this.embedPlayer.bindHelper( 'userInitiatedPlay' , function () {
				_this.sendAnalytics(playerEvent.PLAY_REQUEST);
			});

			this.embedPlayer.bindHelper( 'onplay' , function () {
				if ( !this.isInSequence() ){
					if ( _this.firstPlay ){
						_this.sendAnalytics(playerEvent.PLAY);
					}else{
						_this.sendAnalytics(playerEvent.RESUME);
					}
				}
			});
			this.embedPlayer.bindHelper( 'userInitiatedPause' , function () {
				_this.sendAnalytics(playerEvent.PAUSE);
			});

			this.embedPlayer.bindHelper( 'monitorEvent' , function () {
				_this.updateTimeStats();
			});

			this.embedPlayer.bindHelper( 'seeked' , function (e, seekTarget) {
				_this.hasSeeked = true;
				if ( _this.embedPlayer.isDVR() ) {
					_this.dvr = true;
				}
			});

			this.embedPlayer.bindHelper( 'movingBackToLive', function() {
				_this.dvr = false;
			} );

			this.embedPlayer.bindHelper( 'seeking onpause', function() {
				if ( _this.embedPlayer.isDVR() ) {
					_this.dvr = true;
				}
			});

			this.embedPlayer.bindHelper( 'userInitiatedSeek' , function (e, seekTarget) {
				_this.sendAnalytics(playerEvent.SEEK, { "targetPosition": seekTarget } );
			});

			this.embedPlayer.bindHelper( 'showShareEvent' , function () {
				_this.sendAnalytics(playerEvent.SHARE_CLICKED);
			});

			this.embedPlayer.bindHelper( 'socialShareEvent' , function (e, socialNetwork) {
				_this.sendAnalytics(playerEvent.SHARE_NETWORK, {"socialNetwork": socialNetwork.name } );
			});

			this.embedPlayer.bindHelper( 'downloadMedia' , function () {
				_this.sendAnalytics(playerEvent.DOWNLOAD);
			});

			this.embedPlayer.bindHelper( 'onOpenFullScreen' , function () {
				_this.sendAnalytics(playerEvent.ENTER_FULLSCREEN);
			});

			this.embedPlayer.bindHelper( 'onCloseFullScreen' , function () {
				_this.sendAnalytics(playerEvent.EXIT_FULLSCREEN);
			});

			this.embedPlayer.bindHelper( 'onEndedDone' , function () {
				_this.stopViewTracking();
			});

			this.embedPlayer.bindHelper( 'replayEvent' , function () {
				_this.resetPlayerflags();
				_this.sendAnalytics(playerEvent.REPLAY);
			});

			this.embedPlayer.bindHelper( 'moderationOpen' , function () {
				_this.sendAnalytics(playerEvent.REPORT_CLICKED);
			});

			this.embedPlayer.bindHelper( 'moderationSubmit' , function (e, reportType) {
				_this.sendAnalytics(playerEvent.REPORT_SUBMITED, { "reportType": reportType});
			});

			this.embedPlayer.bindHelper( 'relatedOpen' , function () {
				_this.sendAnalytics(playerEvent.RELATED_CLICKED);
			});

			this.embedPlayer.bindHelper( 'relatedVideoSelect' , function (e, data) {
				if (!data.autoSelected){
					_this.sendAnalytics(playerEvent.RELATED_SELECTED, { "relatedEntryId": data.entryId});
				}
			});

			this.embedPlayer.bindHelper( 'selectClosedCaptions' , function (e, language) {
				_this.sendAnalytics(playerEvent.CAPTIONS, { "caption": language});
			});

			this.embedPlayer.bindHelper( 'newSourceSelected' , function (e, flavourId) {
				_this.sendAnalytics(playerEvent.SOURCE_SELECTED, { "flavourId": flavourId});
			});

			this.embedPlayer.bindHelper( 'infoScreenOpen' , function () {
				_this.sendAnalytics(playerEvent.INFO);
			});

			this.embedPlayer.bindHelper( 'updatedPlaybackRate' , function (e, speed) {
				_this.sendAnalytics(playerEvent.SPEED, {"playbackSpeed": speed});
			});

			this.embedPlayer.bindHelper('bufferStartEvent', function(){
				_this.bufferStartTime = new Date();
			});

			this.embedPlayer.bindHelper('bufferEndEvent', function(){
				_this.calculateBuffer();
				_this.bufferStartTime = null;
			});

			this.embedPlayer.bindHelper( 'bitrateChange' ,function( event, newBitrate){
				_this.currentBitRate = newBitrate;
			} );

			this.embedPlayer.bindHelper('onPlayerStateChange', function(e, newState, oldState) {
				if (newState === "pause" ){
					_this.stopViewTracking();
				}
				if (newState === "play"){
					if ( oldState === "start" || oldState === "pause" ){
						_this.startViewTracking();
					}
				}
			});

			// events for capturing the bitrate of the currently playing source
			this.embedPlayer.bindHelper( 'SourceSelected' , function (e, source) {
				if (source.getBitrate()){
					_this.currentBitRate = source.getBitrate();
				}
				if (source.getAssetId()){
					_this.currentFlavourId = source.getAssetId();
				}
			});

			this.embedPlayer.bindHelper( 'sourceSwitchingEnd' , function (e, newSource) {
				if (newSource.newBitrate){
					_this.currentBitRate = newSource.newBitrate;
				}
			});

			this.embedPlayer.bindHelper( 'AdSupport_midroll AdSupport_postroll' , function () {
				_this.savedPosition = _this.embedPlayer.currentTime; // during ad playback (mid and post only), report position as the last player position
			});

			this.embedPlayer.bindHelper( 'AdSupport_EndAdPlayback' , function () {
				setTimeout(function(){
					_this.savedPosition = null; // use timeout to use the savedPosition for events reported immediately after ad finish (play event)
				},0);

			});
		},
		resetPlayerflags:function(){
			this._p25Once = false;
			this._p50Once = false;
			this._p75Once = false;
			this._p100Once = false;
			this.hasSeeked = false;
			this.savedPosition = null;
		},

		updateTimeStats: function() {
			var _this = this;
			var percent = this.embedPlayer.currentTime / this.embedPlayer.duration;
			var playerEvent = this.PlayerEvent;

			// Send updates based on logic present in StatisticsMediator.as
			if ( !this.embedPlayer.isLive() ){
				if( !_this._p25Once && percent >= .25 ) {
					_this._p25Once = true;
					_this.sendAnalytics(playerEvent.PLAY_25PERCENT);
				} else if ( !_this._p50Once && percent >= .50 ) {
					_this._p50Once = true;
					_this.sendAnalytics(playerEvent.PLAY_50PERCENT);
				} else if( !_this._p75Once && percent >= .75 ) {
					_this._p75Once = true;
					_this.sendAnalytics(playerEvent.PLAY_75PERCENT);
				} else if(  !_this._p100Once && percent >= .99) {
					_this._p100Once = true;
					_this.sendAnalytics(playerEvent.PLAY_100PERCENT);
				}
			}
		},

		calculateBuffer : function ( closeSession ){
			var _this = this;
			//if we want to calculate the buffer till now - first check we have started buffer
			if (closeSession &&  !_this.bufferStartTime){
					return;
			}

			//calc the buffer time
			this.bufferTime += (new Date() - _this.bufferStartTime) / 1000;
			if (this.bufferTime > 10){
				this.bufferTime = 10;
			}
			//set the buffer start time to now - in order to continue and counting the current buffer session
			if ( closeSession ){
				_this.bufferStartTime = new Date();
			}
		},

		stopViewTracking :function(){
			var _this = this;
			_this.monitorIntervalObj.cancel = true;
			clearTimeout( _this.viewEventInterval );
			_this.viewEventInterval = null;
		},
		startViewTracking :function(){
			var _this = this;
			var playerEvent = this.PlayerEvent;
			_this.startTime = null;
			_this.kClient = mw.kApiGetPartnerClient( _this.embedPlayer.kwidgetid );
			_this.monitorIntervalObj.cancel = false;
			if ( _this.firstPlay ){
				_this.sendAnalytics(playerEvent.VIEW);
				_this.firstPlay = false;
			}
			_this.smartSetInterval(function(){
				if ( !_this._p100Once ){ // since we report 100% at 99%, we don't want any "VIEW" reports after that (FEC-5269)
					_this.sendAnalytics(playerEvent.VIEW);
					_this.bufferTime = 0;
				}
			},_this.reportingInterval,_this.monitorIntervalObj);

		},
		sendAnalytics : function(eventType, additionalData){
			var _this = this;
			this.calculateBuffer(true);
			this.kClient = mw.kApiGetPartnerClient( this.embedPlayer.kwidgetid );
			if ( this.embedPlayer.isMulticast && $.isFunction( this.embedPlayer.getMulticastBitrate ) ) {
				this.currentBitRate = this.embedPlayer.getMulticastBitrate();
			}

			// set playbackType
			var playbackType = "vod";
			if (this.embedPlayer.isLive()){
				playbackType = this.dvr ? "dvr" : "live";
			}

			var position = this.embedPlayer.currentTime ? this.embedPlayer.currentTime : 0;
			if ( this.savedPosition ){
				position = this.savedPosition;
			}

			var statsEvent = {
				'entryId'           : this.embedPlayer.kentryid,
				'partnerId'         : this.embedPlayer.kpartnerid,
				'eventType'         : eventType,
				'sessionId'         : this.embedPlayer.evaluate('{configProxy.sessionId}'),
				'eventIndex'        : this.eventIndex,
				'bufferTime'        : this.bufferTime,
				'actualBitrate'     : this.currentBitRate,
				'flavourId'         : this.currentFlavourId,
				'referrer'          : encodeURIComponent( mw.getConfig('EmbedPlayer.IframeParentUrl') ),
				'deliveryType'      : this.embedPlayer.streamerType,
				'sessionStartTime'  : this.startTime,
				'uiConfId'          : this.embedPlayer.kuiconfid,
				'clientVer'         : mw.getConfig("version"),
				'position'          : position,
				'playbackType'      : playbackType
			};

			// add ks if available
			var ks = this.kClient.getKs();
			if (ks){
				statsEvent["ks"] = ks;
			}

			// add preferred bitrate if defined by the user
			if ( this.embedPlayer.getRawKalturaConfig('mediaProxy') && this.embedPlayer.getRawKalturaConfig('mediaProxy').preferedFlavorBR ){
				statsEvent["expectedQuality"] = this.embedPlayer.getRawKalturaConfig('mediaProxy').preferedFlavorBR;
			}

			// add specific events data
			if (additionalData){
				$.extend(statsEvent, additionalData);
			}

			// add custom vars
			var config = this.getConfig();
			for (var key in config){
				if (key.indexOf("customVar") !== -1){
					var customVarObj = {};
					customVarObj[key] = config[key];
					$.extend(statsEvent, customVarObj);
				}
			}

			// add playbackContext
			if (mw.getConfig("playbackContext")){
				statsEvent["playbackContext"] = mw.getConfig("playbackContext");
			}

			var eventRequest = {'service' : 'analytics', 'action' : 'trackEvent'};
			$.each(statsEvent , function (event , value) {
				eventRequest[event] = value;
			});
			this.eventIndex += 1;
			this.embedPlayer.triggerHelper( 'analyticsEvent' , statsEvent);
			this.log("Trigger analyticsEvent type = "+statsEvent.eventType);
			this.kClient.doRequest( eventRequest, function(data){
				try {
					if (!_this.startTime ) {
						_this.startTime = data;
					}
				}catch(e){
					mw.log("Failed sync time from server");
				}
			}, true );
		}
	}));
} )( window.mw, window.jQuery );