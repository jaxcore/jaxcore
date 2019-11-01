const Spin = require('jaxcore-spin');

const DesktopService = require('./desktop-service-macosx');

const mouseAdapter = require('./adapters/mouse');
const keyboardAdapter = require('./adapters/keyboard');
const mediaAdapter = require('./adapters/media-volume');
const momentumScrollAdapter = require('./adapters/momentum-scroll');
const precisionScrollAdapter = require('./adapters/precision-scroll');
const testAdapter = require('./adapters/test');

const Adapter = require('./adapter');

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
const defaultTheme = 'cyber';

const adapters = {};
// {
// 	id: adapterId,
// 	type: adapterType,
// 	deviceIds: {
// 		spin: spin.id
// 	},
// 	serviceIds: {
//		desktop: 'desktop'
// 	},
// 	settings: {},
// 	theme: 'cyber'
// }

const allServices = {};
// {
// 	desktop: {
// 		desktop {
// 			instance,
// 			adapters:[]
// 		}
// 	}
// }

const serviceClasses = {
	desktop: DesktopService
};

const adapterInitializers = {
	test: testAdapter,
	mouse: mouseAdapter,
	keyboard: keyboardAdapter,
	media: mediaAdapter,
	momentum: momentumScrollAdapter,
	precision: precisionScrollAdapter
};

let defaultAdapter = process.argv[2];

function beginSpinService() {
	console.log('waiting for spin');
	Spin.connectBLE(function (spin) {
		console.log('connected BLE', spin.id);
		spin.setBrightness(5);
		
		const adapterConfig = findSpinAdapter(spin);
		if (adapterConfig) {
			relaunchAdapter(adapterConfig, spin);
		}
		else {
			console.log('DID NOT FIND ADAPTER FOR:', spin.id);
			
			if (defaultAdapter) {
				createAdapter(spin, defaultAdapter, {});
			}
		}
	});
}

function findSpinAdapter(spin) {
	let adapterId;
	for (let id in adapters) {
		if (adapters[id]) {
			if (adapters[id].destroyed) {
				console.log('adapter', id, 'was destroyed');
				// process.exit();
				delete adapters[id].destroyed;
			}
			if (adapters[id].deviceIds.spin === spin.id) {
				adapterId = id;
				console.log('FOUND ADAPTER', adapterId);
				return adapters[id];
			}
		}
	}
}

function getOrCreateService(adapterConfig, serviceType, serviceConfig, callback) {
	console.log('start/get '+serviceType + ' service', 'serviceConfig:', serviceConfig);
	// process.exit();
	
	const serviceClass = serviceClasses[serviceType];
	const serviceId = serviceClass.id(serviceConfig);
	
	if (!allServices[serviceType]) allServices[serviceType] = {};
	
	console.log('start/get');
	
	if (serviceId && allServices[serviceType][serviceId] && allServices[serviceType][serviceId].instance) {
		allServices[serviceType][serviceId].adapters.push(adapterConfig.id);
		adapterConfig.serviceIds[serviceType] = serviceId;
		
		callback(allServices[serviceType][serviceId].instance);
	}
	else {
		console.log('service does not exist', serviceId, serviceType);
		console.log(allServices[serviceType][serviceId]);
		
		let serviceInstance = serviceClass.getOrCreateInstance(serviceId, serviceConfig);
		
		console.log('got serviceInstance', serviceInstance);
		
		if (serviceInstance && serviceInstance.id === serviceId) {
			if (!allServices[serviceType][serviceId]) {
				allServices[serviceType][serviceId] = {
					serviceConfig,
					instance: serviceInstance,
					adapters: []
				};
			}
			allServices[serviceType][serviceId].adapters.push(adapterConfig.id);
			adapterConfig.serviceIds[serviceType] = serviceId;
			
		}
		else {
			console.log('no service instance found', serviceType, serviceId);
			process.exit();
		}
		
		if (serviceInstance.state.connected) {
			console.log('service already connected', serviceType, serviceId);
			process.exit();
			callback(serviceInstance);
		} else {
			console.log('waiting for service to connect', serviceType, serviceId);
			serviceInstance.on('connect', function () {
				console.log(serviceType + ' service connected');
				callback(serviceInstance);
			});
			serviceInstance.on('disconnect', function () {
				console.log(serviceType + ' service disconnected');
				destroyService(serviceType, serviceId);
			});
			serviceInstance.connect();
		}
	}
}

function getServicesForAdapter(adapterConfig, callback) {
	if (adapterConfig.type === 'mouse' ||
		adapterConfig.type === 'keyboard' ||
		adapterConfig.type === 'media' ||
		adapterConfig.type === 'momentum' ||
		adapterConfig.type === 'precision' ||
		adapterConfig.type === 'test') {
		
		let serviceConfig = {
			minVolume: 0,
			maxVolume: 100
		};
		
		console.log('getOrCreateService');
		getOrCreateService(adapterConfig, 'desktop', serviceConfig, function(serviceInstance) {
			if (serviceInstance) {
				console.log('serviceInstance');
				callback({
					desktop: serviceInstance
				});
			}
			else {
				console.log('no service for', adapterConfig, serviceConfig);
				callback()
			}
		});
	}
	else {
		console.log('no service for adapter', adapterConfig);
		callback();
	}
}

