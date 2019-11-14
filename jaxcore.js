const {createLogger, createServiceStore, createClientStore, Service} = require('jaxcore-plugin');
const async = require('async');

// const Spin = require('jaxcore-spin');
//
// const keyboardPlugin = require('./plugins/keyboard');
// const mousePlugin = require('./plugins/mouse');
// const scrollPlugin = require('./plugins/scroll');
// const websocketPlugin = require('./plugins/websocket');
//
// const VolumeService = require('./services/volume-service');
//
// const mediaAdapter = require('./adapters/media-adapter');

const cyberTheme = require('./themes/cyber');

class Jaxcore extends Service {
	constructor() {
		super();
		
		this.stores = {
			jaxcore: createServiceStore('JAXCORE Store'),
			adapters: createServiceStore('JAXCORE Adapter Store'),
			devices: {},
			services: {}
		};
		
		this.setStore(this.stores.jaxcore);
		
		// if (store) {
		// 	this.setStore(store);
		// }
		// else {
		// 	this.setStore(createStore('Jaxcore Store'), true);
		// }
		
		this.setState({
			id: 'jaxcore',
			devices: {},
			devicesEnabled: {},
			adapters: {},
			services: {},
			servicesEnabled: {}
		});
		
		this.log = createLogger('Jaxcore');
		
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
		this.adapterClasses = {};
		
		// this.spinDefaultSettings = {
		// 	brightness: 8,
		// 	sleepTimeout: 120
		// };
		
		this.setState({
			spinSettings: {
				// spinId: {}
			}
		});
		
		// this.addDevice('spin', Spin);
		// this.enableDevices({
		// 	spin: true
		// });
		//
		// this.addService('volume', VolumeService);
		//
		// this.addPlugin(keyboardPlugin);
		// this.addPlugin(mousePlugin);
		// this.addPlugin(scrollPlugin);
		// this.addPlugin(websocketPlugin);
		//
		// this.addAdapter('media', mediaAdapter);
		
		this.addTheme('cyber', cyberTheme);
		this.setDefaultTheme('cyber');
	}
	
	addDevice(deviceType, deviceClass, deviceStoreType) {
		this.deviceClasses[deviceType] = deviceClass;
		// if (deviceStore) this.stores.devices[deviceType] = deviceStore;
		// else {
		let deviceStore;
		if (deviceStoreType === 'service') deviceStore = createServiceStore('JAXCORE '+deviceType+' Store');
		else if (deviceStoreType === 'client') deviceStore = createClientStore('JAXCORE '+deviceType+' Store');
		else {
			console.log('device', deviceType, 'has no storeType');
			process.exit();
		}
		this.stores.devices[deviceType] = deviceStore;
		this.state.devicesEnabled[deviceType] = true;
		// }
	}
	enableDevices(devices) {
		for (let type in devices) {
			if (type in this.deviceClasses) {
				this.state.devicesEnabled[type] = devices[type];
			}
		}
	}
	
	addService(serviceType, serviceClass, serviceStoreType) {
		this.serviceClasses[serviceType] = serviceClass;
		// if (serviceStore) this.setServiceStore(serviceType, serviceStore);
		let serviceStore;
		if (serviceStoreType === 'service') serviceStore = createServiceStore('JAXCORE '+serviceType+' ServiceStore');
		else if (serviceStoreType === 'client') serviceStore = createClientStore('JAXCORE '+serviceType+' ClientStore');
		this.stores.services[serviceType] = serviceStore;
	}
	
	enableServices(services) {
		for (let type in services) {
			if (type in this.serviceClasses) {
				this.state.servicesEnabled[type] = services[type];
			}
		}
	}
	
	addAdapter(adapterType, adapterClass) {
		this.adapterClasses[adapterType] = adapterClass;
	}
	
	// setServiceStore(serviceType, serviceStore) {
	// 	this.stores.services[serviceType] = serviceStore;
	// }
	
