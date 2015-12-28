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
		active: false,
		filterString: '',

		setup: function( embedPlayer ) {
			//if (mw.isChrome()){
			//	this.filterString='';
			//}
		},

		getComponent: function() {
			var _this = this;
			if( !this.$el ) {
				this.$el = $( '<button/>' )
					.attr( 'title', this.getConfig('tooltip') )
					.addClass( "btn icon-equalizer" + this.getCssClass() )
					.click( function() {
						_this.active = !_this.active;
						_this.toggleFiltersScreen();
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
				.append("<a href='#' class='reset-filters filtersResetBtn'>Reset</a>");
			this.embedPlayer.getVideoHolder().append(filtersScreen);
			this._setupSliders();
			$(".reset-filters").click(function() { _this._resetFilters(); });
		},

		_setupSliders: function() {
			$(".brightnessFilter").simpleSlider({range: [0,10], step: 0.1});
			$(".contrastFilter").simpleSlider({range: [0,10], step: 0.1});
			$(".grayscaleFilter").simpleSlider({range: [0,1], step: 0.1});
			$(".saturationFilter").simpleSlider({range: [0,10], step: 0.1});
			$(".hueFilter").simpleSlider({range: [0,360], step: 30});
			$(".sepiaFilter").simpleSlider({range: [0,1], step: 0.1});

			this._resetFilters();
			this._bindSliderEvents();

		},

		_bindSliderEvents: function() {
			var self = this;
			$(".brightnessFilter").bind("slider:changed", function(event, data) {
				self._addFilter('brightness', data.value);
			});
			$(".contrastFilter").bind("slider:changed", function(event, data) {
				self._addFilter('contrast', data.value);
			});
			$(".grayscaleFilter").bind("slider:changed", function(event, data) {
				self._addFilter('grayscale', data.value);
			});
			$(".saturationFilter").bind("slider:changed", function(event, data) {
				self._addFilter('saturate', data.value);
			});
			$(".hueFilter").bind("slider:changed", function(event, data) {
				self._addFilter('hue-rotate', data.value + 'deg');
			});
			$(".sepiaFilter").bind("slider:changed", function(event, data) {
				self._addFilter('sepia', data.value);
			});

		},

		_resetFilters: function() {
			$(".brightnessFilter").simpleSlider("setValue", 1);
			$(".contrastFilter").simpleSlider("setValue", 1);
			$(".grayscaleFilter").simpleSlider("setValue", 0);
			$(".saturationFilter").simpleSlider("setValue", 1);
			$(".hueFilter").simpleSlider("setValue", 0);
			$(".sepiaFilter").simpleSlider("setValue", 0);
			$("video").css('webkit-filter', 'none');
		},

		_addFilter: function(filterName, value) {
			var oldStyle = $("video").css('-webkit-filter');
			if(oldStyle === "none") {
				$("video").css('-webkit-filter', filterName + '(' + value + ')');
			}
			else {
				var currentStyle = $("video").css('-webkit-filter').split(" ").filter(function (name) {
					return name.indexOf(filterName) == -1;
				});
				currentStyle.push(filterName + '(' + value + ')');
				$("video").css('-webkit-filter', currentStyle.join(" "));
			}
		},

		toggleFiltersScreen: function(x) {
			if (this.active){
				this.embedPlayer.getVideoHolder().find(".filtersScreen").css("right",30+"px");
				this.embedPlayer.getVideoHolder().find(".filtersScreen").fadeIn();
			}else{
				this.embedPlayer.getVideoHolder().find(".filtersScreen").fadeOut();
			}
		}

	}));
} )( window.mw, window.jQuery );