function relaunchAdapter(adapterConfig, spin) {
	console.log('RELAUNCHING ADAPTER', adapterConfig, spin.id);
	
	getServicesForAdapter(adapterConfig, function(services) {
		if (!services) {
			console.log('relaunchAdapter: no service for adapter', adapterConfig);
			process.exit();
		}
		
		console.log('RELAUNCH ADAPTER:', adapterConfig);
		startSpinAdapter(adapterConfig, spin, services);
	});
}

function createAdapter(spin, adapterType, adapterSettings) {
	console.log('CREATING ADAPTER:', spin.id, adapterType, adapterSettings);
	const adapterId = Math.random().toString().substring(2);
	adapters[adapterId] = {
		id: adapterId,
		type: adapterType,
		deviceIds: {
			spin: spin.id
		},
		serviceIds: {},
		settings: adapterSettings,
		theme: defaultTheme
		// settings: adapterSettings
	};
	
	const adapterConfig = adapters[adapterId];
	
	getServicesForAdapter(adapterConfig, function(services) {
		if (!services) {
			console.log('createAdapter: no service for adapter', adapterConfig);
			process.exit();
		}
		
		let serviceTypes = Object.keys(services);
		
		console.log('CREATED ADAPTER:', adapterConfig, 'services:', serviceTypes);
		
		startSpinAdapter(adapters[adapterId], spin, services);
	});
}

function startSpinAdapter(adapterConfig, spin, services) {
	console.log('Starting Adapter:', adapterConfig);
	
	const devices = {
		spin
	};
	
	for (let serviceType in services) {
		if (adapterConfig.serviceIds) {
			adapterConfig.serviceIds[serviceType] = services[serviceType].id
		}
		else {
			console.log('no service serviceIds');
			process.exit();
		}
	}
	
	console.log('adapterConfig', adapterConfig);
	console.log('adapter devices', Object.keys(devices));
	console.log('adapter services', Object.keys(services));
	
	const adapterInitializer = adapterInitializers[adapterConfig.type];
	
	const adapterInstance = new Adapter(adapterConfig, themes[adapterConfig.theme], devices, services, adapterInitializer);
	
	adapterConfig.instance = adapterInstance;
	
	let onDisconnect = function() {
		console.log('device disconnected, destroying adapter....', adapterConfig);
		destroyAdapter(adapterConfig);
		this.removeListener('disconnect', onDisconnect);
	};
	
	// adapterInstance.on('teardown', function() {
	// 	console.log('adapter teardown');
	// 	// device.removeListener('disconnect', onDisconnect);
	// });
	
	for (let i in devices) {
		(function(id) {
			devices[id].addListener('disconnect', onDisconnect);
		})(i);
	}
	return adapterInstance;
}

function destroyService(serviceType, serviceId) {
	
	if (allServices[serviceType][serviceId]) {
		console.log('destroying service', serviceType, serviceId);
		
		let onDestroyService = function () {
			allServices[serviceType][serviceId].adapters.forEach(function (adapterId) {
				const adapterConfig = adapters[adapterId];
				destroyAdapter(adapterConfig);
			});
			console.log('clearout', allServices[serviceType][serviceId]);
			
			allServices[serviceType][serviceId].instance.removeListener('teardown', onDestroyService);
			delete allServices[serviceType][serviceId].instance;
			delete allServices[serviceType][serviceId].adapters;
			delete allServices[serviceType][serviceId];
		};
		
		allServices[serviceType][serviceId].instance.addListener('teardown', onDestroyService);
		
		allServices[serviceType][serviceId].instance.destroy();
	}
	else console.log('destroyService failed, not found', serviceType, serviceId);
}

function destroyAdapter(adapterConfig) {
	if (adapterConfig.destroyed) {
		console.log('adapter destroyed');
		return;
	}
	
	const adapterId = adapterConfig.id;
	console.log('destroyAdapter', adapterId, adapterConfig);
	
	if (adapterConfig.instance) {
		adapterConfig.instance.destroy();
		delete adapterConfig.instance;
		adapterConfig.destroyed = true;
		
		for (let serviceType in adapterConfig.serviceIds) {
			let serviceId = adapterConfig.serviceIds[serviceType];
			let index = allServices[serviceType][serviceId].adapters.indexOf(adapterId);
			allServices[serviceType][serviceId].adapters.splice(index, 1);
			console.log('service adapter Ids', allServices[serviceType][serviceId].adapters);
		}
	}
}

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}

beginSpinService();
