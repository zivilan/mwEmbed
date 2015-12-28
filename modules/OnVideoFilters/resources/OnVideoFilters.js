( function( mw, $ ) {"use strict";


	mw.PluginManager.add( 'onVideoFilters', mw.KBaseComponent.extend({

		defaultConfig: {
			'parent': 'controlsContainer',
			'order': 67,
			'visible': true,
			'align': "right",
			'showTooltip': true,
			'tooltip': gM( 'mwe-OnVideoFilters-tooltip' )
		},
		_filtersScreenOpen: false,
		active: false,

		setup: function( embedPlayer ) {
			this.addBindings();

		},

		addBindings: function() {

		},

		getComponent: function() {
			var _this = this;
			if( !this.$el ) {
				this.$el = $( '<button/>' )
					.attr( 'title', this.tooltip )
					.addClass( "btn icon-equalizer" + this.getCssClass() )
					.click( function(e) {
						_this.active = !_this.active;
						_this.toggleFiltersScreen(e.clientX);
					});
				this.createFiltersScreen();
			}
			return this.$el;
		},

		createFiltersScreen: function(){
			var _this = this;
			var filtersTable = $("<table class='filtersTable'>")
				.append("<tr><td>Brightness</td><td><input class='brightnessFilter' type='text' /></td></tr>")
				.append("<tr><td>Contrast</td><td><input class='contrastFilter' type='text' /></td></tr>")
				.append("<tr><td>Grayscale</td><td><input class='grayscaleFilter' type='text' /></td></tr>")
				.append("<tr><td>Saturation</td><td><input class='saturationFilter' type='text' /></td></tr>")
				.append("<tr><td>Hue-Rotate</td><td><input class='hueFilter' type='text' /></td></tr>")
				.append("<tr><td>Sepia</td><td><input class='sepiaFilter' type='text' /></td></tr>");
			var filtersScreen = $("<div class='filtersScreen'/>")
				.append(filtersTable)
				.append("<button class='reset-filters filtersResetBtn'>Reset</button>");
			this.embedPlayer.getVideoHolder().append(filtersScreen);
			this._setupSliders();
			$(".reset-filters").click(function() { _this._resetFilters(); });
		},

		_setupSliders: function() {
			$(".brightnessFilter").simpleSlider({range: [0,10], step: 0.1, snap: true, highlight: true});
			$(".contrastFilter").simpleSlider({range: [0,10], step: 0.1, snap: true, highlight: true});
			$(".grayscaleFilter").simpleSlider({range: [0,1], step: 0.1, snap: true, highlight: true});
			$(".saturationFilter").simpleSlider({range: [0,10], step: 0.1, snap: true, highlight: true});
			$(".hueFilter").simpleSlider({range: [0,360], step: 30, snap: true, highlight: true});
			$(".sepiaFilter").simpleSlider({range: [0,1], step: 0.1, snap: true, highlight: true});

			this._resetFilters();
			this._bindSliderEvents();

		},

		_bindSliderEvents: function() {
			$(".brightnessFilter").bind("slider:changed", function(event, data) {
				$("video").css('-webkit-filter', 'brightness(' + data.value + ')');
			});
			$(".contrastFilter").bind("slider:changed", function(event, data) {
				$("video").css('-webkit-filter', 'contrast(' + data.value + ')');
			});
			$(".grayscaleFilter").bind("slider:changed", function(event, data) {
				$("video").css('-webkit-filter', 'grayscale(' + data.value + ')');
			});
			$(".saturationFilter").bind("slider:changed", function(event, data) {
				$("video").css('-webkit-filter', 'saturate(' + data.value + ')');
			});
			$(".hueFilter").bind("slider:changed", function(event, data) {
				$("video").css('-webkit-filter', 'hue-rotate(' + data.value + 'deg)');
			});
			$(".sepiaFilter").bind("slider:changed", function(event, data) {
				$("video").css('-webkit-filter', 'sepia(' + data.value + ')');
			});

		},

		_resetFilters: function() {
			$(".brightnessFilter").simpleSlider("setValue", 1);
			$(".contrastFilter").simpleSlider("setValue", 1);
			$(".grayscaleFilter").simpleSlider("setValue", 0);
			$(".saturationFilter").simpleSlider("setValue", 1);
			$(".hueFilter").simpleSlider("setValue", 0);
			$(".sepiaFilter").simpleSlider("setValue", 0);
		},

		toggleFiltersScreen: function(x) {
			if (this.active){
				this.embedPlayer.getVideoHolder().find(".filtersScreen").css("right",30+"px");
				this.embedPlayer.getVideoHolder().find(".filtersScreen").addClass("active");
			}else{
				this.embedPlayer.getVideoHolder().find(".filtersScreen").removeClass("active");
			}
			this._filtersScreenOpen = !this._filtersScreenOpen;
		}

	}));
} )( window.mw, window.jQuery );