( function( mw, $ ) {"use strict";

    mw.PluginManager.add( 'audioCast', mw.KBaseComponent.extend({
        defaultConfig: {
            "parent": "videoHolder",
            "order": 200,
            "align": "right"
        },
        setup: function(){
            this.addBindings();
        },
        isSafeEnviornment: function(){
            if( !mw.isMobileDevice() ) {
                return true;
            }

            return false;
        },
        interval:null,
        addBindings: function() {
            var _this = this;

            this.bind('playerReady', function() {
                _this.addAudioCastButton();
                _this.go();
            });

            this.bind('onplay', function(){
                _this.socket.emit('publish', _this.qId + ":play");
                _this.interval =  setInterval(function(){
                    _this.socket.emit('publish', _this.qId + ":currentTime=" + _this.embedPlayer.currentTime);
                } ,1000);
            });

            this.bind('onpause', function(){
                window.clearInterval(_this.interval);
                _this.interval = null;
                _this.socket.emit('publish', _this.qId + ":pause");
            });
        },
        getComponent: function() {
            if( !this.$el ) {
                this.$el = $( '<button />' )
                    .addClass("btn").addClass( this.getCssClass() );
            }

            return this.$el;
        },
        s4: function () {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        },
        guid: function() {
            return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
                this.s4() + '-' + this.s4() + this.s4() + this.s4();
        },
        qId: 0,
        createQRCode: function(){
            this.qId = this.guid();
            var qrParams = {
                entryId:this.embedPlayer.kentryid,
                partnerId:this.embedPlayer.kpartnerid,
                qId:this.qId
            };

            $("#qrcode").qrcode(JSON.stringify(qrParams));
        },
        qrdiv:"<div id='qrcode' style='position: absolute;bottom:35px;right:0;width: 260px; height: 260px; background-color: white; padding: 2px'></div>",
        addAudioCastButton: function(){
            this.embedPlayer.getVideoHolder().append(this.qrdiv);
            this.createQRCode();
        },
        removeAudioCastButton: function(){
            $("#qrcode").remove();
        },
        socket:null,
        go: function () {
            var y = "p=" + this.embedPlayer.kpartnerid +"&x="+ this.qId;
            this.socket = io.connect("http://dev-backend15.dev.kaltura.com:3000/?"+y);
            return false;
        }
    }));

} )( window.mw, window.jQuery );