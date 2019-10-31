var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var child_process = require('child_process');
var robot = require("robotjs");

function DesktopService(defaults) {
	this.constructor();
	this.createStore('System Volume Store', true);
	this.id = 'desktop';
	this.log = plugin.createLogger('Desktop');
	
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

DesktopService.prototype.connect = function () {
	// this.lastSetVolume = new Date();
	this.getVolume(() => {
		this.log('systemaudio: volume', this.state.volume);
		this.getMuted(() => {
			this.log('systemaudio: muted', this.state.muted);
			
			this.startMonitor();
			this.setState({
				connected: true
			});
			this.log('systemaudio: connected');
			this.emit('connect');
		});
	});
};

DesktopService.prototype.disconnect = function (options) {
	this.log('disconnecting...');
};

DesktopService.prototype.startMonitor = function () {
	this.readInterval = 500;
	
	this.stopMonitor();
	
	this.monitor = setInterval(() => {
		if (this.lastSetVolume && new Date().getTime() - this.lastSetVolume.getTime() < this.readInterval) {
			this.log('ignore 1');
			return;
		}
		this.getVolume((volume, volumePercent) => {
			// this.log('monitor volume', volume);
			// if (this.lastSetVolume && new Date().getTime() - this.lastSetVolume.getTime() < this.readInterval*2) {
			// 	// ignore
			// 	this.log('ignore 2');
			// 	return;
			// }
			//
			// this._setVolume(volume);
			
			// if (!this.lastSetVolume) {
			//
			// 	return;
			// }
			//
			// var diff = Math.abs(this.state.volume - volume);
			// if (diff > 100) {
			// 	this.log('volume was changed externally', volume);
			// 	this._setVolume(volume);
			// }
		});
		this.getMuted();
	}, this.readInterval);
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
	child_process.execFile('/usr/bin/osascript', ['-e', 'get volume settings'], (error, stdout, stderr) => {
		if (error) {
			throw error;
		}
		var data = stdout.toString();
		var m = data.match(/output volume:(\d+),/);
		if (m) {
			var volume = parseInt(m[1]);
			callback(volume);
		} else {
			this.log('_getVolume error, no volume');
			callback();
		}
		
	});
};

DesktopService.prototype.getVolume = function (callback) {
	this._getVolume((volume) => {
		if (!this.lastVolumeTime || new Date().getTime() - this.lastVolumeTime > 500) {
			if (volume !== this.state.volume) {
				this._setVolume(volume);
			}
		}
		if (callback) callback(this.state.volume, this.state.volumePercent);
	});
};
DesktopService.prototype._setVolume = function (volume) {
	var volumePercent = volume / 100;
	this.setState({
		volumePercent: volumePercent,
		volume: volume
	});
	this.log('_setVolume', this.state.volume, this.state.volumePercent);
	if (!this.state.muted) {
		this.emit('volume', this.state.volumePercent, this.state.volume);
	}
};

DesktopService.prototype.setVolume = function (volume) {
	if (volume < this.state.minVolume) volume = this.state.minVolume;
	if (volume > this.state.maxVolume) volume = this.state.maxVolume;
	
	if (volume !== this.state.volume) {
		this.lastVolumeTime = new Date().getTime();
		this._setVolume(volume);
		this._writeVolume();
	}
};

DesktopService.prototype._writeVolume = function () {
	if (this.isSettingVolume) {
		this.log('already isSettingVolume');
		return;
	}
	
	this.isSettingVolume = true;
	var volume = this.state.volume;
	this.log('_writeVolume', volume);
	this.isSettingVolume = true;
	child_process.execFile('/usr/bin/osascript', ['-e', 'set volume output volume ' + volume.toString()], (error, stdout, stderr) => {
		this.isSettingVolume = false;
		
		this.log('wroteVolume ' + volume + ' _volumeQueued = ' + this.state.volume, stdout.toString());
		
		if (volume !== this.state.volume) {
			this.log('_writeVolume and wroteVolume do NOT MATCH');
			this._writeVolume();
		}
		this.lastSetVolume = new Date();
	});
};

DesktopService.prototype.changeVolume = function (diff) {
	// if (diff > 0) desktopService.volumeUp();
	// else desktopService.volumeDown();
	var v = this.state.volume + diff;
	this.log('changing volume ...', this.state.volume, v);
	this.setVolume(v);
};

DesktopService.prototype.volumeUp = function () {
	this.changeVolume(this.state.volumeIncrement);
};
DesktopService.prototype.volumeDown = function () {
	this.changeVolume(-this.state.volumeIncrement);
};

DesktopService.prototype.getMuted = function (callback) {
	child_process.execFile('/usr/bin/osascript', ['-e', 'output muted of (get volume settings)'], (error, stdout, stderr) => {
		if (this.lastVolumeTime && new Date().getTime() - this.lastVolumeTime > 500) {
			var data = stdout.toString().trim();
			
			var muted = null;
			if (data === 'true') {
				muted = true;
			} else if (data === 'false') {
				muted = false;
			} else {
				this.log('getMuted error: [[' + data + ']]');
				return;
			}
			this._muteChanged(muted);
			if (callback) callback(muted);
		}
		else if (callback) callback(this.state.muted);
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
	child_process.execFile('/usr/bin/osascript', ['-e', 'set volume output muted ' + (muted ? 'true' : 'false')], (error, stdout, stderr) => {
		this._muteChanged(muted);
	});
};

DesktopService.prototype.toggleMuted = function () {
	this.setMuted(!this.state.muted);
};

DesktopService.prototype.moveMouse = robot.moveMouse.bind(robot);
DesktopService.prototype.dragMouse = robot.dragMouse.bind(robot);
DesktopService.prototype.mouseToggle = robot.mouseToggle.bind(robot);
DesktopService.prototype.mouseClick = robot.mouseClick.bind(robot);
DesktopService.prototype.getMousePos = robot.getMousePos.bind(robot);
DesktopService.prototype.getScreenSize = robot.getScreenSize.bind(robot);

DesktopService.prototype.keyPress = function(k, modifiers) {
	this.log('keyPress', k, modifiers);
	if (modifiers && modifiers.length) robot.keyTap(k, modifiers);
	else robot.keyTap(k);
};
DesktopService.prototype.keyPressMultiple = function(spin, number, k, modifiers) {
	this.log('keyPressMultiple', 'number', number, 'key', k, 'modifiers', modifiers);
	for (let i=0;i<number;i++) {
		if (modifiers && modifiers.length) robot.keyTap(k, modifiers);
		else robot.keyTap(k);
	}
};

DesktopService.prototype.keyToggle = robot.keyToggle.bind(robot);

DesktopService.prototype.precisionScrollX = function (distance) {
	robot.scrollMouse(-distance, 0);
};
DesktopService.prototype.precisionScrollY = function (distance) {
	robot.scrollMouse(0, -distance);
};

DesktopService.prototype.scrollVertical = function (diff) {
	robot.scrollMouse(0, -diff);
};
DesktopService.prototype.scrollHorizontal = function (diff) {
	robot.scrollMouse(-diff, 0);
};

DesktopService.prototype.destroy = function () {
	this.removeAllListners();
};

module.exports = DesktopService;

