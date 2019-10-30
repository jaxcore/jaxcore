const Spin = require('jaxcore-spin');
const DesktopService = require('./desktop-service-macosx');
const mouseAdapter = require('./adapters/mouse');
const keyboardAdapter = require('./adapters/keyboard');
const mediaVolumeAdapter = require('./adapters/media-volume');
const momentumScrollAdapter = require('./adapters/momentum-scroll');
const precisionScrollAdapter = require('./adapters/precision-scroll');

const Adapter = require('./adapter');
const testAdapter = require('./adapters/test');

function startSpinService(callback) {
	console.log('waiting for spin');
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

var adapterInitializers = {
	test: testAdapter
};

var adapters = {};

startSpinService(function(spin, desktop) {
	// if (!process.argv[2]) {
	// 	process.exit();
	// }
	console.log('starting', process.argv[2]);
	
	var adapterType = 'test';
	var deviceIds = {
		spin: spin.id,
		desktop: desktop.id
	};
	
	var adapterConfig = createOrGetAdapter(adapterType, deviceIds);
	
	var devices = {
		spin,
		desktop
	};
	
	console.log('ADAPTER:', adapterConfig);
	
	startTestAdapter(adapterConfig, devices);
	
	// startTestAdapter(spin, desktop);
});

function getAdapterSettings(type, id, deviceIds) {
	var adapterSettings = {}; // persistent adapter state
	return adapterSettings;
}



function createOrGetAdapter(adapterType, deviceIds) {
	var adapterId;
	for (var id in adapters) {
		var allMatch = true;
		for (var deviceType in adapters[id]) {
			if (!(adapters[id][deviceType].id in deviceIds)) {
				continue;
			}
		}
		if (allMatch) {
			adapterId = id;
			break;
		}
	}
	
	if (adapterId) {
		console.log('FOUND ADAPTER', adapterId);
	}
	else {
		console.log('DID NOT FIND ADAPTER', adapterType, deviceIds);
		adapterId = Math.random().toString().substring(2);
	}
	
	var adapterSettings = getAdapterSettings(adapterType, adapterId, deviceIds);
	
	adapters[adapterId] = {
		id: adapterId,
		type: adapterType,
		deviceIds,
		settings: adapterSettings
	};
	
	return adapters[adapterId];
}


function startTestAdapter(adapterConfig, devices) {
	console.log('startTestAdapter', adapterConfig);
	
	var adapterInitializer = adapterInitializers[adapterConfig.type];
	
	const adapterInstance = new Adapter(adapterConfig, theme, devices, adapterInitializer);
	
	
	adapterInstance.on('connect', function() {
		console.log('testAdapter connected');
	});
	adapterInstance.on('destroy', function() {
		console.log('testAdapter destroyed');
	});
	
	for (var i in devices) {
		(function(name) {
			devices[i].on('connect', function() {
				console.log('device',name,'connected');
			});
			devices[i].on('disconnect', function() {
				console.log('device',name,'disconnected');
				adapterInstance.destroy();
			});
		})(i);
	}
	
	// switch(process.argv[2]) {
	// 	case 'mouse': mouseAdapter(theme, devices); break;
	// 	case 'keyboard': keyboardAdapter(theme, devices); break;
	// 	case 'media': mediaVolumeAdapter(theme, devices); break;
	// 	case 'momentum': momentumScrollAdapter(theme, devices); break;
	// 	case 'precision': precisionScrollAdapter(theme, devices); break;
	// }
	
	return adapterInstance;
}

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}