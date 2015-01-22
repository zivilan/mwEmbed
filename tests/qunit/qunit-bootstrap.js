(function(){
// Get the current url path for "self"
	console.log("loaded");
var getQunitPath = function(){
	var scripts = document.getElementsByTagName('script');
	for(var i=0;i< scripts.length; i++){
		var src = scripts[i].getAttribute('src');
		if( src && src.indexOf('qunit-bootstrap.js') !== -1 ){
			return src.replace('qunit-bootstrap.js', '');
		}
	}
};
var getModuleName = function(){
	var url = document.URL;
	var m = url.match(/.modules\/([^\/]*)/);
	if( !m ){
		m = url.match(/.onPagePlugins\/([^\/]*)/);
	}
	if( !m ){
		m = url.match(/.ps\/([^\/]*)/);
	}
	return ( m[1] ) ? m[1] + '::' : '';
};
// Always include jQuery ( unless already included )
if( !window.jQuery ){
	var script = document.createElement('script');
	var basePath = getQunitPath();
	if (!basePath){
		basePath = 'http://localhost/html5.kaltura/mwEmbed';
	}else{
		basePath += '../..';
	}
	script.src = basePath+ '/resources/jquery/jquery.min.js';

// now append the script into HEAD, it will fetched and executed
	document.documentElement.firstChild.appendChild(script);

	//document.write( '<script type="text/javascript" src="' + getQunitPath()+ '../../resources/jquery/jquery.min.js"></script>');
}

var qunitWaitCount =0;
var qunitWaitForJQuery = function( callback ){
	if( window.jQuery ){
		// Append a body rule ( chrome inherits parent css for body offset in iframes for some reason ) 
		if( top !== self ){
			window.jQuery("<style type='text/css'>body{ padding-top:5px; }</style>").appendTo("head");
		}
		callback();
		return ;
	}
	if( qunitWaitCount < 1000 ){
		qunitWaitCount++;
		setTimeout(function(){
			qunitWaitForJQuery( callback );
		},10)
	}
};
window['kRunFlashTests'] = false;
if( document.URL.indexOf('runFlashQunitTests') != -1 ){
	window['kRunFlashTests'] = true;
}

// Check for the url for runQunitTests argument
if( true ){
	//document.write('' +
	//		'<link rel="stylesheet" href="' + getQunitPath() + 'lib/qunit.css" type="text/css" media="screen" />' +
	//		'<script type="text/javascript" src="' + getQunitPath() + 'lib/qunit.js"></script>' +
	//		'<script type="text/javascript" src="' + getQunitPath() + 'lib/inject.js"></script>'
	//);

	var script1 = document.createElement('script');
	var basePath = getQunitPath();
	if (!basePath){
		basePath = 'http://localhost/html5.kaltura/mwEmbed/tests/qunit/';
	}
	script1.src = basePath + 'lib/qunit.js';
	//document.documentElement.firstChild.appendChild(script1);


	var script2 = document.createElement('script');
	script2.src = basePath + 'lib/inject.js';
	document.documentElement.firstChild.appendChild(script2);

	//var script3 = document.createElement('link');
	//script3.href = getQunitPath() + 'lib/qunit.css';
	//document.documentElement.firstChild.appendChild(script2);

	window.qunitSetup = function(){
		// get the module name we are testing
		var orgModule = window.module;
		window.module = function( name, testEnvironment ){
			orgModule( getModuleName() + name, testEnvironment);
		};
		jQuery('#runQunitLink').remove();
		jQuery('body').prepend( '<h1 id="qunit-header">QUnit Test Runner</h1>' +
				'<h2 id="qunit-banner"></h2>'+
				'<div id="qunit-testrunner-toolbar"></div>' +
				'<h2 id="qunit-userAgent"></h2>' +
				'<ol id="qunit-tests"></ol>' +
				'<div id="qunit-fixture">test markup, will be hidden</div>' );
		QUnit.config.autostart = false;
	};
	// run qunit set:
	qunitWaitForJQuery( function(){
		jQuery( document ).ready( window.qunitSetup );
	});
} else {
	window.addRunTestLink = function(){
		// don't add testing links if in a documentation iframe: 
		if( window.isKalturaDocsIframe ){
			return ;
		}
		
		var url = document.URL;
		url += ( url.indexOf('?') === -1 )? '?' : '&';
		jQuery('body').append(
			jQuery('<span />').append(
				jQuery('<a />')
				.attr({
					'id':'runQunitLink',
					'href' : url + 'runQunitTests=1'
				})
				.text( 'html5 qunit')
				,
				jQuery( '<span />').text( ' | ')
				,
				jQuery('<a />')
				.attr({
					'id':'runQunitLink',
					'href' : url + 'runFlashQunitTests=1',
					'title' : 'note: not all test work with flash!'
				})
				.text( 'flash qunit')
			)
			.css({
				'position': 'absolute',
				'display': 'block',
				'top': '0px',
				'right': '0px',
				'background':'#eee',
				'padding': '5px'
			})
		);
	};
	
	// if not running unit tests provide a link:
	qunitWaitForJQuery( function(){
		// check for only display player flag: 
		jQuery( document ).ready( function(){
			if( document.URL.indexOf( 'onlyDisplayPlayer') != -1  ){
				$('h1,h2,h3,h4,h5,h6,#kdoc-more-desc').hide();
			} else {
				jQuery(document).ready( window.addRunTestLink );
			}
		})
		
	});

}

})();
