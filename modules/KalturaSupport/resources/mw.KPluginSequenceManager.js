( function( mw, $ ) {"use strict";

	mw.PluginManager.add( 'pluginSequenceManager', mw.KBasePlugin.extend({

		defaultConfig: {},

		setup: function(){
			this.bind('psm:runSequence', this.runSequence);
		},

		getOrderedSequencePlugins: function( sequenceType ) {
			var plugins = [];
			$.each(mw.PluginManager.registerdPlugins, function( pluginName, pluginClass ){
			    if( pluginClass.sequenceType == sequenceType ) {
			        plugins.push(pluginClass);
			    }
			});
			plugins.sort(function(a,b){
			    return (a.sequenceOrder > b.sequenceOrder) ? 1 : -1;
			});
			return plugins;
		},

		runSequence: function( e, sequenceType, doneCallback ) {
			var plugins = this.getOrderedSequencePlugins(sequenceType);
			var totalPlugins = plugins.length;

			// No plugins, continue
			if(!totalPlugins) {
				doneCallback();
				return ;
			}

			var index = 0;
			// Initiate first plugin
			plugins[index].init();
			this.bind('psm:next', function(e, nextSequenceType){
				if(sequenceType === nextSequenceType) {
					index++;
					if( index > totalPlugins ) {
						doneCallback();
						return;
					}
					plugins[index].init();
				}
			});
		}
		
	}));

} )( window.mw, window.jQuery );