	addPlugin(plugin) {
		if (plugin.services) {
			for (let serviceType in plugin.services) {
				let service;
				if ('service' in plugin.services[serviceType]) {
					service = plugin.services[serviceType].service;
				}
				else {
					service = plugin.services[serviceType];
				}
				
				let storeType;
				if ('storeType' in plugin.services[serviceType]) {
					storeType = plugin.services[serviceType].storeType;
				}
				else if ('stores' in plugin && serviceType in plugin.stores) {
					storeType = plugin.stores[serviceType];
				}
				else {
					storeType = 'service';
				}
				
				this.addService(serviceType, service, storeType);
				this.state.servicesEnabled[serviceType] = true;
			}
		}
		if (plugin.devices) {
			for (let deviceType in plugin.devices) {
				let device = plugin.devices[deviceType].device;
				let storeType = plugin.devices[deviceType].storeType;
				this.addDevice(deviceType, device, storeType);
				this.state.devicesEnabled[deviceType] = true;
			}
		}
		if (plugin.adapters) {
			for (let adapterType in plugin.adapters) {
				this.addAdapter(adapterType, plugin.adapters[adapterType]);
			}
		}
	}
	
	addTheme(themeName, theme) {
		this.themes[themeName] = theme;
	}
	setDefaultTheme(themeName) {
		this.defaultTheme = themeName;
	}
	
	startDevice(type, ids) {
		if (!ids) ids = [];
		const deviceClass = this.deviceClasses[type];
		const deviceStore = this.stores.devices[type];
		let callback = (device) => {
			this.log('connected Device', device.id);
			this.emit('device-connected', type, device);
			//this.emit(type+'-device-connected', device);
		};
		deviceClass.startJaxcoreDevice(ids, deviceStore, callback);
		
		
	}
	
