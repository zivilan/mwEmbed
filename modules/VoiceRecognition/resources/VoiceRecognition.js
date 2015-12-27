( function( mw, $ ) {"use strict";


	mw.PluginManager.add( 'voiceRecognition', mw.KBaseComponent.extend({

		defaultConfig: {
			'parent': 'controlsContainer',
			'order': 7,
			'visible': true,
			'align': "right",
			'showTooltip': true,
			'tooltip': gM( 'mwe-VoiceRecognition-tooltip' )
		},

		setup: function( embedPlayer ) {
			alert("setup");
			this.addBindings();

		},

		addBindings: function() {

		},

		getComponent: function() {
			var _this = this;
			if( !this.$el ) {
				this.$el = $( '<button/>' )
					.attr( 'title', this.tooltip )
					.addClass( "btn icon-mic" + this.getCssClass() )
					.click( function() {
						alert("click");
					});
			}
			return this.$el;
		}
	}));
} )( window.mw, window.jQuery );