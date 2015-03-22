(function ( mw, $ ) {
	"use strict";
	mw.searchBox = function (settings){
		this.$searchBar = null;
		this.embedPlayer = settings.embedPlayer;
		this.templatePath = settings.templatePath || "searchBox";
		this.cssClass = settings.cssClass;
		this.target = settings.target;
		this.components = {};
		this.cache = {}; //Hold the search data cache
		this.dataSet = null; //Hold current dataset returnd from API
		this.kalturaClient = settings.kalturaClient;
		this.getComponent();
	};

	mw.searchBox.prototype = {
		bind: function(name, handler){
			this.embedPlayer.bindHelper(name, handler);
		},
		trigger: function(e, data){
			this.embedPlayer.triggerHelper(e, data);
		},
		getComponent: function(){
			if ( !this.$searchBar ) {
				var _this = this;
				var rawHTML = window.kalturaIframePackageData.templates[this.templatePath];
				var searchBarTemplate = mw.util.tmpl( rawHTML );

				this.$searchBar = $(searchBarTemplate( {
					searchPlaceholder: gM('ks-chapters-search-placeholder'),
					clearTitle: gM('ks-chapters-search-clear')
				} ));
				this.components.searchBox = this.$searchBar.find("#searchBox");
				this.components.searchBoxWrapper = this.$searchBar.find("#searchBoxWrapper");
				this.components.clearSearchBox = this.$searchBar.find("#searchBoxCancelIcon");
				this.components.magnifyGlass = this.$searchBar.find("#searchBoxIcon");

				this.components.clearSearchBox.on( "click touchend", function (e) {
					e.preventDefault();
					e.stopPropagation();
					document.activeElement.blur();
					_this.updateSearchUI("");
					_this.trigger("searchBoxResultsUpdate");
					_this.trigger( 'clearTooltip' );
					_this.components.searchBox.typeahead( "val", "" ).focus();
					return false;
				} );
				//Add tooltip
				this.embedPlayer.layoutBuilder.setupTooltip( this.components.clearSearchBox, "arrowTop" );
				// Add the searchbar to the target container
				$(this.target).append( this.$searchBar );
				this.initSearchProvider();
			}
			return this.$searchBar;
		},

		initSearchProvider: function(){
			var _this = this;
			var typeahead = this.components.searchBox.typeahead( {
					minLength: 3,
					highlight: true,
					hint: false
				},
				{
					name: 'label',
					displayKey: function ( obj ) {
						return _this.parseData( obj.value, typeahead.val() );
					},
					templates: {
						suggestion: function ( obj ) {
							return _this.parseData( obj.value, typeahead.val() );
						},
						empty: [
							'<div class="empty-message">',
							gM("ks-chapters-search-empty-result"),
							'</div>'
						].join('\n')
					},
					source: function(query, done){return _this.findMatches(query, done);}
				} )
				.on( "typeahead:selected", function ( e, obj ) {
					console.e.preventDefault();
					e.stopPropagation();
					_this.trigger("searchBoxResultsUpdate", [_this.dataSet[obj.value]]);
					return false;
				} )
				.on( 'change keyup paste input', function (e) {
					_this.updateSearchUI( this.value );
					if (this.value.length < 3) {
						_this.trigger("searchBoxResultsUpdate");
					}
					// On "enter" key press:
					// 1. If multiple suggestions and none was chosen - display results for all suggestions
					// 2. Close dropdown menu
					if ( e.type === "keyup" && e.keyCode === 13 ) {
						var results = _this.getDropdownResults();
						_this.trigger("searchBoxResultsUpdate", [results]);
						typeahead.typeahead( "close" );
					}
				} )
				.on( "focus", function () {
					_this.trigger( "onDisableKeyboardBinding" );
					//On each focus render width of dropdown menu
					_this.components.searchBoxWrapper.find(".tt-dropdown-menu" ).width(_this.$searchBar.width());
					_this.trigger("searchBoxFocus");
				} )
				.on( "blur", function () {
					_this.trigger( "onEnableKeyboardBinding" );
					_this.trigger("searchBoxBlur");
				} );
		},
		// Helper function for parsing search result length
		parseData: function ( data, searchTerm ) {
			var startOfMatch = data.toLowerCase().indexOf( searchTerm.toLowerCase() );
			if ( startOfMatch > -1 ) {
				var expLen = searchTerm.length;
				var dataLen = data.length;
				var restOfExpLen = dataLen - (startOfMatch + expLen);
				var hintLen = Math.floor( restOfExpLen * 0.2 );
				if (hintLen === 0 || hintLen/dataLen > 0.7 || hintLen < 40){
					hintLen = restOfExpLen;
				}
				return data.substr( startOfMatch, expLen + hintLen );
			} else {
				return data;
			}
		},
		//Update icon state and dropdown menu state
		updateSearchUI: function(expression){
			switch ( expression.length ) {
				case 0:
					this.components.clearSearchBox.removeClass("active");
					this.components.magnifyGlass.removeClass("active");
					break;
				case 1:
				case 2:
					this.components.clearSearchBox.addClass("active");
					this.components.magnifyGlass.addClass("active");
					break;
				default:
					this.components.clearSearchBox.addClass("active");
					this.components.magnifyGlass.addClass("active");
			}
		},
		minimizeSearchBar: function(){
			this.$searchBar.addClass("minimized");
		},
		maximizeSearchBar: function(){
			this.$searchBar.removeClass("minimized");
		},
		//Get all search results for current search term
		getDropdownResults: function(){
			//Until typeahead expose event or API to query this data we need to use this HACK to access inner
			//objects and data inside the lib
			var _this = this;
			var dropdown = this.components.searchBox.data( 'ttTypeahead' ).dropdown;
			var objIds = [];
			var suggestionsElms = dropdown._getSuggestions();
			// Only update if there are available suggestions
			if ( suggestionsElms.length ) {
				suggestionsElms.each( function ( i, suggestionsElm ) {
					var suggestionsData = dropdown.getDatumForSuggestion( $( suggestionsElm ) );
					objIds = objIds.concat( _this.dataSet[suggestionsData.raw.value] );
				} );
			}
			return objIds;
		},
		findMatches: function ( query, done ) {
			// Fetch results from API
			this.getSearchData( query, function ( strs ) {
				var matches, substrRegex;
				// an array that will be populated with substring matches
				matches = [];
				// regex used to determine if a string contains the substring `q`
				var regexExp = query.replace(/^\s+/, '').replace(/\s+$/, '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
				substrRegex = new RegExp( regexExp, 'i' );
				// iterate through the pool of strings and for any string that
				// contains the substring `q`, add it to the `matches` array
				$.each( strs, function ( index, str ) {
					if ( substrRegex.test( str ) ) {
						// the typeahead jQuery plugin expects suggestions to a
						// JavaScript object, refer to typeahead docs for more info
						matches.push( { value: str } );
					}
				} );
				done( matches );
			} );
		},
		getSearchData: function(expression, callback){
			var liveCheck = this.embedPlayer.isLive() && mw.getConfig("EmbedPlayer.LiveCuepoints");
			// If results are cached then return from cache, unless in live session
			expression = expression.replace(/^\s+/, '').replace(/\s+$/, '' ).toLowerCase();
			var cacheExp = expression.substr(0,3);
			if (!liveCheck && this.cache[cacheExp]){
				this.dataSet = this.cache[cacheExp].hash;
				return callback(this.cache[cacheExp].sortedKeys);
			}

			var _this = this;
			var request = {
				'service': 'cuepoint_cuepoint',
				'action': 'list',
				'filter:entryIdEqual': _this.embedPlayer.kentryid,
				'filter:objectType': 'KalturaCuePointFilter',
				'filter:freeText': expression + "*"
			};
			// If in live mode, then search only in cuepoints which are already available at current live timeline
			if (liveCheck){
				request['filter:updatedAtLessThanOrEqual'] = this.embedPlayer.kCuePoints.getLastUpdateTime();
			}

			this.kalturaClient.doRequest(request,
				function (data) {
					if (!_this.isValidResult(data)) {
						return;
					}
					// Validate result
					var results = {
						hash: {},
						sortedKeys: []
					};

					$.each(data.objects, function (index, res) {
						if (!_this.isValidResult(res)) {
							data[index] = null;
						}

						var searchData = [res.title, res.description];
						//Check if res tags is not empty before adding data
						if (res.tags) {
							var tags = res.tags.split( "," );
							tags = $.grep( tags, function ( n ) {
								return(n);
							} );

							searchData = searchData.concat( tags );
						}

						$.each(searchData, function(index, data){
							if (results.hash[data]) {
								results.hash[data].push(res.id);
							} else {
								results.hash[data] = [res.id];
								results.sortedKeys.push(data);
							}
						});
					});
					results.sortedKeys.sort();

					_this.dataSet = results.hash;
					_this.cache[expression] = results;

					if (callback) {
						callback(results.sortedKeys);
					}
				}
			);
		},
		isValidResult: function (data) {
			// Check if we got error
			if (!data){
				this.error = true;
				this.log("Error retrieving data");
				return false;
			} else if ( data.code && data.message ) {
				this.error = true;
				this.log("Error code: " + data.code + ", error message: " + data.message);
				return false;
			}
			this.error = false;
			return true;
		},
		blur: function(){
			//Remove focus from searchbox to enable maximize on focus
			this.$searchBar.blur();
			this.components.searchBox.blur();
		}
	};
})( window.mw, window.jQuery );