	startService(serviceType, serviceId, serviceStore, serviceConfig, callback) {
		if (!serviceId) {
			serviceId = this.getServiceId(serviceType, serviceConfig);
		}
		if (!serviceStore) {
			serviceStore = this.stores.services[serviceType];
		}
		this.serviceClasses[serviceType].getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback);
	}
	
	findSpinAdapter(spin) {
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
	}
	
	getServiceId(serviceType, serviceConfig) {
		const serviceClass = this.serviceClasses[serviceType];
		const serviceStore = this.stores.services[serviceType];
		if (!serviceClass.id) {
			this.log('no serviceClass id', serviceClass);
			process.exit();
		}
		return serviceClass.id(serviceConfig, serviceStore);
	}
	
	getOrCreateService(adapterConfig, serviceType, serviceConfig, callback) {
		this.log('start/get ' + serviceType + ' service', 'serviceConfig:', serviceConfig);
		
		const serviceClass = this.serviceClasses[serviceType];
		const serviceStore = this.stores.services[serviceType];
		if (!serviceStore) {
			this.log('no service store for', serviceType);
			process.exit();
		}
		if (!serviceClass) {
			this.log('no service class for', serviceType);
			process.exit();
		}
		// console.log('class', serviceClass.id, serviceConfig);
		const serviceId = serviceClass.id(serviceConfig, serviceStore);
		serviceConfig.id = serviceId;
		
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
			
			serviceClass.getOrCreateInstance(serviceStore, serviceId, serviceConfig, (serviceErr, serviceInstance) => {
				if (serviceErr) {
					this.log('serviceErr', serviceErr);
					// process.exit();
					callback(serviceErr);
					return;
				}
				this.log('got serviceInstance', serviceInstance);
				
				if (!serviceInstance) {
					this.log('no service instance found', serviceType, serviceId);
					process.exit();
				}
				
				if (serviceInstance.id === serviceId) {
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
					this.log('wrong id', serviceInstance.id, serviceId);
					process.exit();
				}
				
				if (serviceInstance.state.connected) {
					this.log('service already connected', serviceType, serviceId);
					process.exit();
					callback(null, serviceInstance);
				}
				else {
					this.log('waiting for service to connect', serviceType, serviceId);
					
					
					let connectTimeout = setTimeout(() => {
						
						serviceInstance.removeListener('connect', onConnect);
						
						console.log('connection timeout');
						this.destroyService(serviceType, serviceId);
						callback({timeout: true});
					}, 5000);
					
					let onReconnect = () => {
						this.reconnectServiceAdapter(adapterConfig, serviceType, serviceConfig, (err, success) => {
							if (err) {
								this.log('reconnectServiceAdapter error disable reconnect?');
								
							}
						});
					};
					
					let onDisconnect = (service, reconnecting) => {
						// clearTimeout(connectTimeout);
						this.log(serviceType + ' service disconnected, destroy adapter??', 'reconnecting=' + reconnecting);
						this.destroyAdapter(adapterConfig, () => {
							console.log('destroyed adapter');
						});
						
						// process.exit();
						// this.destroyService(serviceType, serviceId);
					};
					
					let onConnect = () => {
						clearTimeout(connectTimeout);
						this.log(serviceType + ' service connected');
						
						// serviceInstance.removeListener('connect', onConnect);
						
						// serviceInstance.on('disconnect', () => {
						// 	clearTimeout(connectTimeout);
						// 	this.log(serviceType + ' service disconnected');
						// 	//process.exit();
						// 	this.destroyService(serviceType, serviceId);
						// });
						
						
						// serviceInstance.on('teardown', () => {
						// 	console.log('teardown service, onReconnect');
						// 	process.exit();
						// });
						
						// handle reconnections by refinding the adapter
						
						serviceInstance.on('connect', onReconnect);
						
						serviceInstance.on('disconnect', onDisconnect);
						
						callback(null, serviceInstance);
					};
					
					serviceInstance.once('connect', onConnect);
					
					serviceInstance.on('teardown', () => {
						console.log('teardown');
						serviceInstance.removeListener('connect', onReconnect);
						serviceInstance.removeListener('disconnect', onDisconnect);
						console.log('teardown service, onReconnect');
						process.exit();
					});
					
					// serviceInstance.once('connect', function() {
					// 	callback(null, serviceInstance);
					// });
					
					
					// serviceInstance.on('connect', () => {
					//
					// });
					
					serviceInstance.connect();
				}
				
			});
		}
	}
	
	reconnectServiceAdapter(adapterConfig, serviceType, serviceConfig, callback) {
		this.log('reconnectServiceAdapter', adapterConfig, serviceType, serviceConfig);
		adapterConfig.relaunching = true;
		
		for (let deviceType in adapterConfig.deviceIds) {
			let deviceId = adapterConfig.deviceIds[deviceType];
			if (deviceType === 'spin') {
				let Spin = this.deviceClasses[deviceType];
				let deviceInstance = Spin.getDeviceInstance(deviceId);
				if (deviceInstance) {
					if (deviceInstance.state.connected) {
						this.log('relaunching...', deviceInstance);
						this.relaunchAdapter(adapterConfig, deviceInstance);
						callback(null, true);
					}
					else {
						this.log('not relaunching adapter spin not connected');
						callback({
							spinNotConnected: true
						});
					}
				}
				else {
					this.log('no spin found');
					callback({
						spinNotConnected: true
					});
				}
				return;
			}
		}
	}
	
	getServicesForAdapter(adapterConfig, callback) {
		const adapterInstance = this.adapterClasses[adapterConfig.type];
		if (!adapterInstance) {
			console.log('no adapterClasses', adapterConfig.type, Object.keys(this.adapterClasses));
			process.exit();
		}
		let servicesConfig;
		if (adapterInstance.getServicesConfig) servicesConfig = adapterInstance.getServicesConfig(adapterConfig);
		else {
			this.log('adapter', adapterConfig.type, 'has no getServicesConfig');
			servicesConfig = {};
		}
		
		this.log('getServicesForAdapter servicesConfig', adapterConfig, servicesConfig);
		
		const serviceConfigFns = [];
		
		for (let serviceType in servicesConfig) {
			this.log('loop serviceType', serviceType);
			// for (let serviceId in servicesConfig[serviceType]) {
			// 	this.log('loop serviceId', serviceId, servicesConfig[serviceType]);
			
			let serviceConfig = servicesConfig[serviceType];
			
			if (serviceConfig === true) serviceConfig = {}; // override for keyboard: true, mouse: true returned by adapter.getServicesConf()
			
			let fn = ((type, config) => {
				return (asyncCallback) => {
					
					if (this.state.servicesEnabled[type]) {
						this.getOrCreateService(adapterConfig, type, config, (err, serviceInstance) => {
							
							if (err) {
								this.log('connect err', err);
								let error = {};
								error[type] = err;
								asyncCallback();
							}
							else {
								if (serviceInstance) {
									// console.log('getServicesForAdapter callback');
									const serviceInstances = {};
									serviceInstances[type] = serviceInstance;
									asyncCallback(null, serviceInstances);
								}
								else {
									this.log('no service for', adapterConfig, config);
									let error = {};
									ersror[type] = {
										noServiceInstance: config
									};
									asyncCallback(error);
								}
							}
						});
					}
					else {
						let error = {};
						console.log('not enabled', type, this.state.servicesEnabled);
						process.exit();
						error[type] = {
							notEnabled: config
						};
						asyncCallback(error);
					}
					
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
					results.forEach(function (serviceInstance) {
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
	}
	
	relaunchAdapter(adapterConfig, spin) {
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
	}
	
	createAdapter(device, adapterType, adapterSettings, callback) {
		if (!adapterSettings) adapterSettings = {};
		this.log('CREATING ADAPTER:', device.id, adapterType, adapterSettings);
		const adapterId = Math.random().toString().substring(2);
		this.log('usage 4');
		
		const deviceIds = {};
		
		if (!device.deviceType) {
			this.log('device has no deviceType');
			process.exit();
		}
		
		// console.log('jaxcoreDeviceType', device.deviceType);
		
		deviceIds[device.deviceType] = device.id;
		
		this.state.adapters[adapterId] = {
			id: adapterId,
			type: adapterType,
			deviceIds,
			serviceIds: {},
			settings: adapterSettings,
			theme: adapterSettings.theme || this.defaultTheme
		};
		
		const adapterConfig = this.state.adapters[adapterId];
		
		this.getServicesForAdapter(adapterConfig, (err, services) => {
			if (err) {
				this.log('createAdapter error', err);
				if (callback) callback(err);
				else {
					console.log('Service error', err);
					for (let type in err) {
						if ('notEnabled' in err[type]) {
							console.log('To enable the service: jaxcore.enableService{{'+type+': true}}')
						}
					}
					process.exit();
				}
			}
			else {
				if (!services) {
					this.log('createAdapter: no service for adapter', adapterConfig);
					process.exit();
				}
				
				let serviceTypes = Object.keys(services);
				
				this.log('CREATED ADAPTER:', adapterConfig, 'services:', serviceTypes);
				
				this.startSpinAdapter(this.state.adapters[adapterId], device, services, callback);
			}
		});
		
		return adapterId;
	}
	
	startSpinAdapter(adapterConfig, spin, services, callback) {
		this.log('Starting Adapter:', adapterConfig);
		
		const devices = {
			spin
		};
		
		for (let serviceType in services) {
			if (!services[serviceType].state.connected) {
				console.log('startSpinAdapter service not connected', serviceType);
				if (callback) {
					callback({
						serviceNotConnected: serviceType
					});
				}
				return;
			}
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
		
		const adapterClass = this.adapterClasses[adapterConfig.type];
		
		let adapterInstance;
		// if (adapterConfig.type === 'chromecast') {
		adapterInstance = new adapterClass(this.stores.adapters, adapterConfig, this.themes[adapterConfig.theme], devices, services);
		// }
		// else {
		// 	adapterInstance = new Adapter(adapterConfig, this.themes[adapterConfig.theme], devices, services, adapterClass);
		// }
		
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
			(function (id) {
				devices[id].addListener('disconnect', onDisconnect);
			})(i);
		}
		
		adapterConfig.destroyed = false;
		
		adapterInstance.connect();
		
		if (callback) {
			callback(null, adapterConfig, adapterInstance);
		}
	}
	
	destroyService(serviceType, serviceId) {
		
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
	}
	
	destroyAdapter(adapterConfig) {
		if (adapterConfig.destroyed) {
			this.log('adapter already destroyed');
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
		this.log('done destroy adapter');
	}
}

module.exports = Jaxcore;