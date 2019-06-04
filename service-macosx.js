var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var child_process = require('child_process');

function VolumeService(defaults) {
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

VolumeService.prototype = new Client();
VolumeService.prototype.constructor = Client;

VolumeService.id = function (config) {
	return config.host; //+':'+config.port;
};

VolumeService.prototype.connect = function () {
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

VolumeService.prototype.disconnect = function (options) {
	this.log('disconnecting...');
};

VolumeService.prototype.startMonitor = function () {
	this.stopMonitor();
	var me = this;
	
	this.monitor = setInterval(function () {
		console.log('interval');
		
		if (me.lastSetVolume && new Date().getTime() - me.lastSetVolume.getTime() < 2000) {
			// ignore
			console.log('ignore 1');
			return;
		}
		
		//console.log('volumeInterval...');
		
		me._getVolume(function (volume, volumePercent) {
			if (me.lastSetVolume && new Date().getTime() - me.lastSetVolume.getTime() < 2000) {
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
		
	}, 2000);
	
};

VolumeService.prototype.stopMonitor = function () {
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
	var me = this;
	child_process.execFile('/usr/bin/osascript', ['-e', 'get volume settings'], function (error, stdout, stderr) {
		if (error) {
			throw error;
		}
		
		//console.log('RAW:', stdout);
		
		var data = stdout.toString();
		var m = data.match(/output volume:(\d+),/);
		if (m) {
			var volume = parseInt(m[1]);
			//console.log('_getVolume', volume);
			callback(volume);
		} else {
			console.log('_getVolume error, no volume');
			callback();
		}
		
	});
};

VolumeService.prototype.getVolume = function (callback) {
	var me = this;
	this._getVolume(function (volume) {
		if (volume != me.state.volume) {
			me._setVolume(volume);
		}
		if (callback) callback(me.state.volume, me.state.volumePercent);
	});
};
VolumeService.prototype._setVolume = function (volume) {
	var volumePercent = volume / 100;
	this.setState({
		volumePercent: volumePercent,
		volume: volume
	});
	console.log('e v _setVolume', this.state.volumePercent, this.state.volume);
	this.emit('volume', this.state.volumePercent, this.state.volume);
};

VolumeService.prototype.setVolume = function (volume) {
	if (volume<this.state.minVolume) volume = this.state.minVolume;
	if (volume>this.state.maxVolume) volume = this.state.maxVolume;
	
	if (volume !== this.state.volume) {
		this._setVolume(volume);
		this._writeVolume();
	}
};

VolumeService.prototype._writeVolume = function () {
	if (this.isSettingVolume) {
		console.log('already isSettingVolume');
		return;
	}
	
	this.isSettingVolume = true;
	
	// volume = parseInt(volume);
	var me = this;
	//var volume = this._volumeQueued;
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
		
		//
		// var diff = Math.abs(me.state.volume - volume);
		//
		// if (diff >= 2) {
		// 	console.log('DIFF IS GREATER THAN 2 !!!! sending again !!!!!');
		// 	me._writeVolume();
		// }
		// else {
		// 	me.state.volumePercent = volume / 100;
		// 	me.state.volume = volume;
		// }
		
		me.lastSetVolume = new Date();
	});
};

VolumeService.prototype.changeVolume = function (diff) {
	var v = this.state.volume + diff;
	console.log('changing volume ...', this.state.volume, v);
	this.setVolume(v);
};

VolumeService.prototype.volumeUp = function () {
	this.changeVolume(this.state.volumeIncrement);
};
VolumeService.prototype.volumeDown = function () {
	this.changeVolume(-this.state.volumeIncrement);
};

VolumeService.prototype.getMuted = function (callback) {
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
		if (muted !== null) {
			me._muteChanged(muted);
		}
		if (callback) callback(muted);
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
	var me = this;
	child_process.execFile('/usr/bin/osascript', ['-e', 'set volume output muted ' + (muted ? 'true' : 'false')], function (error, stdout, stderr) {
		me._muteChanged(muted);
	});
};

VolumeService.prototype.toggleMuted = function () {
	this.setMuted(!this.state.muted);
};

module.exports = VolumeService;