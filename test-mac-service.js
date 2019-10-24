var Spin = require('jaxcore-spin');
var MacVolumeService = require('./service-macosx');

function startSpinService() {
	Spin.connectBLE(function (spin) {
		
		console.log('connected BLE');
		
		console.log('ble spin connected', spin.id);
		
		startVolumeService(spin);
	});
}

function startVolumeService(spin) {
	var systemVolume = new MacVolumeService({
		minVolume: 0,
		maxVolume: 100
	});
	
	systemVolume.on('connect', function () {
		console.log('volume connected ', this.state.maxVolume);
		
		spinVolumeAdapter(spin, systemVolume);
	});
	systemVolume.connect();
}

function spinVolumeAdapter(spin, volume) {
	
	spin.flash([0, 255, 0]);
	
	volume.on('volume', function (volumePercent, volume) {
		console.log('volume', volumePercent, volume);
		spin.scale(volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
	});
	volume.on('muted', function (muted) {
		console.log('muted', muted);
		if (muted) {
			// spin.flash([255,255,0]);
			spin.scale(volume.state.volumePercent, [100, 100, 0], [255, 255, 0], [255, 255, 0]);
		} else {
			spin.scale(volume.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
		}
	});
	
	spin.on('spin', function (direction) {
		console.log('spin rotate', direction);
		
		if (volume.state.muted) {
			spin.dial(volume.state.volumePercent, [100, 100, 0], [255, 255, 0], [255, 255, 0]);
		} else {
			if (direction === 1) volume.volumeUp();
			else volume.volumeDown();
		}
	});
	
	spin.on('knob', function (pushed) {
		console.log('knob !!', pushed);
		if (pushed) {
			volume.toggleMuted();
		}
	});
	
	spin.on('button', function (pushed) {
		console.log('button !!', pushed);
	});
}

startSpinService();


if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}