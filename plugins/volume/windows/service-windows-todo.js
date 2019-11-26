var EventEmitter = require('events');
var net = require("net");
var {createLogger} = require('jaxcore');
var log = createLogger('Desktop');
var Client = plugin.Client;

var windowsAudio = require('win-audio');

var desktopInterface = require('./interface.js')(log);

var desktopState = {};

function DesktopService() {
    this.constructor();
    this.setStore(desktopState, true);
    this.bindInterface(desktopInterface);
    this._onVolumeChange = this.onVolumeChange.bind(this);
    this._onToggleMute = this.onToggleMute.bind(this);
}

DesktopService.prototype = new Client();
DesktopService.prototype.constructor = Client;

DesktopService.prototype.connect = function (callback) {
    this.audioDevice = windowsAudio.speaker;
    
    this.audioDevice.events.on('change', this._onVolumeChange);
    this.audioDevice.events.on('toggle', this._onToggleMute);
    var volume = this.audioDevice.get();
    this.parsers.volume(volume);
    var muted = this.audioDevice.isMuted();
    this.parsers.muted(muted);
    this.audioDevice.polling(this.state.audioPolling || 200);
    
    //log('audio connected');
    //this.audioDevice.get
    
    this.emit('connect', this);

    if (callback) {
        callback(this);
    }
};
DesktopService.prototype.disconnect = function () {
    this.audioDevice.events.removeEventListener('change', this._onVolumeChange);
    this.audioDevice.events.removeEventListener('toggle', this._onToggleMute);
    this.emit('disconnect');
};

DesktopService.prototype.onVolumeChange = function (status) {
    var volume = status.new;
    this.parsers.volume(volume);
};

DesktopService.prototype.onToggleMute = function (status) {
    var muted = status.new===1;
    this.parsers.muted(muted);
};

module.exports = new DesktopService();
