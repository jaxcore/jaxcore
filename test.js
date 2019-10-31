const Spin = require('jaxcore-spin');
const DesktopService = require('./desktop-service-macosx');
const mouseAdapter = require('./adapters/mouse');
const keyboardAdapter = require('./adapters/keyboard');
const mediaAdapter = require('./adapters/media-volume');
const momentumScrollAdapter = require('./adapters/momentum-scroll');
const precisionScrollAdapter = require('./adapters/precision-scroll');
const Adapter = require('./adapter');
const testAdapter = require('./adapters/test');

const themes = {
	cyber: {
		low: [0,0,255],
		high: [255,0,0],
		middle: [255,255,255],
		primary: [255,0,255],
		secondary: [0,255,255],
		tertiary: [255,255,0],
		black: [0,0,0],
		white: [255,255,255]
	}
};

var adapterInitializers = {
	test: testAdapter,
	mouse: mouseAdapter,
	keyboard: keyboardAdapter,
	media: mediaAdapter,
	momentum: momentumScrollAdapter,
	precision: precisionScrollAdapter
};

var adapters = {};

function startDesktopService(callback) {
	var desktopService = new DesktopService({
		minVolume: 0,
		maxVolume: 100
	});
	
	desktopService.on('connect', function () {
		console.log('volume connected ', this.state.maxVolume);
		
		callback(desktopService);
	});
	
	desktopService.connect();
}

var services = {
	desktop: null
};

startDesktopService(function(desktop) {
	console.log('DESKTOP SERVICE');
	services.desktop = desktop;
	
	beginSpinService();
});

function beginSpinService() {
	console.log('waiting for spin');
	Spin.connectBLE(function (spin) {
		console.log('connected BLE', spin.id);
		
		// spinSettings[id].brightness
		
		spin.setBrightness(5);
		
		// if (!process.argv[2]) {
		// 	process.exit();
		// }
		// console.log('starting', process.argv[2]);
		
		var adapterConfig = findSpinAdapter(spin);
		if (adapterConfig) {
			relaunchAdapter(adapterConfig, spin);
		}
		else {
			console.log('DID NOT FIND ADAPTER FOR:', spin.id);
			
			createAdapter(spin, 'precision', {});
			
		}
		
		// startTestAdapter(spin, desktop);
	});
}

function findSpinAdapter(spin) {
	var adapterId;
	for (var id in adapters) {
		if (adapters[id].deviceIds.spin === spin.id) {
			adapterId = id;
			console.log('FOUND ADAPTER', adapterId);
			return adapters[id];
		}
		
		// for (var deviceType in adapters[id]) {
		// 	if (!(adapters[id][deviceType].id in deviceIds)) {
		// 		continue;
		// 	}
		// }
		// if (allMatch) {
		// 	adapterId = id;
		// 	break;
		// }
	}
	
}

// function getAdapterSettings(type, id, deviceIds) {
// 	var adapterSettings = {}; // persistent adapter state
// 	return adapterSettings;
// }

function getServiceForAdapter(adapterConfig) {
	if (adapterConfig.type === 'desktop' ||
		adapterConfig.type === 'mouse' ||
		adapterConfig.type === 'keyboard' ||
		adapterConfig.type === 'media' ||
		adapterConfig.type === 'momentum' ||
		adapterConfig.type === 'precision' ||
		adapterConfig.type === 'test') {
		return {
			desktop: services.desktop
		}
	}
}

function relaunchAdapter(adapterConfig, spin) {
	console.log('relaunchAdapter', adapterConfig);
	
	var devices = {
		spin
	};
	
	var service = getServiceForAdapter(adapterConfig);
	if (!service) {
		console.log('no service for adapter', adapterConfig);
		process.exit();
	}
	for (var i in service) {
		devices[i] = service[i];
	}
	
	console.log('RELAUNCH ADAPTER:', adapterConfig);
	startAdapter(adapterConfig, devices);
}

function createAdapter(spin, adapterType, adapterSettings) {
	console.log('CREATING ADAPTER:', spin.id, adapterType, adapterSettings);
	var adapterId = Math.random().toString().substring(2);
	adapters[adapterId] = {
		id: adapterId,
		type: adapterType,
		deviceIds: {
			spin: spin.id
		},
		settings: adapterSettings,
		theme: 'cyber'
		// settings: adapterSettings
	};
	
	var devices = {
		spin
	};
	
	var service = getServiceForAdapter(adapters[adapterId]);
	if (!service) {
		console.log('no service for adapter', adapterConfig);
		process.exit();
	}
	for (var i in service) {
		if (adapters[adapterId].deviceIds) {
			adapters[adapterId].deviceIds[i] = service[i].id;
		}
		else {
			console.log('no deviceIds');
			process.exit();
		}
		devices[i] = service[i];
	}
	
	console.log('CREATED ADAPTER:', adapters[adapterId], Object.keys(devices));
	startAdapter(adapters[adapterId], devices);
}

function startAdapter(adapterConfig, devices) {
	console.log('Starting Adapter:', adapterConfig);
	
	var adapterInitializer = adapterInitializers[adapterConfig.type];
	
	const adapterInstance = new Adapter(adapterConfig, themes[adapterConfig.theme], devices, adapterInitializer);
	
	adapterConfig.instance = adapterInstance;
	
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
				delete adapterConfig.instance;
			});
		})(i);
	}
	return adapterInstance;
}

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}