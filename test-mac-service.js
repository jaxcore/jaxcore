var Spin = require('jaxcore-spin');
var MacVolumeService = require('./service-mac');

Spin.connectBLE(function (spin) {
	
	var systemVolume = new MacVolumeService({
		minVolume: 0,
		maxVolume: 100
	});
	
	systemVolume.on('volume', function(volumePercent, volume) {
		console.log('volume', volumePercent, volume);
		spin.dial(volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
	});
	systemVolume.on('muted', function(muted) {
		console.log('muted', muted);
		if (muted) {
			// spin.flash([255,255,0]);
			spin.dial(systemVolume.state.volumePercent, [100,100,0], [255, 255, 0], [255, 255, 0]);
		}
		else {
			spin.dial(systemVolume.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
		}
	});
	systemVolume.on('connect', function() {
		console.log('volume connected ', this.state.maxVolume);
		
		spin.flash([0, 255, 0]);
	});
	systemVolume.connect();
	
	console.log('ble spin connected', spin.id);
	
	spin.on('spin', function (direction) {
		console.log('spin rotate', direction);
		
		if (systemVolume.state.muted) {
			spin.dial(systemVolume.state.volumePercent, [100,100,0], [255, 255, 0], [255, 255, 0]);
		}
		else {
			if (direction === 1) systemVolume.volumeUp();
			else systemVolume.volumeDown();
		}
	});
	
	spin.on('knob', function (pushed) {
		console.log('knob !!', pushed);
	});
	
	spin.on('button', function (pushed) {
		if (pushed) {
			console.log('button !!', pushed);
			systemVolume.toggleMuted();
		}
	});
	
});