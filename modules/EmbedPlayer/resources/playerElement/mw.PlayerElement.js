( function( mw, $ ) {"use strict";

// Class defined in resources/class/class.js
	mw.PlayerElement = Class.extend({
		element: null,
		src: null,
		/**
		 * Creates a new player element and appends it to the given holder
		 * @param holder player holder
		 * @param playerId element ID
		 */
		init: function( containerId , playerId ){
			// Container Id
			this.containerId = containerId;
			//mw.log('PlayerElement::Error: function init should be implemented by playerElement interface ');
			this.createClickableArea();
		},
		getContainer: function(){
			return $( document.getElementById( this.containerId ) );
		},
		createClickableArea: function( containerId ){
			var $div = $('<div />').css({
				'position' : 'absolute',
				'top' : 0,
				'left' : 0,
				'width' : '100%',
				'height' : '100%',
				'z-index': 1,
				/* Force IE to draw div so we will catch click events */
				'background' : '#000',				
				'opacity' : '0.01',
				'filter' : 'alpha(opacity=01)'
			}).addClass('clickable');
			this.getContainer().append($div);
		},
		click: function( callback ){
			if( $.isFunction(callback) ){
				this.getContainer().find('.clickable').click(callback);
			}
		},
		getElement: function() {
			return this.element;
		},
		play: function(){
			mw.log('PlayerElement::Error: function play should be implemented by playerElement interface ');
		},
		pause: function(){
			mw.log('PlayerElement::Error: function pause should be implemented by playerElement interface ');
		},
		seek: function( val ){
			mw.log('PlayerElement::Error: function seek should be implemented by playerElement interface ');
		},
		load: function(){
			mw.log('PlayerElement::Error: function load should be implemented by playerElement interface ');
		},
		changeVolume: function( val ){
			mw.log('PlayerElement::Error: function changeVolume should be implemented by playerElement interface ');
		}
	});

} )( window.mw, window.jQuery );