const Spin = require('jaxcore-spin');
const DesktopService = require('./desktop-service-macosx');
const mouseAdapter = require('./adapters/mouse');
const keyboardAdapter = require('./adapters/keyboard');
const mediaVolumeAdapter = require('./adapters/media-volume');
const momentumScrollAdapter = require('./adapters/momentum-scroll');
const precisionScrollAdapter = require('./adapters/precision-scroll');

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

const theme = {
	low: [0,0,255],
	high: [255,0,0],
	middle: [255,255,255],
	primary: [255,0,255],
	secondary: [0,255,255],
	tertiary: [255,255,0],
	black: [0,0,0],
	white: [255,255,255]
};

startSpinService(function(spin, desktop) {
	if (!process.argv[2]) {
		process.exit();
	}
	console.log('starting', process.argv[2]);
	
	const devices = {
		spin,
		desktop
	};
	
	switch(process.argv[2]) {
		case 'mouse': mouseAdapter(theme, devices); break;
		case 'keyboard': keyboardAdapter(theme, devices); break;
		case 'media': mediaVolumeAdapter(theme, devices); break;
		case 'momentum': momentumScrollAdapter(theme, devices); break;
		case 'precision': precisionScrollAdapter(theme, devices); break;
	}
	
});

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}