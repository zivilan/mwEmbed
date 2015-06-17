(function ( mw, $ ) {
	"use strict";
	mw.dualScreen = mw.dualScreen || {};

	mw.dualScreen.videoPlayer = mw.KBaseComponent.extend({
		defaultConfig: {
			cuePointType: [{
				"main": mw.KCuePoints.TYPE.THUMB,
				"sub": [mw.KCuePoints.THUMB_SUB_TYPE.SLIDE]
			}],
			prefetch: {
				'durationPercentageUntilNextSequence': 60,
				'minimumSequenceDuration': 2
			}
		},
		cuePoints: [],
		syncEnabled: true,
		setup: function(){
			this.addBinding();
		},
		isSafeEnviornment: function () {
			var cuePoints = this.getCuePoints();
			var cuePointsExist = (cuePoints.length > 0);
			return (!this.getPlayer().useNativePlayerControls() &&
			(
			( this.getPlayer().isLive() && this.getPlayer().isDvrSupported() && mw.getConfig("EmbedPlayer.LiveCuepoints") ) ||
			( !this.getPlayer().isLive() && cuePointsExist )
			)
			);
		},
		addBinding: function(){
			var _this = this;
			this.bind( 'onplay', function () {
				_this.loadAdditionalAssets();
			} );
			//In live mode wait for first updatetime that is bigger then 0 for syncing initial slide
			if (mw.getConfig("EmbedPlayer.LiveCuepoints") && this.getPlayer().isLive()) {
				this.bind( 'timeupdate', function ( ) {
					if (!_this.getPlayer().isMulticast &&
						!_this.getPlayer().isDVR() &&
						_this.getPlayer().currentTime > 0) {
						_this.unbind('timeupdate');
					}
					var cuePoint = _this.getCurrentCuePoint();
					_this.sync( cuePoint );
				} );
			}

			this.bind( 'KalturaSupport_ThumbCuePointsReady', function () {
				var currentCuepoint = _this.getCurrentCuePoint() || _this.getCuePoints()[0];
				_this.sync(currentCuepoint);
			} );
			this.bind( 'KalturaSupport_CuePointReached', function ( e, cuePointObj ) {
				var cuePoint;
				$.each(_this.getConfig("cuePointType"), function(i, cuePointType){
					var main = $.isArray(cuePointType.main) ? cuePointType.main : [cuePointType.main];
					var sub = $.isArray(cuePointType.sub) ? cuePointType.sub : [cuePointType.sub];
					if ( ( $.inArray( cuePointObj.cuePoint.cuePointType, main ) > -1 ) &&
						( $.inArray( cuePointObj.cuePoint.subType, sub ) > -1 ) ) {
						cuePoint = cuePointObj.cuePoint;
						return false;
					}
				});
				if (!cuePoint){
					cuePoint = _this.getCurrentCuePoint();
				}
				_this.sync( cuePoint );
			} );
			this.bind("onChangeMedia", function(){
				//Clear the current slide before loading the new media
				_this.getComponent().attr("src", "");
			});
			this.bind("onChangeStream", function(){
				_this.syncEnabled = false;
			});
			this.bind("onChangeStreamDone", function(){
				_this.syncEnabled = true;
				var cuePoint = _this.getCurrentCuePoint();
				_this.sync( cuePoint );
			});
		},
		getComponent: function() {
			if (!this.$el) {
				this.$el =
					$( '<video>' )
						.attr( 'id', 'SynchVideo' )
						.addClass( "videoPlayer" )
						.attr("controls", "");
				var aa = this.$el.get(0 );
				aa.src = "http://cfvod.kaltura.com/pd/p/1726172/sp/172617200/serveFlavor/entryId/0_0eovatek/v/2/flavorId/0_9d8bam83/name/a.mp4";
				aa.mediaGroup = "test";

				var a = this.getPlayer().getPlayerElement();
				a.mediaGroup = "test";
			}
			return this.$el;
		},
		applyIntrinsicAspect: function(){
			// Check if a image thumbnail is present:
			var $img = this.getComponent();
			var imgContainer = this.getComponent().parent();
			//Make sure both image player and display are initialized
			if( $img.length && imgContainer.length/*&& this.displayInitialized*/){
				var pHeight = imgContainer.height();
				// Check for intrinsic width and maintain aspect ratio
				var pWidth = parseInt( $img.naturalWidth() / $img.naturalHeight() * pHeight, 10);
				var pClass = 'fill-height';
				if( pWidth > imgContainer.width() ){
					pClass = 'fill-width';
				}
				$img.removeClass('fill-width fill-height').addClass(pClass);
			}
		},
		getCuePoints: function(){
			var cuePoints = [];
			var _this = this;
			if ( this.getPlayer().kCuePoints ) {
				$.each( _this.getConfig("cuePointType"), function ( i, cuePointType ) {
					$.each( cuePointType.sub, function ( j, cuePointSubType ) {
						var filteredCuePoints = _this.getPlayer().kCuePoints.getCuePointsByType( cuePointType.main, cuePointSubType );
						cuePoints = cuePoints.concat( filteredCuePoints );
					} );
				} );
			}
			cuePoints.sort(function (a, b) {
				return a.startTime - b.startTime;
			});
			return cuePoints;
		},
		sync: function(cuePoint, callback){

		},
		//Prefetch
		loadAdditionalAssets: function () {

		},
		cancelPrefetch: function () {
			if ( typeof( this.prefetchTimeoutId ) === 'number' ) {
				mw.log( 'Dual screen:: Cancel pending prefetch(' + this.prefetchTimeoutId + ')' );
				window.clearTimeout( this.prefetchTimeoutId );
				this.prefetchTimeoutId = null;
			}
		},
		loadNext: function (nextCuePoint, callback) {

		},
		loadImage: function(src, cuePoint, callback){

		},
		isValidResult: function( data ){
			// Check if we got error
			if( !data
				||
				( data.code && data.message )
			){
				//this.log('Error getting related items: ' + data.message);
				//this.getBtn().hide();
				this.error = true;
				return false;
			}
			this.error = false;
			return true;
		},
		getNextCuePoint: function ( time ) {
			var cuePoints = this.getCuePoints();
			// Start looking for the cue point via time, return first match:
			for ( var i = 0; i < cuePoints.length; i++ ) {
				if ( cuePoints[i].startTime >= time ) {
					return cuePoints[i];
				}
			}
			// No cue point found in range return false:
			return false;
		},
		getCurrentCuePoint: function ( ) {
			var currentTime = this.getPlayer().currentTime *1000;
			var cuePoints = this.getCuePoints();
			var cuePoint;
			// Start looking for the cue point via time, return first match:
			for ( var i = 0; i < cuePoints.length; i++ ) {
				var startTime = cuePoints[i].startTime;
				//Retrieve end time from cuePoint metadata, unless it's less one and then use clip duration.
				//If clip duration doesn't exist or it's 0 then use current time(in multicast live duration is
				//always 0)
				var endTime = cuePoints[i + 1] ? cuePoints[i + 1].startTime :
					(this.getPlayer().getDuration() * 1000) ?
						(this.getPlayer().getDuration() * 1000) : (currentTime + 1);
				if ( startTime <= currentTime && currentTime < endTime ) {
					cuePoint = cuePoints[i];
					break;
				}
			}
			return cuePoint;
		}
	} );
}

)( window.mw, window.jQuery );