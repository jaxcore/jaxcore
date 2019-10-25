var Spin = require('jaxcore-spin');
var DesktopService = require('./desktop-service-macosx');

function startSpinService() {
	Spin.connectBLE(function (spin) {
		console.log('connected BLE', spin.id);
		spin.setBrightness(2);
		startVolumeService(spin);
	});
}

function startVolumeService(spin) {
	var desktopService = new DesktopService({
		minVolume: 0,
		maxVolume: 100
	});
	
	desktopService.on('connect', function () {
		console.log('volume connected ', this.state.maxVolume);
		
		spinDesktopAdapter(spin, desktopService);
	});
	
	desktopService.connect();
}

function spinDesktopAdapter(spin, desktopService) {
	
	spin.flash([0, 255, 0]);
	
	desktopService.on('volume', function (volumePercent, volume) {
		console.log('desktopService ON volume', volumePercent, volume);
		spin.scale(volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
	});
	
	desktopService.on('muted', function (muted) {
		console.log('muted', muted);
		if (muted) {
			// spin.flash([255,255,0]);
			spin.scale(desktopService.state.volumePercent, [100, 100, 0], [255, 255, 0], [255, 255, 255]);
		} else {
			spin.scale(desktopService.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
		}
	});
	
	spin.on('rotate', function (diff, spinTime) {
		console.log('spin rotate', diff);
		
		if (spin.state.knobPushed) {
			
		}
		else if (spin.state.buttonPushed) {
			if (desktopService.state.muted) {
				// spin.dial(desktopService.state.volumePercent, [100, 100, 0], [255, 255, 0], [255, 255, 0]);
				spin.scale(desktopService.state.volumePercent, [100, 100, 0], [100, 100, 0], [255, 255, 255]);
			} else {
				desktopService.changeVolume(diff, spinTime);
			}
		}
		else {
			desktopService.scroll(diff, spinTime);
			
			if (diff > 0) {
				spin.rotate(1, [255, 0, 0], [255,0,0]);
			}
			else {
				spin.rotate(-1, [0,0,255], [0,0,255]);
			}
		}
	});
	
	spin.on('knob', function (pushed) {
		console.log('knob !!', pushed);
		if (pushed) {
			desktopService.toggleMuted();
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