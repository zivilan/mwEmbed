( function( mw, $ ) {"use strict";

	mw.PluginManager.add( 'localMedia', mw.KBaseScreen.extend({

		defaultConfig: {
			align: "right",
			parent: "controlsContainer",
			displayImportance: "low",
			showTooltip: true,
			templatePath: '../LocalMedia/resources/LocalMedia.tmpl.html',
			tooltip: "mange local media", // todo why is this not working: gM('lm-mange-title'),
		 	order: 50,
		 	requestedStorageSize: 1024*1024*1024  /* 1GB by default, if over available space should return all that is available */, 
		},
		iconBtnClass: "icon-download",
		setup:function(){
			// override XHR requests:
			var proxied = window.XMLHttpRequest.prototype.open;
			window.XMLHttpRequest.prototype.open = function() {
				console.log( arguments );
				return proxied.apply(this, [].slice.call(arguments));
			};
		},
		showUnsupported:function(){
			$('.browser-unsupported').show();
		},
		showScreen: function(){
			var _this = this;
			this._super(); // this is an override of showScreen in mw.KBaseScreen.js - call super
			// check if browser has file API
			if( !window.webkitRequestFileSystem ){
				_this.showUnsupported();
				return ;
			}
			window.webkitRequestFileSystem(window.PERSISTENT, 
					this.getConfig('requestedStorageSize'),
					function(){
						_this.showStatus();
					}, 
					function(){
						_this.showUnsupported();
					}
			);
			
		},
		showStatus: function(){
			var _this = this;
			$('.status').show();
			// get high level state: none, downloading, ready 
			switch( this.getState() ){
				case 'none':
					this.showStartDownload();
					break;
				case 'downloading':
					break;
				case 'ready':
					break;
			}
		},
		updateState: function(){
			$('.localMedia .state').empty().append( arguments );
		},
		showStartDownload: function(){
			this.updateState(
				$('<h5>').text("media can be downloaded"),
				$('<button>').val('download').click(function(){
					_this.startDownload();
					//_this.showStatus();
				})
			)
		},
		startDownload: function(){
			// download the manifest
			// put all segments into local-storage cache
			// 
		}
	}));

} )( window.mw, window.jQuery );
