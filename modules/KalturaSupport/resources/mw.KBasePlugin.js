( function( mw, $ ) {"use strict";

// Class defined in resources/class/class.js
mw.KBasePlugin = Class.extend({
	asyncInit: false,
    localStorageDefaultOptions: {
      ttl: 10000
    },
	init: function( embedPlayer, callback, pluginName ){

		// Save to local scope
		this.embedPlayer = embedPlayer;
		this.initCompleteCallback = callback;
		this.pluginName = pluginName;

		this.bindPostFix = '.' + pluginName;

		this.setDefaults();
        this.setPersistent();

		var safeEnviornment = this.isSafeEnviornment();
		var _this = this;

		// Check if jQuery Deferrer
		if( typeof safeEnviornment == 'object' && safeEnviornment.promise ){
			safeEnviornment.done(function(isSafe){
				if( !isSafe ){
					_this.destroy();
				}
			});
		} else if( typeof safeEnviornment == 'boolean' && ! safeEnviornment ) {
			this.initCompleteCallback();
			return false;
		}

		// Add onConfigChange binding
		this.bindConfigChangeEvent();
		
		// Call plugin setup method
		this.setup();

		// Run initCompleteCallback
		if( this.asyncInit === false ) {
			this.initCompleteCallback();
		}

		return this;
	},
	setDefaults: function( obj ){
		obj = obj || this.defaultConfig;
		var _this = this;
		// Set default configuration for the plugin
		if( $.isPlainObject(obj) ) {
			$.each( obj, function( key, value ) {
				if( _this.getConfig( key ) === undefined ) {
					_this.setConfig( key, value, true );
				}
			});
		}
	},
    setPersistent: function(){
        if (this.getConfig('persistentConfigEnabled')) {
            var _this = this;
            var persistentPluginConfig = this.getPersistentConfig();
            // Set configuration from persistent storage for the plugin
            if ($.isPlainObject(persistentPluginConfig)) {
                $.each(persistentPluginConfig, function (key, value) {
                    _this.setConfig(key, value, true);
                });
            }
        }
    },
	isSafeEnviornment: function(){
		return true;
	},
	setup: function() {},
	getPlayer: function() {
		return this.embedPlayer;
	},
	getConfig: function( attr, raw ) {
		if( raw ){
			return this.embedPlayer.getRawKalturaConfig( this.pluginName, attr );
		}
		return this.embedPlayer.getKalturaConfig( this.pluginName, attr );
	},
	setConfig: function( attr, value, quiet ) {
		this.embedPlayer.setKalturaConfig( this.pluginName, attr, value, quiet );
	},
    getPersistentConfig: function( attr ) {
        var persistentConfig;
        if( typeof attr === "string" ) {
            var attrIsEntryLevel = this.getConfig('persistentConfig')[attr].entryLevel;
            persistentConfig = this.embedPlayer.getKalturaConfig( this.pluginName, attr, {isLocal: true, entryLevel: attrIsEntryLevel} );
        } else if( typeof attr === "undefined" ) {
            persistentConfig = {};
            $.extend(persistentConfig, this.embedPlayer.getKalturaConfig(this.pluginName, {}, {isLocal: true, entryLevel: true}));
            $.extend(persistentConfig, this.embedPlayer.getKalturaConfig(this.pluginName, {}, {isLocal: true, entryLevel: false}));
        }
        return persistentConfig;
    },
    setPersistentConfig: function( attr, value, quiet ) {
        var attrIsEntryLevel;
        if( typeof attr === "string" ) {
            attrIsEntryLevel = this.getConfig('persistentConfig')[attr].entryLevel;
            this.embedPlayer.setKalturaConfig( this.pluginName, attr, value, quiet, {isLocal: true, entryLevel: attrIsEntryLevel} );
        } else if( typeof attr === "object" || typeof attr === "undefined") {
            var _this = this;
            var entryLevelAttr = {};
            var uiConfLevelAttr = {};

            if (typeof attr === "undefined"){
                $.each(this.getConfig('persistentConfig'), function(key, val) {
                    if (val.entryLevel) {
                        entryLevelAttr[key] = _this.getConfig(key);
                    } else {
                        uiConfLevelAttr[key] = _this.getConfig(key);
                    }
                });
            } else {
                $.each(attr, function (key, val) {
                    //TODO: should we return or save as non-persistent anyway???
                    if (!_this.getConfig('persistentConfig')[key]){
                        return true;
                    }
                    if (_this.getConfig('persistentConfig')[key].entryLevel) {
                        entryLevelAttr[key] = val;
                    } else {
                        uiConfLevelAttr[key] = val;
                    }
                });
            }

            if (!$.isEmptyObject(entryLevelAttr)){
                this.embedPlayer.setKalturaConfig( this.pluginName, entryLevelAttr, value, quiet, {isLocal: true, entryLevel: true} );
            }
            if (!$.isEmptyObject(uiConfLevelAttr)) {
                this.embedPlayer.setKalturaConfig(this.pluginName, uiConfLevelAttr, value, quiet, {isLocal: true, entryLevel: false});
            }
        }
    },
	getTemplateHTML: function( data ){
		var _this = this;
		// Setup empty object
		data = data || {};
		// Add out plugin instance
		data.self = this;
		data.player = this.embedPlayer;

		// First get template from 'template' config
		var rawHTML = this.getConfig( 'template', true );
		if( !rawHTML ){
			var templatePath = this.getConfig( 'templatePath' );
			if( !templatePath || !window.kalturaIframePackageData.templates[ templatePath ]) {
				this.log('getTemplateHTML:: Template not found');
				return '';
			}
			rawHTML = window.kalturaIframePackageData.templates[ templatePath ];
		}
		var transformedHTML = mw.util.tmpl( rawHTML, data );
		var evaluatedHTML = $.trim( this.embedPlayer.evaluate( transformedHTML ) );
		var $templateHtml = $( '<span>' + evaluatedHTML + '</span>' );

		$templateHtml
			.find('[data-click],[data-notification]')
			.click(function(e){
				var data = $(this).data();
				return _this.handleClick( e, data );
			});

		return $templateHtml;
	},
	handleClick: function( e, data ){

		e.preventDefault();

		// Trigger local callback for data-click property
		if( data.click && $.isFunction(this[data.click]) ){
			this[data.click]( e, data );
		}

		if( data.notification ){
			this.getPlayer().sendNotification( data.notification, data );
		}

		return false;
	},
	bind: function( eventName, callback ){
		var bindEventsString = '',
			events = eventName.split(" "),
			totalEvents = events.length,
			i = 0,
			space = ' ';

		for( i; i<totalEvents; i++ ){
			if( i == (totalEvents-1) ){
				space = '';
			}
			bindEventsString += events[ i ] + this.bindPostFix + space;
		}
		return this.embedPlayer.bindHelper( bindEventsString, callback);
	},
	unbind: function( eventName ){
		eventName += this.bindPostFix;
		return this.embedPlayer.unbindHelper( eventName );
	},
	log: function( msg ){
		mw.log( this.pluginName + '::' + msg );
	},
	bindConfigChangeEvent: function(){
		var _this = this;
		if( typeof this.onConfigChange !== 'function' ){
			return ;
		}
		this.bind('Kaltura_ConfigChanged', function(event, pluginName, property, value){
			if( pluginName === _this.pluginName ){
				_this.onConfigChange( property, value );
			}
		});
	},
	getKalturaClient: function() {
		if( ! this.kClient ) {
			this.kClient = mw.kApiGetPartnerClient( this.embedPlayer.kwidgetid );
		}
		return this.kClient;
	},
	destroy: function(){
		this.unbind();
	}
});

} )( window.mw, window.jQuery );