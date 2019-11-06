const plugin = require('jaxcore-plugin');
const Client = plugin.Client;
const Adapter = plugin.Adapter;
const async = require('async');

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
	
	this.themes = {};
	
	this.adapterInstances = {
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
	};
	this.serviceInstances = {
		// 	volume: {
		// 		volume {
		// 			instance,
		// 			adapters:[]
		// 		}
		// 	}
	};
	
	this.deviceClasses = {};
	this.serviceClasses = {};
	this.adapterInitializers = {};
	
	this.spinDefaultSettings = {
		brightness: 8,
		sleepTimeout: 120
	};
	
	this.setState({
		spinSettings: {
			// spinId: {}
		}
	});
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

Jaxcore.prototype.addPlugin = function(plugin) {
	if (plugin.services) {
		for (let serviceType in plugin.services) {
			this.addService(serviceType, plugin.services[serviceType]);
		}
	}
	if (plugin.adapters) {
		for (let adapterType in plugin.adapters) {
			this.addAdapter(adapterType, plugin.adapters[adapterType]);
		}
	}
};

Jaxcore.prototype.addTheme = function(themeName, theme) {
	this.themes[themeName] = theme;
};
Jaxcore.prototype.setDefaultTheme = function(themeName) {
	this.defaultTheme = themeName;
};

Jaxcore.prototype.startDevice = function(type, ids) {
	if (!ids) ids = [];
	const deviceClass = this.deviceClasses[type];
	deviceClass.startJaxcoreDevice(this, ids);
};

Jaxcore.prototype.findSpinAdapter = function(spin) {
	this.log('findSpinAdapter');
	let adapterId;
	for (let id in this.state.adapters) {
		if (this.state.adapters[id]) {
			this.log('usage 1');
			if (this.state.adapters[id].destroyed) {
				this.log('adapter', id, 'was destroyed');
				// process.exit();
				delete this.state.adapters[id].destroyed;
			}
			if (this.state.adapters[id].deviceIds.spin === spin.id) {
				adapterId = id;
				this.log('FOUND ADAPTER', adapterId);
				return this.state.adapters[id];
			}
		}
	}
};

