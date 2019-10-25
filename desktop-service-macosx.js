var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var child_process = require('child_process');
var robot = require("robotjs");

function DesktopService(defaults) {
	this.constructor();
	this.createStore('System Volume Store', true);
	this.setStates({
		connected: {
			type: 'boolean',
			defaultValue: false
		},
		muted: {
			type: 'boolean',
			defaultValue: false
		},
		volume: {
			type: 'integer',
			defaultValue: 0,
			minimum: 'minVolume',
			maximum: 'maxVolume'
		},
		volumePercent: {
			type: 'float',
			defaultValue: 0
		},
		minVolume: {
			type: 'integer',
			defaultValue: 0,
			maximumValue: 100,
			minimumValue: 0
		},
		maxVolume: {
			type: 'integer',
			defaultValue: 100,
			maximumValue: 100,
			minimumValue: 0
		},
		volumeIncrement: {
			type: 'integer',
			defaultValue: 1
		}
	}, defaults);
}

DesktopService.prototype = new Client();
DesktopService.prototype.constructor = Client;

DesktopService.id = function (config) {
	return config.host; //+':'+config.port;
};

DesktopService.prototype.connect = function () {
	var me = this;
	this.lastSetVolume = new Date();
	this.getVolume(function () {
		console.log('systemaudio: volume', me.state.volume);
		me.getMuted(function () {
			console.log('systemaudio: muted', me.state.muted);
			
			me.startMonitor();
			console.log('systemaudio: connected');
			me.emit('connect');
		});
	});
};

DesktopService.prototype.disconnect = function (options) {
	this.log('disconnecting...');
};

DesktopService.prototype.startMonitor = function () {
	this.readInterval = 500;
	
	this.stopMonitor();
	var me = this;
	
	this.monitor = setInterval(function () {
		if (me.lastSetVolume && new Date().getTime() - me.lastSetVolume.getTime() < me.readInterval) {
			console.log('ignore 1');
			return;
		}
		me._getVolume(function (volume, volumePercent) {
			if (me.lastSetVolume && new Date().getTime() - me.lastSetVolume.getTime() < me.readInterval*2) {
				// ignore
				console.log('ignore 2');
				return;
			}
			var diff = Math.abs(me.state.volume - volume);
			if (diff > 1) {
				console.log('volume was changed externally', volume);
				me._setVolume(volume);
			}
		});
		me.getMuted();
	}, me.readInterval);
};

DesktopService.prototype.stopMonitor = function () {
	clearInterval(this.monitor);
};

// -- VOLUME ------------

DesktopService.prototype.setMinVolume = function (v) {
	this.setState({
		minVolume: v
	});
};

DesktopService.prototype.setMaxVolume = function (v) {
	this.setState({
		maxVolume: v
	});
};

DesktopService.prototype._getVolume = function (callback) {
	var me = this;
	child_process.execFile('/usr/bin/osascript', ['-e', 'get volume settings'], function (error, stdout, stderr) {
		if (error) {
			throw error;
		}
		var data = stdout.toString();
		var m = data.match(/output volume:(\d+),/);
		if (m) {
			var volume = parseInt(m[1]);
			callback(volume);
		} else {
			console.log('_getVolume error, no volume');
			callback();
		}
		
	});
};

DesktopService.prototype.getVolume = function (callback) {
	var me = this;
	this._getVolume(function (volume) {
		if (volume !== me.state.volume) {
			me._setVolume(volume);
		}
		if (callback) callback(me.state.volume, me.state.volumePercent);
	});
};
DesktopService.prototype._setVolume = function (volume) {
	var volumePercent = volume / 100;
	this.setState({
		volumePercent: volumePercent,
		volume: volume
	});
	console.log('e v _setVolume', this.state.volumePercent, this.state.volume);
	this.emit('volume', this.state.volumePercent, this.state.volume);
};

DesktopService.prototype.setVolume = function (volume) {
	if (volume < this.state.minVolume) volume = this.state.minVolume;
	if (volume > this.state.maxVolume) volume = this.state.maxVolume;
	
	if (volume !== this.state.volume) {
		this._setVolume(volume);
		this._writeVolume();
	}
};

DesktopService.prototype._writeVolume = function () {
	if (this.isSettingVolume) {
		console.log('already isSettingVolume');
		return;
	}
	
	this.isSettingVolume = true;
	var me = this;
	var volume = this.state.volume;
	console.log('_writeVolume', volume);
	this.isSettingVolume = true;
	child_process.execFile('/usr/bin/osascript', ['-e', 'set volume output volume ' + volume.toString()], function (error, stdout, stderr) {
		me.isSettingVolume = false;
		
		console.log('wroteVolume ' + volume + ' _volumeQueued = ' + me.state.volume, stdout.toString());
		
		if (volume != me.state.volume) {
			console.log('_writeVolume and wroteVolume do NOT MATCH');
			me._writeVolume();
		}
		me.lastSetVolume = new Date();
	});
};

DesktopService.prototype.changeVolume = function (diff) {
	// if (diff > 0) desktopService.volumeUp();
	// else desktopService.volumeDown();
	var v = this.state.volume + diff;
	console.log('changing volume ...', this.state.volume, v);
	this.setVolume(v);
};

DesktopService.prototype.volumeUp = function () {
	this.changeVolume(this.state.volumeIncrement);
};
DesktopService.prototype.volumeDown = function () {
	this.changeVolume(-this.state.volumeIncrement);
};

DesktopService.prototype.getMuted = function (callback) {
	var me = this;
	child_process.execFile('/usr/bin/osascript', ['-e', 'output muted of (get volume settings)'], function (error, stdout, stderr) {
		var data = stdout.toString().trim();
		
		var muted = null;
		if (data === 'true') {
			muted = true;
		} else if (data === 'false') {
			muted = false;
		} else {
			console.log('getMuted error: [[' + data + ']]');
			return;
		}
		me._muteChanged(muted);
		if (callback) callback(muted);
	});
};

DesktopService.prototype._muteChanged = function (muted) {
	if (muted !== this.state.muted) {
		this.setState({
			muted: muted
		});
		this.emit('muted', this.state.muted);
	}
};
DesktopService.prototype.setMuted = function (muted) {
	muted = !!muted;
	var me = this;
	child_process.execFile('/usr/bin/osascript', ['-e', 'set volume output muted ' + (muted ? 'true' : 'false')], function (error, stdout, stderr) {
		me._muteChanged(muted);
	});
};

DesktopService.prototype.toggleMuted = function () {
	this.setMuted(!this.state.muted);
};

DesktopService.prototype.keypress = function (key) {
	robot.keyTap(key);
};

DesktopService.prototype.scroll = function (diff, timeSinceLastSpin) {
	let adiff = Math.abs(diff);
	let dy;
	if (timeSinceLastSpin <= 61) {
		if (adiff === 1) dy = 40;
		else if (adiff === 2) dy = 45;
		else if (adiff === 3) dy = 50;
		else if (adiff === 4) dy = 55;
		else dy = 60;
	} else if (timeSinceLastSpin <= 100) dy = 30;
	else if (timeSinceLastSpin <= 150) dy = 25;
	else if (timeSinceLastSpin <= 200) dy = 20;
	else if (timeSinceLastSpin <= 300) dy = 15;
	else if (timeSinceLastSpin <= 400) dy = 10;
	else dy = 5;
	
	if (diff > 0) {
		robot.scrollMouse(0, -dy * diff);
	} else {
		robot.scrollMouse(0, -dy * diff);
	}
};

module.exports = DesktopService;