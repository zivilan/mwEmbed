( function( mw, $ ) {"use strict";

    mw.PluginManager.add( 'audioCast', mw.KBaseComponent.extend({
        defaultConfig: {
            "parent": "videoHolder",
            "order": 200,
            "align": "right",
            currentTime: 0
        },
        currentTime:0,
        setup: function(){
            this.addBindings();
        },
        isSafeEnviornment: function(){
            if( !mw.isMobileDevice() ) {
                return true;
            }

            return false;
        },
        addBindings: function() {
            var _this = this;

            this.bind('playerReady', function() {
                _this.addAudioCastButton();
            });

            this.bind('playing', function(){
                setInterval(function(){
                        _this.currentTime = _this.embedPlayer.currentTime;
                        _this.createQRCode();
                        _this.removeAudioCastButton();
                        _this.addAudioCastButton();
                    }
                    ,5000);
            });


        },
        getComponent: function() {
            if( !this.$el ) {
                this.$el = $( '<button />' )
                    .addClass("btn").addClass( this.getCssClass() );
            }

            return this.$el;
        },
        createQRCode: function(){
            var ks = "NTA5OWE0NTgyZDBkMmYwMmFmODZhZjAzYzBhNTNlZDI3Y2NhODY1M3wxMDI7MTAyOzIzMTUyMjY0Mzg7MjsxNDUxMjI2NDM4Ljk4Nzg7eW9zc2kucGFwaWFzaHZpbGlAa2FsdHVyYS5jb207Ozs==";
            var url = "http://www.kaltura.com";
            var qrParams = {
                entryId:this.embedPlayer.kentryid,
                ks:ks,
                currentTime:this.currentTime,
                url:url
            };

            $("#qrcode").qrcode(JSON.stringify(qrParams));
        },
        qrdiv:"<div id='qrcode' style='position: absolute;bottom:0;right:0;width: 260px; height: 260px; background-color: white; padding: 2px'></div>",
        addAudioCastButton: function(){
            this.embedPlayer.getVideoHolder().append(this.qrdiv);
            this.createQRCode();

        },
        removeAudioCastButton: function(){
            $("#qrcode").remove();
        }
    }));

} )( window.mw, window.jQuery );