Jaxcore.prototype.getOrCreateService = function(adapterConfig, serviceType, serviceConfig, callback) {
	this.log('start/get '+serviceType + ' service', 'serviceConfig:', serviceConfig);
	
	const serviceClass = this.serviceClasses[serviceType];
	if (!serviceClass) {
		this.log('no service class for', serviceType);
		process.exit();
	}
	// console.log('class', serviceClass.id, serviceConfig);
	const serviceId = serviceClass.id(serviceConfig);
	console.log('serviceId', serviceId);
	// process.exit();
	if (!this.state.services[serviceType]) this.state.services[serviceType] = {};
	
	this.log('start/get service serviceId', serviceId);
	
	if (serviceId && this.state.services[serviceType][serviceId] && this.serviceInstances[serviceId].instance) {
		this.log('usage 2');
		this.state.services[serviceType][serviceId].adapters.push(adapterConfig.id);
		adapterConfig.serviceIds[serviceType] = serviceId;
		
		// callback(this.state.services[serviceType][serviceId].instance);
		callback(null, this.serviceInstances[serviceId].instance);
	}
	else {
		this.log('service does not exist', serviceId, serviceType);
		this.log(this.state.services[serviceType][serviceId]);
		
		let serviceInstance = serviceClass.getOrCreateInstance(serviceId, serviceConfig);
		
		this.log('got serviceInstance', serviceInstance);
		
		if (serviceInstance && serviceInstance.id === serviceId) {
			if (!this.state.services[serviceType][serviceId]) {
				if (this.serviceInstances[serviceId]) {
					this.log('service instance exists', serviceId);
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
			this.log('usage 3');
			this.state.services[serviceType][serviceId].adapters.push(adapterConfig.id);
			adapterConfig.serviceIds[serviceType] = serviceId;
		}
		else {
			this.log('no service instance found', serviceType, serviceId, serviceInstance.id === serviceId);
			process.exit();
		}
		
		if (serviceInstance.state.connected) {
			this.log('service already connected', serviceType, serviceId);
			process.exit();
			callback(null, serviceInstance);
		} else {
			this.log('waiting for service to connect', serviceType, serviceId);
			
			let onConnect = () => {
				clearTimeout(connectTimeout);
				this.log(serviceType + ' service connected');
				
				serviceInstance.removeListener('connect', onConnect);
				
				serviceInstance.on('disconnect', () => {
					clearTimeout(connectTimeout);
					this.log(serviceType + ' service disconnected');
					//process.exit();
					this.destroyService(serviceType, serviceId);
				});
				
				callback(null, serviceInstance);
			};
			
			let connectTimeout = setTimeout(() => {
				console.log('connection timeout');
				this.destroyService(serviceType, serviceId);
				callback({timeout:true});
			},5000);
			
			serviceInstance.on('connect', onConnect);
			
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
		if (!adapterInstance) {
			console.log('no adapterInitializers', adapterConfig.type, Object.keys(this.adapterInitializers));
			process.exit();
		}
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
					this.getOrCreateService(adapterConfig, type, config, (err, serviceInstance) => {
						
						if (err) {
							this.log('connect err', err);
							asyncCallback(err);
						}
						else {
							if (serviceInstance) {
								// console.log('getServicesForAdapter callback');
								const serviceInstances = {};
								serviceInstances[type] = serviceInstance;
								asyncCallback(null, serviceInstances);
							} else {
								this.log('no service for', adapterConfig, config);
								asyncCallback({
									noServiceInstance: config
								});
							}
						}
					});
					
				}
			})(serviceType, serviceConfig);
			
			serviceConfigFns.push(fn);
			// }
		}
		
		this.log('serviceConfigFns', serviceConfigFns.length, serviceConfigFns);
		
		async.series(serviceConfigFns, (err, results) => {
			if (err) {
				this.log('async.series', err);
				callback(err);
			}
			else {
				if (results) {
					const combinedServices = {};
					results.forEach(function(serviceInstance) {
						for (let type in serviceInstance) {
							combinedServices[type] = serviceInstance[type];
						}
					});
					this.log('serviceInstances combinedServices', combinedServices);
					callback(null, combinedServices);
				}
				else {
					this.log('no results');
					callback({
						error: 'no results'
					});
				}
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
	// 			this.log('serviceInstance');
	// 			callback({
	// 				desktop: serviceInstance
	// 			});
	// 		}
	// 		else {
	// 			this.log('no service for', adapterConfig, serviceConfig);
	// 			callback()
	// 		}
	// 	});
	// }
	// else {
	// 	this.log('no service for adapter', adapterConfig);
	// 	callback();
	// }
};

Jaxcore.prototype.relaunchAdapter = function(adapterConfig, spin) {
	this.log('RELAUNCHING ADAPTER', adapterConfig, spin.id);
	
	this.getServicesForAdapter(adapterConfig, (err, services) => {
		if (err) {
			this.log('relaunchAdapter error', err);
			process.exit();
		}
		else {
			if (!services) {
				this.log('relaunchAdapter: no service for adapter', adapterConfig);
				process.exit();
			}
			this.log('RELAUNCH ADAPTER:', adapterConfig);
			this.startSpinAdapter(adapterConfig, spin, services);
		}
	});
};

Jaxcore.prototype.createAdapter = function(spin, adapterType, adapterSettings, callback) {
	if (!adapterSettings) adapterSettings = {};
	this.log('CREATING ADAPTER:', spin.id, adapterType, adapterSettings);
	const adapterId = Math.random().toString().substring(2);
	this.log('usage 4');
	this.state.adapters[adapterId] = {
		id: adapterId,
		type: adapterType,
		deviceIds: {
			spin: spin.id
		},
		serviceIds: {},
		settings: adapterSettings,
		theme: adapterSettings.theme || this.defaultTheme
	};
	
	const adapterConfig = this.state.adapters[adapterId];
	
	this.getServicesForAdapter(adapterConfig, (err, services) => {
		if (err) {
			this.log('createAdapter error', err);
			callback(err);
		}
		else {
			if (!services) {
				this.log('createAdapter: no service for adapter', adapterConfig);
				process.exit();
			}
			
			let serviceTypes = Object.keys(services);
			
			this.log('CREATED ADAPTER:', adapterConfig, 'services:', serviceTypes);
			
			this.startSpinAdapter(this.state.adapters[adapterId], spin, services, callback);
		}
	});
	
	return adapterId;
};

Jaxcore.prototype.startSpinAdapter = function(adapterConfig, spin, services, callback) {
	this.log('Starting Adapter:', adapterConfig);
	
	const devices = {
		spin
	};
	
	for (let serviceType in services) {
		if (adapterConfig.serviceIds) {
			adapterConfig.serviceIds[serviceType] = services[serviceType].id
		}
		else {
			this.log('no service serviceIds');
			process.exit();
		}
	}
	
	this.log('adapterConfig', adapterConfig);
	this.log('adapter devices', Object.keys(devices));
	this.log('adapter services', Object.keys(services));
	
	const adapterInitializer = this.adapterInitializers[adapterConfig.type];
	
	const adapterInstance = new Adapter(adapterConfig, this.themes[adapterConfig.theme], devices, services, adapterInitializer);
	
	// adapterConfig.instance = adapterInstance;
	this.adapterInstances[adapterConfig.id] = {
		type: adapterConfig.type,
		instance: adapterInstance
	};
	
	let onDisconnect = () => {
		this.log('device disconnected, destroying adapter....', adapterConfig);
		this.destroyAdapter(adapterConfig);
		this.removeListener('disconnect', onDisconnect);
	};
	
	// adapterInstance.on('teardown', function() {
	// 	this.log('adapter teardown');
	// 	// device.removeListener('disconnect', onDisconnect);
	// });
	
	for (let i in devices) {
		(function(id) {
			devices[id].addListener('disconnect', onDisconnect);
		})(i);
	}
	
	if (callback) {
		callback(null, adapterConfig, adapterInstance);
	}
	// return adapterInstance;
};

Jaxcore.prototype.destroyService = function(serviceType, serviceId) {
	
	if (this.state.services[serviceType][serviceId]) {
		this.log('destroying service', serviceType, serviceId);
		
		let onDestroyService = () => {
			this.state.services[serviceType][serviceId].adapters.forEach((adapterId) => {
				const adapterConfig = adapters[adapterId];
				this.destroyAdapter(adapterConfig);
			});
			this.log('clearout', this.state.services[serviceType][serviceId]);
			
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
		this.log('destroyService', this.state.services);
		this.log('destroy type', serviceType, this.state.services[serviceType]);
		this.log('destroy id', serviceId, this.state.services[serviceType][serviceId]);
		this.log('destroyService failed, not found', serviceType, serviceId);
		
		// this.emit('destroy-service-error', serviceType, serviceId);
	}
};

Jaxcore.prototype.destroyAdapter = function(adapterConfig) {
	if (adapterConfig.destroyed) {
		this.log('adapter destroyed');
		return;
	}
	
	const adapterId = adapterConfig.id;
	this.log('destroyAdapter', adapterId, adapterConfig);
	
	if (this.adapterInstances[adapterId].instance) {
		this.adapterInstances[adapterId].instance.destroy();
		delete this.adapterInstances[adapterId].instance;
		delete this.adapterInstances[adapterId];
		adapterConfig.destroyed = true;
		
		for (let serviceType in adapterConfig.serviceIds) {
			let serviceId = adapterConfig.serviceIds[serviceType];
			let index = this.state.services[serviceType][serviceId].adapters.indexOf(adapterId);
			this.state.services[serviceType][serviceId].adapters.splice(index, 1);
			this.log('service adapter Ids', this.state.services[serviceType][serviceId].adapters);
		}
	}
};

module.exports = Jaxcore;