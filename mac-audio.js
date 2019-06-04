var net = require('net');
var EventEmitter = require('events');
var child_process = require('child_process');

function Device(config) {
	this.constructor();
	
	this.description = {};
	
	this.state = {
		volume: null,       // 0 - 100
		volumePercent: null, // 0.0 - 1.0
		muted: null,		// bool
	};
	this.settings = {
		maxVolume: 100,
		minVolume: 0,
		volumeInc: 1
	};
	
	this.lastSetVolume = null;
	this.isSettingVolume = false;
	this._volumeQueued = null;
	
	if (config) {
		this.configure(config);
	}
}

Device.prototype = new EventEmitter();
Device.prototype.constructor = EventEmitter;

Device.prototype.configure = function (config) {
	this.config = config;
	if (config.maxVolume) {
		this.settings.maxVolume = config.maxVolume;
	}
};

Device.prototype.connect = function () {
	var me = this;
	
	me.lastSetVolume = new Date();
	
	me.getVolume(function() {
		console.log('systemaudio: volume', me.state.volume);
		me.getMuted(function() {
			console.log('systemaudio: muted', me.state.muted);
			
			me.startMonitor();
			console.log('systemaudio: connected');
			me.emit('connect');
		});
	});
};

Device.prototype.startMonitor = function () {
	this.stopMonitor();
	var me = this;
	
	// this.monitor = setInterval(function() {
	//
	// 	var diff = new Date().getTime() - me.lastSetVolume.getTime();
	//
	// 	if (diff < 2000) {
	// 		console.log('set volume recently');
	// 		return;
	// 	}
	//
	// 	me.getVolume();
	//
	//
	// },1000);
	
	this.monitor = setInterval(function() {
		console.log('interval');
		
		if (me.lastSetVolume && new Date().getTime() - me.lastSetVolume.getTime() < 2000) {
			// ignore
			console.log('ignore 1');
			return;
		}
		
		//console.log('volumeInterval...');
		
		me._getVolume(function(volume, volumePercent) {
			if (me.lastSetVolume && new Date().getTime() - me.lastSetVolume.getTime() < 2000) {
				// ignore
				console.log('ignore 2');
				return;
			}
			var diff = Math.abs(me.state.volume - volume);
			if (diff > 1) {
				console.log('volume was changed externally', volume);
				
				var volumePercent = volume / 100;
				me.state.volume = volume;
				me.state.volumePercent = volumePercent;
				
				console.log('e v monitor',volumePercent,volume);
				me.emit('volume',volumePercent,volume);
			}
			
		});
		
		me.getMuted();
		
	},2000);
	
};
Device.prototype.stopMonitor = function () {
	clearInterval(this.monitor);
};

Device.prototype.disconnect = function () {

};

Device.prototype.write = function (d) {

};

// -- VOLUME ------------

Device.prototype._getVolume = function (callback) {
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
		}
		else {
			console.log('_getVolume error, no volume');
			callback();
		}
		
	});
};

Device.prototype.getVolume = function (callback) {
	var me = this;
	this._getVolume(function(volume) {
		if (volume != me.state.volume) {
			me._setVolume(volume);
		}
		if (callback) callback(me.state.volume, me.state.volumePercent);
	});
};
Device.prototype._setVolume = function (volume) {
	var volumePercent = volume / 100;
	this.state.volumePercent = volumePercent;
	this.state.volume = volume;
	console.log('e v _setVolume',this.state.volumePercent, this.state.volume);
	this.emit('volume', this.state.volumePercent, this.state.volume);
};

Device.prototype.setVolume = function (volume, callback) {
	// if (this.isSettingVolume) {
	// 	console.log('isSettingVolume, skipping to ' + volume);
	// 	return;
	// }
	
	// this._volumeQueued = volume;
	//
	// if (this.isSettingVolume) {
	// 	console.log('isSettingVolume' + volume);
	// 	return;
	// }
	//
	// this.isSettingVolume = true;
	//
	// var volumePercent = volume / 100;
	//
	// this.state.volumePercent = volumePercent;
	// this.state.volume = volume;
	//
	// console.log('e v setVolume', volumePercent, volume);
	// this.emit('volume', volumePercent, volume);
	//
	//
	
	this._setVolume(volume);
	
	//spinServer.broadcastScalar(volume / 100);
	
	this._writeVolume();
};

Device.prototype._writeVolume = function () {
	if (this.isSettingVolume) {
		console.log('already isSettingVolume');
		return;
	}
	
	this.isSettingVolume = true;
	
	// volume = parseInt(volume);
	var me = this;
	//var volume = this._volumeQueued;
	var volume = this.state.volume;
	console.log('_writeVolume',volume);
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

Device.prototype.changeVolume = function (float) {
	var v = this.state.volume + float;
	console.log('changing volume ...', this.state.volume, v);
	this.setVolume(v);
};

Device.prototype.volumeUp = function () {
	this.changeVolume(this.settings.volumeInc);
};
Device.prototype.volumeDown = function () {
	this.changeVolume(-this.settings.volumeInc);
};

Device.prototype.getMuted = function (callback) {
	var me = this;
	child_process.execFile('/usr/bin/osascript', ['-e', 'output muted of (get volume settings)'], function (error, stdout, stderr) {
		var data = stdout.toString().trim();
		
		var muted = null;
		if (data == 'true') {
			muted = true;
		}
		else if (data == 'false') {
			muted = false;
		}
		else {
			console.log('getMuted error: [['+data+']]');
			return;
		}
		
		if (muted!=null && me.state.muted != muted) {
			me.state.muted = muted;
			me.emit('muted', me.state.muted);
		}
		
		if (callback) callback(muted);
	});
};

Device.prototype.setMuted = function (muted) {
	muted = !!muted;
	var me = this;
	child_process.execFile('/usr/bin/osascript', ['-e', 'set volume output muted ' + (muted ? 'true' : 'false')], function (error, stdout, stderr) {
		me.state.muted = muted;
		me.emit('muted', muted);
	});
};

Device.prototype.toggleMuted = function () {
	this.setMuted(!this.state.muted);
};


// Linux
//
// const spawn = require('child_process').spawn;
//
// const defaultOptions = {
// 	shell: true
// };
//
// exports.getVolume =  () => {
// 	return new Promise((resolve, reject) => {
// 		try {
// 			const command = "amixer get Master | awk '$0~/%/{print $4}' | tr -d '[]%'"
// 			const ls = spawn(command, [], defaultOptions);
// 			ls.stdout.on('data', (volume) => {
// 				resolve(parseInt(volume));
// 			});
// 		}
// 		catch (ex) {
// 			reject(ex);
// 		}
// 	});
// };
//
//
// exports.setVolume = (newVolume) => {
// 	return new Promise((resolve, reject) => {
// 		try {
// 			const command = 'amixer set Master ' + newVolume +'%';
//
// 			spawn(command, [], defaultOptions);
// 			resolve(true);
// 		}
// 		catch (ex) {
// 			reject(ex);
// 		}
// 	});
// }

module.exports = Device;