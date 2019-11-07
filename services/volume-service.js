var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var child_process = require('child_process');

function VolumeService(defaults) {
	this.constructor();
	this.createStore('Volume Store', true);
	this.id = 'volume';
	this.log = plugin.createLogger('Volume');
	this.log('created');
	
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

VolumeService.prototype = new Client();
VolumeService.prototype.constructor = Client;

VolumeService.id = function() {
	return 'volume';
};

var volumeInstance = null;

VolumeService.getOrCreateInstance = function(serviceId, serviceConfig) {
	if (!volumeInstance) {
		console.log('CREATE VOLUME');
		volumeInstance = new VolumeService(serviceConfig);
	}
	else {
		console.log('RECONNECT VOLUME');
	}
	return volumeInstance;
};
VolumeService.destroyInstance = function(serviceId, serviceConfig) {
	if (volumeInstance) {
		volumeInstance.destroy();
		volumeInstance = null;
	}
};

VolumeService.prototype.connect = function () {
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

VolumeService.prototype.disconnect = function (options) {
	this.log('disconnecting...');
};

VolumeService.prototype.startMonitor = function () {
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

VolumeService.prototype.stopMonitor = function () {
	console.log('stop monitor');
	clearInterval(this.monitor);
};

// -- VOLUME ------------

VolumeService.prototype.setMinVolume = function (v) {
	this.setState({
		minVolume: v
	});
};

VolumeService.prototype.setMaxVolume = function (v) {
	this.setState({
		maxVolume: v
	});
};

VolumeService.prototype._getVolume = function (callback) {
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

VolumeService.prototype.getVolume = function (callback) {
	this._getVolume((volume) => {
		if (!this.lastVolumeTime || new Date().getTime() - this.lastVolumeTime > 500) {
			if (volume !== this.state.volume) {
				this._setVolume(volume);
			}
		}
		if (callback) callback(this.state.volume, this.state.volumePercent);
	});
};
VolumeService.prototype._setVolume = function (volume) {
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

VolumeService.prototype.setVolume = function (volume) {
	if (volume < this.state.minVolume) volume = this.state.minVolume;
	if (volume > this.state.maxVolume) volume = this.state.maxVolume;
	
	if (volume !== this.state.volume) {
		this.lastVolumeTime = new Date().getTime();
		this._setVolume(volume);
		this._writeVolume();
	}
};

VolumeService.prototype._writeVolume = function () {
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

VolumeService.prototype.changeVolume = function (diff) {
	// if (diff > 0) VolumeService.volumeUp();
	// else VolumeService.volumeDown();
	
	this.log('changing volume ...', this.state.volume, diff);
	var v = this.state.volume + diff;
	this.setVolume(v);
};

VolumeService.prototype.volumeUp = function () {
	this.changeVolume(this.state.volumeIncrement);
};
VolumeService.prototype.volumeDown = function () {
	this.changeVolume(-this.state.volumeIncrement);
};

VolumeService.prototype.getMuted = function (callback) {
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

VolumeService.prototype._muteChanged = function (muted) {
	if (muted !== this.state.muted) {
		this.setState({
			muted: muted
		});
		this.emit('muted', this.state.muted);
	}
};
VolumeService.prototype.setMuted = function (muted) {
	muted = !!muted;
	child_process.execFile('/usr/bin/osascript', ['-e', 'set volume output muted ' + (muted ? 'true' : 'false')], (error, stdout, stderr) => {
		this._muteChanged(muted);
	});
};

VolumeService.prototype.toggleMuted = function () {
	this.setMuted(!this.state.muted);
};

VolumeService.prototype.destroy = function () {
	this.emit('teardown');
	this.stopMonitor();
};

module.exports = VolumeService;

