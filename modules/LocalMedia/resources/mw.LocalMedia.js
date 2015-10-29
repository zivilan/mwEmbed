( function( mw, $ ) {"use strict";

	mw.PluginManager.add( 'localMedia', mw.KBaseScreen.extend({

		defaultConfig: {
			align: "right",
			parent: "controlsContainer",
			displayImportance: "low",
			showTooltip: true,
			templatePath: '../LocalMedia/resources/LocalMedia.tmpl.html',
			tooltip: "Manage local media", // why is GM not working?  gM('lm-manage-title'),
		 	order: 50,
		 	requestedStorageSize: 1024*1024*1024  /* 1GB by default, if over available space should return all that is available */, 
		},
		state: 'none', // local availability state: none, downloading ready
		iconBtnClass: "icon-download",
		setup:function(){
			var _this = this;
			// override XHR requests before manifest request:
			_this.overrideXHR();
		},
		showUnsupported:function( errorMsg ){
			$('.browser-unsupported').show().find('.error-msg').text( errorMsg )
		},
		showScreen: function(){
			var _this = this;
			this._super(); // this is an override of showScreen in mw.KBaseScreen.js - call super
			// check if browser has file API
			if( !window.webkitRequestFileSystem ){
				_this.showUnsupported();
				return ;
			}
			window.webkitRequestFileSystem(window.PERSISTENT, 
				this.getConfig('requestedStorageSize'),
				function(fs){
					_this.fs = fs;
					_this.showStatus();
				}, 
				function(e){
					var msg = '';
					switch (e.code) {
						case FileError.QUOTA_EXCEEDED_ERR:
							msg = 'QUOTA_EXCEEDED_ERR';
							break;
						case FileError.NOT_FOUND_ERR:
							msg = 'NOT_FOUND_ERR';
							break;
						case FileError.SECURITY_ERR:
							msg = 'SECURITY_ERR';
							break;
						case FileError.INVALID_MODIFICATION_ERR:
							msg = 'INVALID_MODIFICATION_ERR';
							break;
						case FileError.INVALID_STATE_ERR:
							msg = 'INVALID_STATE_ERR';
							break;
						default:
							msg = 'Unknown Error';
							break;
					};

					_this.updateState( $( "<h3>Error: " + msg + "</h3>" ) );
				}
			);
			
		},
		showStatus: function(){
			var _this = this;
			$('.status').show();
			// get high level state: none, downloading, ready 
			switch( this.getState() ){
				case 'none':
					this.showStartDownload();
					break;
				case 'downloading':
					break;
				case 'ready':
					break;
			}
		},
		getState: function( callback ){
			// check if current asset is on disk ( folder with md5 manifest url)
			
			// if on disk check file set is complete ( check local mainfest urls one by one )
			
			// continue downloading or show "ready for offline playback" 
			
			return this.state;
		},
		updateState: function(){
			$('.localMedia .state').empty().append( $.makeArray( arguments ) );
		},
		showCheckingStatus: function(){
			
		},
		showStartDownload: function(){
			var _this = this;
			this.updateState(
				$('<h3>').text("Media can be downloaded"),
				$('<button>').text('download').click(function(){
					_this.startDownload();
				})
			)
		},
		startDownload: function(){
			var _this = this;
			// download the manifest
			this.updateState(
				$('<h3>').html("Downloading: <span class='percent'>0</span>%"),
				$('<div>').addClass('download-progress-holder')
			)
			// check if we already have mainfest in cache:
			if( this.storageGet( this.getManifestPath() ) ){
				// parse urls
			} else{
				// download manifest ( TODO why is $.get not working if override is clean ? )
				// TODO do we want to download manifest every time? 
				/*var oReq = new _XMLHttpRequest();
				oReq.addEventListener("load", function(){
					_this.parseManifest( this.responseText );
				});
				oReq.open("GET", this.getPlayer().getSrc() );
				oReq.send();*/
				$.get( this.getPlayer().getSrc(), function(xml){
					debugger;
				})
			}
		},
		downloadSegments: function(){
			//$.each( this.getSegments() ...
		},
		getUrlsFromManifest: function( xml){
			this.segmentUrls = [];
			var xmlDoc = $.parseXML( xml ),
			$xml = $( xmlDoc );
			// TODO this of course only handles a single type of dash ( kaltura dash )
			// get the segment pattern:
			var adaptionSet = $xml.find('AdaptationSet');
			$.each( adaptionSet, function(inx, set ){
				var $set = $(set);
				if( $set.attr('id') == "1" ){
					
					var media = $set.find('SegmentTemplate')[0].getAttribute('media');
					var init = $set.find('SegmentTemplate')[0].getAttribute('init');
				
				// sample of urls to cache: 
				// http://cfvod.kaltura.com/edash/p/1788671/sp/178867100/serveFlavor/entryId/0_caq7yan7/v/12/flavorId/0_,k0ele2pr,q01f1r61,z1rx89bz,89bdkm7h,/forceproxy/true/name/a.mp4.urlset/init-f2-v1.mp4
				// http://cfvod.kaltura.com/edash/p/1788671/sp/178867100/serveFlavor/entryId/0_caq7yan7/v/12/flavorId/0_,k0ele2pr,q01f1r61,z1rx89bz,89bdkm7h,/forceproxy/true/name/a.mp4.urlset/fragment-1-f2-v1.m4s
				// audio:
				// http://cfvod.kaltura.com/edash/p/1788671/sp/178867100/serveFlavor/entryId/0_caq7yan7/v/12/flavorId/0_,k0ele2pr,q01f1r61,z1rx89bz,89bdkm7h,/forceproxy/true/name/a.mp4.urlset/fragment-1-f2-a1.m4s
				// http://cfvod.kaltura.com/edash/p/1788671/sp/178867100/serveFlavor/entryId/0_caq7yan7/v/12/flavorId/0_,k0ele2pr,q01f1r61,z1rx89bz,89bdkm7h,/forceproxy/true/name/a.mp4.urlset/fragment-2-f2-a1.m4s
				}
			})
			return ;
		},
		getManifestPath: function( url ){
			// TODO the parent context should not be needed here; why is MD5 not on this side of the iframe already? 
			return window.parent.md5( url.split('?')[0] ) + '/a.mpd'; 
		},
		// abstract get set storage
		storageSet: function( path, value, writeDone, writeError){
			// never more then one deep:
			var pathParts = path.split('/');
			// make sure the top level directory is present: 
			
		},
		storageGet: function( path ){
			return false;
		},
		isManifest: function( url ){
			// Sample manifest url: 
			// http://cdnapi.kaltura.com/p/1788671/sp/178867100/playManifest/entryId/0_caq7yan7/flavorIds/0_k0ele2pr,0_q01f1r61,0_z1rx89bz,0_89bdkm7h/format/mpegdash/protocol/http/a.mpd?referrer=aHR0cDovL2xvY2FsaG9zdA==&playSessionId=90a6bed1-4b99-863d-7102-3fcac3e34f16&clientTag=html5:v2.35&uiConfId=30484161
			try{
				if( url.split('?')[0].substring( url.lastIndexOf( '/' ) + 1 ) ){
					return true;
				}
			} catch ( e ){
				// probably not a kaltura dash manifest
				return false;
			}
		},
		isMainfestAvaliableOffline: function( url ){
			return !!( this.storageGet( this.getManifestPath( url ) ) );
		},
		overrideXHR: function(){
			window._XMLHttpRequest = window.XMLHttpRequest;

			XMLHttpRequest =  function(){
				var obj = new _XMLHttpRequest();
				var _this = this;
				var events =  ["onreadystatechange","onloadstart","onprogress","onabort","onerror","onload","ontimeout","onloadend"];

				for (var i in events) {
					var event = events[i];
					(function ( x ) {
						obj[x] = function () {
							if ( returnObj[x] ) {
								// make sure the return object has response URL copied over: 
								returnObj.responseURL = obj.responseURL;
								
								// check if a manifest ( cache against base url )
								
								// remove this logic ( we pre-cache now )
								/*if ( x === "onloadend" && !obj.localFileFound ) {
									if ( obj.responseURL ) {
										
										var fileName = obj.responseURL.substring( obj.responseURL.lastIndexOf( '/' ) + 1 );
										fs.root.getFile( fileName , {create: true} , function ( fileEntry ) {
											fileEntry.createWriter( function ( fileWriter ) {
												fileWriter.onwrite = function ( e ) {
													console.log( 'Write completed.' );
													localStorage.setItem( fileName , 1 );
												};

												fileWriter.onerror = function ( e ) {
													console.log( 'Write failed: ' + e.toString() );
												};
												fileWriter.write( new Blob( [obj.response] ) );
											} );
										} );
									}
								}*/
								return returnObj[x]( arguments );
							}
						}
					}( event ));
				}

				var returnObj =  {
					response2:null,
					get readyState(){
						return obj.readyState
					},
					open: function(method, id,wait) {
						debugger;
						var fileName = id.substring(id.lastIndexOf('/')+1);
						if (localStorage.getItem(fileName)){
							obj.localFileFound = true;
							fs.root.getFile(fileName, {}, function(fileEntry) {

								// Obtain the File object representing the FileEntry.
								// Use FileReader to read its contents.
								fileEntry.file(function(file) {
									var reader = new FileReader();

									reader.onloadend = function(e) {
										var result = this.result;
										returnObj.response = result;
										returnObj.responseURL = id;
										var eventObj={ bubbles: false,
											cancelBubble: false,
											cancelable: false,
											currentTarget: returnObj,
											defaultPrevented: false,
											eventPhase: 2,
											isTrusted: true,
											lengthComputable: true,
											loaded: returnObj.response2.byteLength,
											position: returnObj.response2.byteLength,
											returnValue: true,
											srcElement: returnObj,
											target: returnObj,
											timeStamp: new Date(),
											total: returnObj.response2.byteLength,
											totalSize: returnObj.response2.byteLength,
											type: "loadend"
										}
										//returnObj.status = 200;

										obj.onload(eventObj);
										obj.onreadystatechange()
										obj.onloadend(eventObj)
									};

									reader.readAsArrayBuffer(file); // Read the file as plaintext.
								});
							});
							return;
						};
						console.log(id);
						return obj.open(method,id,wait)
					},

					setRequestHeader:function(header, value) {
						console.log("Header:"+Header+"  value:"+value);
						return obj.setRequestHeader(header, value)
					},
					send: function(data) {
						if (obj.localFileFound)
							return;
						return obj.send(data);
					},
					getResponseHeader:function(){
						return obj.getResponseHeader();
					},
					getAllResponseHeaders:function(){
						return obj.getAllResponseHeaders();
					},
					abort: function() {
						obj.abort();
					},
					addEventListener: function(eventName,cb){
						return obj.addEventListener(eventName,cd)
					},
					set responseType(value){
						console.log("set-responseType"); 
						obj.responseType = value
					},
					get responseType(){
						return obj.responseType
					},
					get response(){
						if (obj.localFileFound) 
							return returnObj.response2;
						return  obj.response
					},
					set response(value){
						returnObj.response2 = value
					},
					set timeout(value){
						obj.timeout = value
					},
					get status(){
						if (obj.localFileFound) 
							return 200;
						return obj.status;
					}
				};
				return returnObj;
			}
		}
		/*overrideXHR: function(){
		var _this = this;
		var oldXMLHttpRequest = XMLHttpRequest;
		
		// define constructor for my proxy object
		XMLHttpRequest = function() {
			var actual = new oldXMLHttpRequest();
			var self = this;

			this.onreadystatechange = null;

			// this is the actual handler on the real XMLHttpRequest object ( allows for response overrides )
			actual.onreadystatechange = function() {
				if (this.readyState == 4) {
					// Check if we are handling result of a manifest result:
					if( _this.isManifest( this.responseURL ) ){
						// if its a manifest keep it it around
						
					}
					// actual.responseText is the ajax result
					self.responseText = actual.responseText;
					// update the response URL as well: 
					self.responseURL = actual.responseURL
				}
				if (self.onreadystatechange) {
					return self.onreadystatechange();
				}
			};
			// add all proxy getters
			["status", "statusText", "response",
			 "readyState", "responseXML", "upload"].forEach(function(item) {
				Object.defineProperty(self, item, {
					get: function() {return actual[item];}
				});
			});

			// add all proxy getters/setters
			["ontimeout, timeout", "withCredentials", "onload", "onerror", "onprogress", "responseType"].forEach(function(item) {
				Object.defineProperty(self, item, {
					get: function() {return actual[item];},
					set: function(val) {actual[item] = val;}
				});
			});

			// Proxy XHR object methods ( https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Methods_2 )
			["addEventListener", "send", "open", "abort", "getAllResponseHeaders",
			 "getResponseHeader", "overrideMimeType", "setRequestHeader"].forEach(function(item) {
				Object.defineProperty(self, item, {
					value: function() {
						// special case "open" to intercept XHR requests
						if( item == "open" ){
							// when in off line mode intercept manifest requests:
							if( arguments[1] && this.isManifest( arguments[1] ) ){
								// advance virtual XHR order: 
								// self.onload(eventObj);
								// self.onreadystatechange()
								// self.onloadend(eventObj)
							}
						}
						// normally just pass through
						return actual[item].apply(actual, arguments);
					}
				});
			});
		}
		
	},*/
	}));

} )( window.mw, window.jQuery );
