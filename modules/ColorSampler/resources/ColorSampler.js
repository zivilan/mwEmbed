( function( mw, $ ) {"use strict";


	mw.PluginManager.add( 'colorSampler', mw.KBaseComponent.extend({

		defaultConfig: {
			'parent': 'controlsContainer',
			'order': 57,
			'visible': true,
			'align': "right",
			'showTooltip': true,
			'tooltip': gM( 'mwe-ColorSampler-tooltip' ),
			'sampleInterval': 500,
			'position': 'bottom'
		},
		colorThief: null,
		intervalID: null,
		vid: null,
		active: false,
		$colorSamples: null,

		setup: function( embedPlayer ) {
			this.colorThief = new ColorThief();
			this.addBindings();
		},

		addBindings: function() {
			var _this = this;
			$( this.embedPlayer).bind('onplay', function(){
				if (!_this.intervalID && _this.active){
					_this.startSample();
				}
			});

			$( this.embedPlayer).bind('onpause', function(){
				_this.stopSample();
			});

			$( this.embedPlayer).bind('playerReady', function(){
				_this.vid = _this.embedPlayer.getPlayerElement();
				$(_this.vid).attr("crossorigin", "anonymous");
			});
		},

		onConfigChange: function( property, value ){
			if (property === "position"){
				this.$colorSamples.removeClass("bottom right").addClass(value);
			}
		},

		startSample: function(){
			var _this = this;
			this.doSample();
			this.intervalID = setInterval(function(){
				_this.doSample();
			},this.getConfig("sampleInterval"));
		},

		stopSample: function(){
			if (this.intervalID){
				clearInterval(this.intervalID);
				this.intervalID = null;
			}
		},

		doSample: function(){
			var frameColors = this.colorThief.getPalette(this.vid,3);
			if (frameColors){
				var color1 = frameColors[0];
				var color2 = frameColors[1];
				var color3 = frameColors[2];
				var hex1 = mw.util.rgbToHex(color1[0],color1[1],color1[2]);
				var hex2 = mw.util.rgbToHex(color2[0],color2[1],color2[2]);
				var hex3 = mw.util.rgbToHex(color3[0],color3[1],color3[2]);
				this.$colorSamples.find(".color1").html("<span>"+ntc.name(hex1)[1]+" </span>").css("background-color","rgb("+color1+")");
				this.$colorSamples.find(".color2").html("<span>"+ntc.name(hex2)[1]+" </span>").css("background-color","rgb("+color2+")");
				this.$colorSamples.find(".color3").html("<span>"+ntc.name(hex3)[1]+" </span>").css("background-color","rgb("+color3+")");
			}
		},

		drawUI: function(){
			this.$colorSamples = $("<div class='colorSamples'/>")
				.addClass(this.getConfig("position"))
				.append("<div class='colorSample color1'/>")
				.append("<div class='colorSample color2'/>")
				.append("<div class='colorSample color3'/>");
			if (this.active){
				colorSamples.addClass("active");
			}
			this.embedPlayer.getVideoHolder().append(this.$colorSamples);
		},

		getComponent: function() {
			var _this = this;
			if( !this.$el ) {
				this.$el = $( '<button/>' )
					.attr( 'title', gM( 'mwe-ColorSampler-tooltip' ) )
					.addClass( "btn icon-eyedropper" + this.getCssClass() )
					.click( function() {
						_this.active = !_this.active;
						var iconColor = _this.active ? "LawnGreen" : "white";
						_this.embedPlayer.getInterface().find(".icon-eyedropper").css("color", iconColor);
						if (_this.active){
							_this.$colorSamples.addClass("active");
							_this.startSample();
						}else{
							_this.$colorSamples.removeClass("active");
							_this.stopSample();
						}
					});
				_this.drawUI();
			}
			return this.$el;
		}
	}));
} )( window.mw, window.jQuery );