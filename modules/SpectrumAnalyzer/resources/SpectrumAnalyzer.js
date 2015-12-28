( function( mw, $ ) {"use strict";


	mw.PluginManager.add( 'spectrumAnalyzer', mw.KBaseComponent.extend({

		defaultConfig: {
			'parent': 'controlsContainer',
			'order': 58,
			'visible': true,
			'align': "right",
			'targetDivId': null,
			'matchVideoColors': false,
			'refreshInterval': 500,
			'showTooltip': true,
			'meterWidth': 10,
			'tooltip': gM( 'mwe-SpectrumAnalyzer-tooltip' )
		},
		colorThief: null,
		active: false,
		vid: null,
		sampleIntervalId: null,

		audioContext: null,
		analyzerNode: null,
		mediaSourceNode: null,
		animationId: null,
		status: 0, //flag for sound is playing 1 or stopped 0
		allCapsReachBottom: false,
		canvas: null,

		setup: function( embedPlayer ) {
			if (this.getConfig('matchVideoColors')){
				this.colorThief = new ColorThief();
			}
			this.addBindings();
		},

		addBindings: function() {
			var _this = this;
			$( this.embedPlayer).bind('playerReady', function(){
				// get video reference
				_this.vid = _this.embedPlayer.getPlayerElement();
				$(_this.vid).attr("crossorigin", "anonymous");
				// draw canvas in target div
				try{
					var targetDiv = $('#'+_this.getConfig('targetDivId'), window.parent.document);
					targetDiv.append('<canvas id="canvas" width="' + targetDiv.width() + '" height="' + targetDiv.height() + '"></canvas>');
					_this.canvas = targetDiv.find("#canvas").get(0);
				}catch(e){
					this.log("spectrumAnalyzer::Couldn't access target div.")
					return;
				}
				if (_this.prepareAPI()){
					_this.mediaSourceNode = _this.audioContext.createMediaElementSource(_this.vid);
					_this.analyzerNode = _this.audioContext.createAnalyser();
					_this.mediaSourceNode.connect(_this.analyzerNode);
					_this.analyzerNode.connect(_this.audioContext.destination);
				}
			});
		},

		prepareAPI: function(){
			window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
			window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
			window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
			try {
				this.audioContext = new AudioContext();
				return true;
			} catch (e) {
				this.log('spectrumAnalyzer::Your browser does not support AudioContext');
				return false;
			}
		},

		start: function(){
			var _this = this;
			this.status = 1;
			$(this.canvas).fadeIn();
			this.sampleIntervalId = setInterval(function(){
				_this.doSample();
			}, this.getConfig('refreshInterval'));
		},

		stop: function(){
			this.status = 0;
			cancelAnimationFrame(this.animationId);
			clearInterval(this.sampleIntervalId);
			this.sampleIntervalId = null;
			$(this.canvas).fadeOut();
		},

		doSample: function(){
			var sample = new Float32Array(this.analyzerNode.frequencyBinCount);
			this.analyzerNode.getFloatFrequencyData(sample);
			if (this.animationId !== null) {
				cancelAnimationFrame(this.animationId);
			}
			if (this.getConfig('matchVideoColors')){
				var frameColors = this.colorThief.getPalette(this.vid,3);
				if (frameColors){
					var color1 = frameColors[0];
					var color2 = frameColors[1];
					var color3 = frameColors[2];
					var hex1 = mw.util.rgbToHex(color1[0],color1[1],color1[2]);
					var hex2 = mw.util.rgbToHex(color2[0],color2[1],color2[2]);
					var hex3 = mw.util.rgbToHex(color3[0],color3[1],color3[2]);
				}
				this.drawSpectrum(hex1, hex2, hex3);
			}else{
				this.drawSpectrum();
			}



		},

		drawSpectrum: function(){
			var _this = this;
			var	cwidth = this.canvas.width;
			var	cheight = this.canvas.height - 2;
			var	meterWidth = this.getConfig('meterWidth'); //width of the meters in the spectrum
			var	gap = 2; //gap between meters
			var	capHeight = 2;
			var	capStyle = '#fff';
			var	meterNum = 800 / (10 + 2); //count of the meters
			var	capYPositionArray = [];    //store the vertical position of hte caps for the previous frame
			var ctx = this.canvas.getContext('2d');
			var	gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
				if(arguments.length === 3){
					if (arguments[0] !== undefined){
						gradient.addColorStop(1, arguments[0]);
						gradient.addColorStop(0.5, arguments[1]);
						gradient.addColorStop(0, arguments[2]);
					}else{
						gradient.addColorStop(1, '#000');
						gradient.addColorStop(0.5, '#000');
						gradient.addColorStop(0, '#000');
					}
			}else{
				gradient.addColorStop(1, '#0f0');
				gradient.addColorStop(0.5, '#ff0');
				gradient.addColorStop(0, '#f00');
			}
			var drawMeter = function() {
				var array = new Uint8Array(_this.analyzerNode.frequencyBinCount);
				_this.analyzerNode.getByteFrequencyData(array);
				if (_this.status === 0) {
					//fix when some sounds end the value still not back to zero
					for (var i = array.length - 1; i >= 0; i--) {
						array[i] = 0;
					};
					_this.allCapsReachBottom = true;
					for (var i = capYPositionArray.length - 1; i >= 0; i--) {
						_this.allCapsReachBottom = _this.allCapsReachBottom && (capYPositionArray[i] === 0);
					};
					if (_this.allCapsReachBottom) {
						cancelAnimationFrame(_this.animationId); //since the sound is top and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
						return;
					};
				};
				var step = 10;// Math.round(array.length / meterNum); //sample limited data from the total array
				ctx.clearRect(0, 0, cwidth, cheight);
				for (var i = 0; i < meterNum; i++) {
					var value = array[i * step];
					if (capYPositionArray.length < Math.round(meterNum)) {
						capYPositionArray.push(value);
					};
					ctx.fillStyle = capStyle;
					//draw the cap, with transition effect
					if (value < capYPositionArray[i]) {
						ctx.fillRect(i * (meterWidth+gap), cheight - (--capYPositionArray[i]), meterWidth, capHeight);
					} else {
						ctx.fillRect(i * (meterWidth+gap), cheight - value, meterWidth, capHeight);
						capYPositionArray[i] = value;
					};
					ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
					ctx.fillRect(i * (meterWidth+gap) /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
				}
				_this.animationId = requestAnimationFrame(drawMeter);
			}
			this.animationId = requestAnimationFrame(drawMeter);
		},

		getComponent: function() {
			var _this = this;
			if( !this.$el ) {
				this.$el = $( '<button/>' )
					.attr( 'title', gM( 'mwe-SpectrumAnalyzer-tooltip' ) )
					.addClass( "btn icon-spectrum-analyzer" + this.getCssClass() )
					.click( function() {
						_this.active = !_this.active;
						var iconColor = _this.active ? "LawnGreen" : "white";
						_this.embedPlayer.getInterface().find(".icon-spectrum-analyzer").css("color", iconColor);
						if (_this.active){
							_this.start();
						}else{
							_this.stop();
						}
					});
			}
			return this.$el;
		}
	}));
} )( window.mw, window.jQuery );