const plugin = require('jaxcore-plugin');
var Client = plugin.Client;
const Adapter = require('./adapter');
const themes = require('./themes');
const async = require('async');

const defaultAdapter = null; //process.argv[2];
const defaultTheme = 'cyber';

function Jaxcore() {
	this.constructor();
	this.log = plugin.createLogger('Jaxcore');
	this.setStore(plugin.createStore('Jaxcore Store'));
	this.setState({
		id: 'jaxcore',
		devices: {},
		adapters: {},
		services: {}
	});
	
	this.adapterInstances = {};
	this.serviceInstances = {};
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
	
	// {
	// 	desktop: {
	// 		desktop {
	// 			instance,
	// 			adapters:[]
	// 		}
	// 	}
	// }
	
	this.deviceClasses = {};
	this.serviceClasses = {};
	this.adapterInitializers = {};
}
Jaxcore.prototype = new Client();
Jaxcore.prototype.constructor = Client;
Jaxcore.prototype.addDevice = function(deviceType, deviceClass) {
	this.deviceClasses[deviceType] = deviceClass;
};
Jaxcore.prototype.addService = function(serviceType, serviceClass) {
	this.serviceClasses[serviceType] = serviceClass;
};
Jaxcore.prototype.addAdapter = function(adapterType, adapterInitializer) {
	this.adapterInitializers[adapterType] = adapterInitializer;
};

Jaxcore.prototype.beginSpinService = function(spinIds) {
	console.log('waiting for spin');
	const Spin = this.deviceClasses.spin;
	if (!spinIds || spinIds.length===0) spinIds = [];
	Spin.connectBLE(spinIds, (spin) => {
		console.log('connected BLE', spin.id);
		spin.setBrightness(5);
		
		const adapterConfig = this.findSpinAdapter(spin);
		if (adapterConfig) {
			this.relaunchAdapter(adapterConfig, spin);
		}
		else {
			console.log('DID NOT FIND ADAPTER FOR:', spin.id);
			
			if (defaultAdapter) {
				this.createAdapter(spin, defaultAdapter, {});
			}
		}
	});
};

Jaxcore.prototype.findSpinAdapter = function(spin) {
	console.log('findSpinAdapter');
	let adapterId;
	for (let id in this.state.adapters) {
		if (this.state.adapters[id]) {
			console.log('usage 1');
			if (this.state.adapters[id].destroyed) {
				console.log('adapter', id, 'was destroyed');
				// process.exit();
				delete this.state.adapters[id].destroyed;
			}
			if (this.state.adapters[id].deviceIds.spin === spin.id) {
				adapterId = id;
				console.log('FOUND ADAPTER', adapterId);
				return this.state.adapters[id];
			}
		}
	}
};

