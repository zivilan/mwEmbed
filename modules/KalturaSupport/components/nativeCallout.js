( function( mw, $ ) {"use strict";

	mw.PluginManager.add( 'nativeCallout', mw.KBasePlugin.extend({
		enableStatus: {
			"never": 1,
			"always": 2,
			"iPad": 3,
			"iPhone": 4,
			"iOS": 5,
			"AndroidPhone": 6,
			"AndroidDefaultBrowser": 7,
			"AndroidTables": 8
		},
		defaultConfig: {
			"storeUrl": "http://itunes.apple.com/app/id698657294",
			"mimeName": "kalturaPlayerToolkit://",
			"iframeUrl": null,
			"enableOn": "always"
		},
		setup: function(){
			// Bind player
			this.addBindings();

			if( !this.getConfig( "iframeUrl" ) ) {
				this.setConfig( "iframeUrl", this.embedPlayer.getIframeSourceUrl() );
			}
		},
		isSafeEnviornment: function(){
			return this.checkEnableStatus( this.getConfig("enableOn") );
		},
		addBindings: function() {
			var _this = this;
			this.bind('nativePlayCallout', function(event, nativeCalloutPlugin) {

				if( !nativeCalloutPlugin.exist ) {
					nativeCalloutPlugin.exist = true;
				}

				_this.calloutNativePlayer();
			});
		},

		checkEnableStatus: function( status ) {
			switch ( this.enableStatus[ this.getConfig( "enableOn" ) ] ) {
				case 1:
					return false;
					break;
				case 2:
					if( mw.isMobileDevice() ) {
						return true;
					}
					return false;
					break;
				case 3:
					if( mw.isIPad() ) {
						return true;
					}
					return false;
					break;
				case 4:
					if( mw.isIphone() ) {
						return true;
					}
					return false;
					break;
				case 5:
					if( mw.isIOS() ) {
						return true;
					}
					return false;
					break;
				case 6:
					if( mw.isAndroid() ) {
						return true;
					}
					return false;
					break;
				case 7:
					if( mw.isAndroidNativeBrowser() ) {
						return true;
					}
					return false;
					break;
				case 8:
					if( mw.isAndroid() ) {
						return true;
					}
					return false;
					break;
			}
		},

		// New "doPlay" implementation when nativeCallout plugin exist on mobile devices
		calloutNativePlayer: function() {

			var _this = this;
			var timeout;

			$('<iframe />')
				.attr('src', _this.getConfig( "mimeName" ) + "?iframeUrl=" + _this.getConfig( "iframeUrl" ))
				.attr('style', 'display:none;')
				.appendTo('body');

			timeout = setTimeout(function() {
				document.location = _this.getConfig( "storeUrl" );
			}, 500);
			window.addEventListener( 'pagehide', preventPopup );

			function preventPopup() {
				clearTimeout(timeout);
				timeout = null;
				window.removeEventListener( 'pagehide', preventPopup );
			}
		}
	}));

} )( window.mw, window.jQuery );