/**
* Adds temporal url handler plugin support
*/
( function( mw, $ ) { "use strict";
	mw.PluginManager.add( 'hashMediaTimeHandler', mw.KBasePlugin.extend({
		setup: function(){
			// check for parent hash / request where possible:
			if( mw.getConfig( 'EmbedPlayer.IsFriendlyIframe' ) ){
				try{
					this.hash = window['parent'].location.hash;
					if( !this.hash  ){
						return;
					}
					this.parseHash();
					if( this.startSeconds ){
						this.embedPlayer.startTime = this.startSeconds;
					}
					if( this.endSeconds ){
						this.embedPlayer.endTime = this.endSeconds;
					}
				} catch(e){
					// could not get hash
				}
			}
		},
		parseHash:function(){
			// check for t= format:
			var match = this.hash.match("\#?t=([^&]+)");
			if( match && match[1] ){
				this.startSeconds = this.parseSeconds( match[1] );
				return ;
			}
			// check for start end format: 
			var match = this.hash.match( "\#?(start=([^&]+))?&?end=([^&]+)" );
			if( match[2] ){
				this.startSeconds = this.parseSeconds( match[2] );
			}
			if( match[3] ){
				this.endSeconds = this.parseSeconds( match[3] );
			}
		},
		parseSeconds: function( secondsStr ){
			var match = secondsStr.match("([0-9]+h)?([0-9]+m)?([0-9]+s)?");
			var secondsInt = 0;
			if( match[0] == "" ){
				return parseFloat(secondsStr);
			}
			// hours
			if( match[1] ){
				secondsInt+= parseInt( match[1] ) * 60 * 60;
			}
			// min
			if( match[2] ){
				secondsInt+= parseInt( match[2] ) * 60;
			}
			// sec
			if( match[1] ){
				secondsInt+= parseFloat( match[1] ) * 60 * 60;
			}
			return secondsInt;
		}
		
	}));
	
})( window.mw, window.jQuery );