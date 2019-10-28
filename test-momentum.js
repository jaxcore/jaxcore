const Spin = require('jaxcore-spin');
const DesktopService = require('./desktop-service-macosx');
const momentumScrollAdapter = require('./adapters/momentum-scroll');
const precisionScrollAdapter = require('./adapters/precision-scroll');
const mediaVolumeAdapter = require('./adapters/media-volume');

function startSpinService(callback) {
	Spin.connectBLE(function (spin) {
		console.log('connected BLE', spin.id);
		spin.setBrightness(2);
		startDesktopService(spin, callback);
	});
}

function startDesktopService(spin, callback) {
	var desktopService = new DesktopService({
		minVolume: 0,
		maxVolume: 100
	});
	
	desktopService.on('connect', function () {
		console.log('volume connected ', this.state.maxVolume);
		
		callback(spin, desktopService);
	});
	
	desktopService.connect();
}

startSpinService(function(spin, desktopService) {
	console.log('starting');
	momentumScrollAdapter(spin, desktopService);
	// precisionScrollAdapter(spin, desktopService);
	// mediaVolumeAdapter(spin, desktopService);
});


if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}