Jaxcore.prototype.getOrCreateService = function(adapterConfig, serviceType, serviceConfig, callback) {
	this.log('start/get '+serviceType + ' service', 'serviceConfig:', serviceConfig);
	// process.exit();
	
	const serviceClass = this.serviceClasses[serviceType];
	if (!serviceClass) {
		console.log('no service class for', serviceType);
		process.exit();
	}
	const serviceId = serviceClass.id(serviceConfig);
	
	if (!this.state.services[serviceType]) this.state.services[serviceType] = {};
	
	this.log('start/get service', serviceId);
	
	if (serviceId && this.state.services[serviceType][serviceId] && this.serviceInstances[serviceId].instance) {
		console.log('usage 2');
		this.state.services[serviceType][serviceId].adapters.push(adapterConfig.id);
		adapterConfig.serviceIds[serviceType] = serviceId;
		
		// callback(this.state.services[serviceType][serviceId].instance);
		callback(this.serviceInstances[serviceId].instance);
	}
	else {
		console.log('service does not exist', serviceId, serviceType);
		console.log(this.state.services[serviceType][serviceId]);
		
		let serviceInstance = serviceClass.getOrCreateInstance(serviceId, serviceConfig);
		
		console.log('got serviceInstance', serviceInstance);
		
		if (serviceInstance && serviceInstance.id === serviceId) {
			if (!this.state.services[serviceType][serviceId]) {
				if (this.serviceInstances[serviceId]) {
					console.log('service instance exists', serviceId);
					process.exit();
				}
				
				this.state.services[serviceType][serviceId] = {
					serviceConfig,
					// type: serviceType,
					// instance: serviceInstance,
					adapters: []
				};
				this.serviceInstances[serviceId] = {
					type: serviceType,
					instance: serviceInstance
				};
			}
			console.log('usage 3');
			this.state.services[serviceType][serviceId].adapters.push(adapterConfig.id);
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
};

Jaxcore.prototype.getServicesForAdapter = function(adapterConfig, callback) {
	// if (adapterConfig.type === 'volume' ||
	// 	adapterConfig.type === 'mouse' ||
	// 	adapterConfig.type === 'hmouse' ||
	// 	adapterConfig.type === 'vmouse' ||
	// 	adapterConfig.type === 'scroll' ||
	// 	adapterConfig.type === 'keyboard') {
		
		const adapterInstance = this.adapterInitializers[adapterConfig.type];
		const servicesConfig = adapterInstance.getServicesConfig(adapterConfig);
		this.log('getServicesForAdapter servicesConfig', adapterConfig, servicesConfig);
		
		const serviceConfigFns = [];
		
		for (let serviceType in servicesConfig) {
			this.log('loop serviceType', serviceType);
			// for (let serviceId in servicesConfig[serviceType]) {
			// 	this.log('loop serviceId', serviceId, servicesConfig[serviceType]);
				
			const serviceConfig = servicesConfig[serviceType];
			let fn = ((type, config) => {
				return (asyncCallback) => {
					this.getOrCreateService(adapterConfig, type, config, function(serviceInstance) {
						// console.log('hi', serviceInstance);
						
						if (serviceInstance) {
							console.log('getServicesForAdapter callback');
							const serviceInstances = {};
							serviceInstances[type] = serviceInstance;
							asyncCallback(null, serviceInstances);
						}
						else {
							console.log('no service for', adapterConfig, config);
							asyncCallback({
								noServiceInstance: config
							});
						}
					});
					
				}
			})(serviceType, serviceConfig);
			
			serviceConfigFns.push(fn);
			// }
		}
		
		console.log('serviceConfigFns', serviceConfigFns.length, serviceConfigFns);
		
		async.series(serviceConfigFns, function(err, results) {
			if (err) {
				console.log('err', err);
				process.exit();
			}
			if (results) {
				const combinedServices = {};
				results.forEach(function(serviceInstance) {
					for (let type in serviceInstance) {
						combinedServices[type] = serviceInstance[type];
					}
				});
				console.log('serviceInstances combinedServices', combinedServices);
				callback(combinedServices);
			}
		});
		
		// this.log('serviceType', serviceType, 'serviceId', 'serviceConfig', servicesConfig);
		
		// return;
		
		// process.exit();
	// }
	// else if (adapterConfig.type === 'media' ||
	// 	adapterConfig.type === 'momentum' ||
	// 	adapterConfig.type === 'precision' ||
	// 	adapterConfig.type === 'test') {
	//
	// 	let serviceConfig = {
	// 		minVolume: 0,
	// 		maxVolume: 100
	// 	};
	//
	//
	// 	this.getOrCreateService(adapterConfig, 'desktop', serviceConfig, function(serviceInstance) {
	// 		if (serviceInstance) {
	// 			console.log('serviceInstance');
	// 			callback({
	// 				desktop: serviceInstance
	// 			});
	// 		}
	// 		else {
	// 			console.log('no service for', adapterConfig, serviceConfig);
	// 			callback()
	// 		}
	// 	});
	// }
	// else {
	// 	console.log('no service for adapter', adapterConfig);
	// 	callback();
	// }
};

Jaxcore.prototype.relaunchAdapter = function(adapterConfig, spin) {
	console.log('RELAUNCHING ADAPTER', adapterConfig, spin.id);
	
	this.getServicesForAdapter(adapterConfig, (services) => {
		if (!services) {
			console.log('relaunchAdapter: no service for adapter', adapterConfig);
			process.exit();
		}
		
		console.log('RELAUNCH ADAPTER:', adapterConfig);
		this.startSpinAdapter(adapterConfig, spin, services);
	});
};

Jaxcore.prototype.createAdapter = function(spin, adapterType, adapterSettings, callback) {
	if (!adapterSettings) adapterSettings = {};
	console.log('CREATING ADAPTER:', spin.id, adapterType, adapterSettings);
	const adapterId = Math.random().toString().substring(2);
	console.log('usage 4');
	this.state.adapters[adapterId] = {
		id: adapterId,
		type: adapterType,
		deviceIds: {
			spin: spin.id
		},
		serviceIds: {},
		settings: adapterSettings,
		theme: defaultTheme
	};
	
	const adapterConfig = this.state.adapters[adapterId];
	
	this.getServicesForAdapter(adapterConfig, (services) => {
		// console.log('services:', services);
		
		if (!services) {
			console.log('createAdapter: no service for adapter', adapterConfig);
			process.exit();
		}
		
		let serviceTypes = Object.keys(services);
		
		console.log('CREATED ADAPTER:', adapterConfig, 'services:', serviceTypes);
		
		this.startSpinAdapter(this.state.adapters[adapterId], spin, services, callback);
	});
	
	return adapterId;
};

Jaxcore.prototype.startSpinAdapter = function(adapterConfig, spin, services, callback) {
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
	
	const adapterInitializer = this.adapterInitializers[adapterConfig.type];
	
	const adapterInstance = new Adapter(adapterConfig, themes[adapterConfig.theme], devices, services, adapterInitializer);
	
	// adapterConfig.instance = adapterInstance;
	this.adapterInstances[adapterConfig.id] = {
		type: adapterConfig.type,
		instance: adapterInstance
	};
	
	let onDisconnect = () => {
		console.log('device disconnected, destroying adapter....', adapterConfig);
		this.destroyAdapter(adapterConfig);
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
	
	if (callback) callback(adapterConfig);
	return adapterInstance;
};

Jaxcore.prototype.destroyService = function(serviceType, serviceId) {
	
	if (this.state.services[serviceType][serviceId]) {
		console.log('destroying service', serviceType, serviceId);
		
		let onDestroyService = () => {
			this.state.services[serviceType][serviceId].adapters.forEach((adapterId) => {
				const adapterConfig = adapters[adapterId];
				this.destroyAdapter(adapterConfig);
			});
			console.log('clearout', this.state.services[serviceType][serviceId]);
			
			// this.state.services[serviceType][serviceId].instance.removeListener('teardown', onDestroyService);
			this.serviceInstances[serviceId].instance.removeListener('teardown', onDestroyService);
			// delete this.state.services[serviceType][serviceId].instance;
			delete this.serviceInstances[serviceId].instance;
			delete this.serviceInstances[serviceId];
			delete this.state.services[serviceType][serviceId].adapters;
			delete this.state.services[serviceType][serviceId];
			
			// this.emit('destroyed-service', serviceType, serviceId);
		};
		
		// this.state.services[serviceType][serviceId].instance.addListener('teardown', onDestroyService);
		this.serviceInstances[serviceId].instance.addListener('teardown', onDestroyService);
		
		// this.state.services[serviceType][serviceId].instance.destroy();
		this.serviceInstances[serviceId].instance.destroy();
	}
	else {
		console.log('destroyService', this.state.services);
		console.log('destroy type', serviceType, this.state.services[serviceType]);
		console.log('destroy id', serviceId, this.state.services[serviceType][serviceId]);
		console.log('destroyService failed, not found', serviceType, serviceId);
		
		// this.emit('destroy-service-error', serviceType, serviceId);
	}
};

Jaxcore.prototype.destroyAdapter = function(adapterConfig) {
	if (adapterConfig.destroyed) {
		console.log('adapter destroyed');
		return;
	}
	
	const adapterId = adapterConfig.id;
	console.log('destroyAdapter', adapterId, adapterConfig);
	
	if (this.adapterInstances[adapterId].instance) {
		this.adapterInstances[adapterId].instance.destroy();
		delete this.adapterInstances[adapterId].instance;
		delete this.adapterInstances[adapterId];
		adapterConfig.destroyed = true;
		
		for (let serviceType in adapterConfig.serviceIds) {
			let serviceId = adapterConfig.serviceIds[serviceType];
			let index = this.state.services[serviceType][serviceId].adapters.indexOf(adapterId);
			this.state.services[serviceType][serviceId].adapters.splice(index, 1);
			console.log('service adapter Ids', this.state.services[serviceType][serviceId].adapters);
		}
	}
};

module.exports = Jaxcore;