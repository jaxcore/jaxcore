const async = require('async');
const Adapter = require('./adapter');
const Client = require('./client');
const Service = Client;
const Store = require('./store');
const createClientStore = Store.createClientStore;
const createServiceStore = Store.createServiceStore;
const logger = require('./logger');
const createLogger = logger.createLogger;

const WebSocketClientPlugin = require('../plugins/websocket-client');
const BrowserPlugin = require('../plugins/browser');
const cyberTheme = require('../themes/cyber');

function quit() {
	let a = Array.prototype.slice.call(arguments);
	a.unshift('quit:');
	console.log.apply(null, a);
	if (typeof process === 'object' && process.exit) {
		// process.exit();
		console.log('QUIT.');
	}
}

class Jaxcore extends Service {
	constructor() {
		super();
		
		this.stores = {
			jaxcore: createServiceStore('JAXCORE Store'),
			adapters: createClientStore('JAXCORE Adapter Store'),
			devices: {},
			services: {}
		};
		
		// this.stores.adapters.set('counter', {
		// 	counter: 123
		// });
		//
		// setInterval(() => {
		// 	let counter = this.stores.adapters['counter'].counter;
		// 	counter++;
		// 	this.stores.adapters.set('counter', {
		// 		counter
		// 	});
		// },1000);
		
		this.setStore(this.stores.jaxcore);
		
		this.setState({
			id: 'jaxcore',
			devices: {},
			devicesEnabled: {},
			adapterProfiles: {
				/*
				[type]: {
					[name]: {
						deviceType,
						settings,
						services
					}
				}
				 */
			},
			adapters: { // adapter instance config, connected to a specific device/service(s)
				/*
				[adapterId] = {
					id: adapterId,
					type: adapterType,
					deviceIds,
					serviceIds: {},
					settings: adapterSettings,
					theme: adapterSettings.theme || this.defaultTheme
				}
				 */
			},
			services: {},
			servicesEnabled: {},
			serviceProfiles: {
				/*
				
				 */
			}
			
		});
		
		this.log = createLogger('Jaxcore');
		
		this.themes = {};
		
		this.adapterInstances = {
			/*
			[adapterConfig.id] = {
				type: adapterConfig.type,
				instance: adapterInstance
			}
			 */
		};
		
		this.serviceInstances = {
			/*
				[serviceId] = {
					type: serviceType,
					instance: service
				};
			 */
		};
		
		this.deviceClasses = {};
		this.devicesStarted = {};
		this.serviceClasses = {};
		this.adapterClasses = {};
		
		this.setState({
			spinSettings: {
			}
		});
		
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
			// process.exit();
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
		if (serviceStoreType === 'service') {
			serviceStore = createServiceStore('JAXCORE '+serviceType+' ServiceStore');
			serviceStore.type = 'service';
		}
		else if (serviceStoreType === 'client') {
			serviceStore = createClientStore('JAXCORE '+serviceType+' ClientStore');
			serviceStore.type = 'client';
		}
		this.stores.services[serviceType] = serviceStore;
		this.state.servicesEnabled[serviceType] = true;
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
	
	startDevice(type, deviceConfig) {
		const deviceClass = this.deviceClasses[type];
		const deviceStore = this.stores.devices[type];
		if (this.devicesStarted[type]) {
			this.log('device already started', type);
			return;
		}
		
		let callbackx = (device) => {
			this.log('connected Device', device.id);
			// debugger;
			this.emit('device-connected', type, device);
			this.emit(type+'-connected', device);
		};
		
		if (deviceClass.startJaxcoreDevice) {
			
			deviceClass.startJaxcoreDevice(deviceConfig, deviceStore, callbackx);
			this.devicesStarted[type] = true;
			
		}
		else {
			debugger;
		}
	}
	
	// startService(serviceType, serviceId, serviceStore, serviceConfig, callback) {
	startService(serviceType, serviceConfig, callback) {
		// if (!serviceId) {
			let serviceId = this.getServiceId(serviceType, serviceConfig);
		// }
		// if (!serviceStore) {
			let serviceStore = this.stores.services[serviceType];
		// }
		
		this.log('startService getOrCreateInstance', serviceType);
		
		this.serviceClasses[serviceType].getOrCreateInstance(serviceStore, serviceId, serviceConfig, (err, service, didCreate) => {
			if (err) {
				this.log('startService err', err);
				callback(err);
			}
			else {
				
				if (didCreate) {
					// console.log('DID CREATE');
					if (!this.state.services[serviceType]) this.state.services[serviceType] = {};
					this.state.services[serviceType][serviceId] = {
						serviceConfig,
						adapters: []
					};
					this.serviceInstances[serviceId] = {
						type: serviceType,
						instance: service
					};
					
					let onConnect = () => {
						this.emit('service-connected', serviceType, service);
						if (callback) callback(null, service);
					};
					
					service.once('disconnect', () => {
						console.log('service teardown', serviceType, serviceId);
						// process.exit();
						this.destroyService(serviceType, serviceId);
						
						this.emit('service-disconnected', serviceType, service);
					});
					
					if (service.state.connected) {
						onConnect();
					}
					else {
						service.once('connect', onConnect);
						service.connect();
					}
					
				}
				else {
					this.log('did not create');
					if (callback) callback(null, service);
					else quit('did not create', serviceType);
				}
			}
			
		});
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
		if (!serviceClass) {
			console.log('no serviceClass for type', serviceType);
			// process.exit();
			return;
		}
		const serviceStore = this.stores.services[serviceType];
		if (!serviceClass.id) {
			this.log('no serviceClass id', serviceClass);
			console.log('serviceType', serviceType);
			console.log(this.serviceClasses);
			// process.exit();
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
		
		const serviceId = serviceClass.id(serviceConfig, serviceStore);
		serviceConfig.id = serviceId;
		
		console.log('serviceId', serviceId);
		
		if (!this.state.services[serviceType]) this.state.services[serviceType] = {};
		
		this.log('start/get service serviceId', serviceId);
		
		if (serviceId && this.state.services[serviceType][serviceId] && this.serviceInstances[serviceId].instance) {
			this.log('usage 2');
			
			//this.state.services[serviceType][serviceId].adapters.push(adapterConfig.id); // todo: same here
			let {services} = this.state;
			services = {
				...services
			};
			services[serviceType][serviceId].adapters.push(adapterConfig.id);
			this.setState({services});
			//adapterConfig.serviceIds[serviceType] = serviceId;
			
			// todo; setState() to update adapterConfig
			// const adapterConfig = adapters[adapterId];
			let {adapters} = this.state;
			adapters = {
				...adapters
			};
			adapters[adapterConfig.id].serviceIds[serviceType] = serviceId;
			this.setState({adapters});
			
			callback(null, this.serviceInstances[serviceId].instance);
		}
		else {
			this.log('service does not exist', serviceId, serviceType);
			
			// this.log('getting...', this.state.services[serviceType][serviceId]);
			// process.exit();
			
			serviceClass.getOrCreateInstance(serviceStore, serviceId, serviceConfig, (serviceErr, serviceInstance) => {
				
				console.log('serviceClass.getOrCreateInstance error', serviceErr);
				console.log('serviceClass.getOrCreateInstance instance', serviceInstance);
				
				if (serviceErr) {
					this.log('serviceErr', serviceErr);
					callback(serviceErr);
					return;
				}
				this.log('got serviceInstance', serviceId);
				
				if (!serviceInstance) {
					quit('no service instance found', serviceType, serviceId);
				}
				
				if (serviceInstance.id === serviceId) {
					if (!this.state.services[serviceType][serviceId]) {
						if (this.serviceInstances[serviceId]) {
							quit('service instance exists', serviceId);
						}
						
						this.state.services[serviceType][serviceId] = {
							serviceConfig,
							adapters: []
						};
						this.serviceInstances[serviceId] = {
							type: serviceType,
							instance: serviceInstance
						};
					}
					//this.state.services[serviceType][serviceId].adapters.push(adapterConfig.id);
					let {services} = this.state;
					services = {
						...services
					};
					services[serviceType][serviceId].adapters.push(adapterConfig.id);
					this.setState({services});
					
					// adapterConfig.serviceIds[serviceType] = serviceId;
					// todo; setState() to update adapterConfig
					let {adapters} = this.state;
					adapters = {
						...adapters
					};
					adapters[adapterConfig.id].serviceIds[serviceType] = serviceId;
					this.setState({adapters});
				}
				else {
					quit('wrong id', serviceInstance.id, serviceId);
				}
				
				
				if (serviceInstance.state.connected) {
					this.log('service already connected', serviceType, serviceId);
					debugger;
				}
				else {
					this.log('waiting for service to connect', serviceType, serviceId);
					
					let connectTimeout = setTimeout(() => {
						
						serviceInstance.removeListener('connect', onConnect);
						
						this.log('connection timeout');
						this.destroyService(serviceType, serviceId);
						callback({timeout: true});
					}, 5000);
					
					let onReconnect = () => {
						console.log('onReconnect?');
						
						// serviceInstance.on('connect', function() {
						// 	console.log('onReconnect?');
						// 	process.exit();
						// });
						// serviceInstance.on('connect', onReconnect);
						
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
						
						this.log('onDisconnect destroyService', serviceType);
						// process.exit();
						
						this.destroyService(serviceType, serviceId);
						
						serviceInstance.on('connect', onReconnect);
					};
					
					let onConnect = () => {
						
						console.log('onConnect', serviceInstance.state.connected);
						
						clearTimeout(connectTimeout);
						this.log(serviceType + ' service connected');
						
						serviceInstance.once('disconnect', onDisconnect);
						callback(null, serviceInstance);
					};
					
					serviceInstance.once('connect', onConnect);
					
					serviceInstance.on('teardown', () => {
						console.log('teardown');
						serviceInstance.removeListener('connect', onReconnect);
						serviceInstance.removeListener('disconnect', onDisconnect);
						console.log('teardown service, onReconnect');
						// process.exit();
					});
					
					console.log('service connect');
					
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
						this.relaunchAdapter(adapterConfig, deviceInstance, callback);
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
		this.log('getServicesForAdapter', adapterConfig);
		
		// process.exit();
		const adapterInstance = this.adapterClasses[adapterConfig.type];
		if (!adapterInstance) {
			debugger;
			console.log('this.adapterClasses', this.adapterClasses);
			return quit('no adapterClasses', adapterConfig); //adapterConfig.type, Object.keys(this.adapterClasses));
		}
		let servicesConfig;
		
		if (adapterInstance.getServicesConfig) {
			servicesConfig = adapterInstance.getServicesConfig(adapterConfig);
		}
		else {
			this.log('adapter', adapterConfig.type, 'has no getServicesConfig');
			
			servicesConfig = {};
			
			if (adapterConfig.profile.services) {
				this.log('adapterConfig services', adapterConfig.profile.services);
				servicesConfig = adapterConfig.profile.services;
			}
			
			// process.exit();
		}
		
		this.log('getServicesForAdapter servicesConfig', adapterConfig, servicesConfig);
		
		
		const serviceConfigFns = [];
		
		for (let serviceType in servicesConfig) {
			this.log('loop serviceType', serviceType);
			let serviceConfig = servicesConfig[serviceType];
			this.log('loop serviceConfig', serviceConfig);
			
			
			if (serviceConfig === true) serviceConfig = {}; // override for keyboard: true, mouse: true returned by adapter.getServicesConf()
			
			let fn = ((type, config) => {
				return (asyncCallback) => {
					
					// if (this.state.servicesEnabled[type]) {
						console.log('getOrCreateService', type);
						
						// process.exit();
						this.getOrCreateService(adapterConfig, type, config, (err, serviceInstance) => {
							
							if (err) {
								this.log('connect err', err);
								debugger;
								let error = {};
								error[type] = err;
								asyncCallback(err);
							}
							else {
								
								if (serviceInstance) {
									
									// console.log('getServicesForAdapter callback');
									const serviceInstances = {};
									serviceInstances[type] = serviceInstance;
									// debugger;
									asyncCallback(null, serviceInstances);
								}
								else {
									this.log('no service for', adapterConfig, config);
									
									let error = {};
									ersror[type] = {
										noServiceInstance: config
									};
									debugger;
									asyncCallback(error);
								}
							}
						});
						
					// }
					// else {
					// 	let error = {};
					// 	this.log('service "'+type+'" not enabled', this.state.servicesEnabled);
					// 	error[type] = {
					// 		notEnabled: config
					// 	};
					// 	asyncCallback(error);
					// }
				}
			})(serviceType, serviceConfig);
			
			serviceConfigFns.push(fn);
		}
		
		this.log('serviceConfigFns', serviceConfigFns.length, serviceConfigFns);
		
		
		async.series(serviceConfigFns, (err, results) => {
			if (err) {
				this.log('getServicesForAdapter error', err);
				debugger;
				callback(err);
			}
			else {
				if (results) {
					this.log('results', results.length);
					
					
					const combinedServices = {};
					results.forEach(function (serviceInstance) {
						console.log('foreaach', serviceInstance);
						for (let type in serviceInstance) {
							combinedServices[type] = serviceInstance[type];
						}
					});
					
					this.log('serviceInstances combinedServices', combinedServices);
					
					
					callback(null, combinedServices);
				}
				else {
					this.log('no results');
					debugger;
					process.exit();
					
					callback({
						error: 'no results'
					});
				}
			}
		});
	}
	
	relaunchAdapter(adapterConfig, spin, callback) {
		this.log('RELAUNCHING ADAPTER', adapterConfig, spin.id);
		
		this.getServicesForAdapter(adapterConfig, (err, services) => {
			if (err) {
				this.log('relaunchAdapter error', err);
				// process.exit();
			}
			else {
				if (!services) {
					this.log('relaunchAdapter: no service for adapter', adapterConfig);
					// process.exit();
				}
				this.log('RELAUNCH ADAPTER:', adapterConfig);
				this.startDeviceAdapter(adapterConfig, spin, services, callback);
			}
		});
	}
	
	defineService(serviceProfileName, serviceType, serviceConfig) {
		const {serviceProfiles} = this.state;
		if (serviceProfiles[serviceProfileName]) {
			this.log('serviceProfileName exists', serviceProfileName);
			quit();
		}
		if (!serviceProfiles[serviceProfileName]) serviceProfiles[serviceProfileName] = {};
		
		// if (!serviceProfiles[serviceType]) serviceProfiles[serviceType] = {};
		// serviceConfig.serviceProfileName = serviceProfileName;
		serviceConfig.serviceType = serviceType;
		// serviceProfiles[serviceType][serviceProfileName] = serviceConfig;
		serviceProfiles[serviceProfileName] = serviceConfig;
		this.setState({serviceProfiles});
	}
	
	defineAdapter(adapterName, adapterProfile) {
		const {adapterProfiles} = this.state;
		
		if (adapterName in adapterProfiles) {
			console.log('adapterName', adapterName, 'already exists');
			return;
		}
		adapterProfiles[adapterName] = adapterProfile;
		this.setState({adapterProfiles});
	}
	
	connectAdapter(device, adapterProfileName, callback) {
		const {adapterProfiles} = this.state;
		console.log('connectAdapter', device);
		
		let services;
		if (adapterProfiles[adapterProfileName].serviceProfiles) {
			services = {};
			adapterProfiles[adapterProfileName].serviceProfiles.forEach(serviceProfileName => {
				if (serviceProfileName in this.state.serviceProfiles) {
					let serviceProfile = this.state.serviceProfiles[serviceProfileName];
					services[serviceProfile.serviceType] = serviceProfile;
				}
			});
		}
		else if (adapterProfiles[adapterProfileName].services) {
			services = adapterProfiles[adapterProfileName].services;
		}
		
		if (device) {
			this.log('connectAdapter', device.deviceType, adapterProfileName);
			let adapterProfile = adapterProfiles[adapterProfileName];
			if (!adapterProfile) {
				console.log('no adapterProfile name "', adapterProfileName, '" in ', adapterProfiles);
				// process.exit();
			}
			const deviceType = adapterProfiles[adapterProfileName].deviceType;
			if (device.deviceType === deviceType) {
				let config = {
					profileName: adapterProfileName,
					deviceType,
					serviceProfiles: adapterProfiles[adapterProfileName].serviceProfiles,
					// services: adapterProfiles[adapterProfileName].services,
					services,
					settings: adapterProfiles[adapterProfileName].settings
				};
				
				const adapterType = adapterProfiles[adapterProfileName].adapterType;
				
				this.launchAdapter(device, adapterType, config, callback);
			}
			else {
				quit('deviceType of ', device.id, 'is of the wrong type', device.deviceType, '!=', deviceType);
			}
		}
		else {
			this.log('no device');
			let adapterProfile = adapterProfiles[adapterProfileName];
			if (!adapterProfile) {
				console.log('no adapterProfile name "', adapterProfileName, '" in ', adapterProfiles);
				// process.exit();
			}
			
			let config = {
				profileName: adapterProfileName,
				//deviceType,
				serviceProfiles: adapterProfiles[adapterProfileName].serviceProfiles,
				services,
				settings: adapterProfiles[adapterProfileName].settings
			};
			
			const adapterType = adapterProfiles[adapterProfileName].adapterType;
			
			this.launchAdapter(null, adapterType, config, callback);
		}
	}
	
	createAdapter(device, adapterType, profile, callback) {
		if (!profile) profile = {};
		this.log('CREATING ADAPTER:', device? device.id : 'NO DEVICE', adapterType, profile);
		const adapterId = Math.random().toString().substring(2);
		this.log('usage 4');
		
		const deviceIds = {};
		
		let deviceOrServiceType;
		if (device) {
			if (device.deviceType) {
				deviceOrServiceType = device.deviceType;
			}
			else if (device.serviceType) {
				deviceOrServiceType = device.serviceType;
			}
			else {
				debugger;
				return quit('device has no deviceType or serviceType');
			}
			deviceIds[deviceOrServiceType] = device.id;
		}
		
		
		const adapters = {
			...this.state.adapters
		};
		adapters[adapterId] = {
			id: adapterId,
			type: adapterType,
			deviceIds,
			serviceIds: {},
			profile, // instance profile
			theme: profile.theme || this.defaultTheme
		};
		this.setState({
			adapters
		});
		
		const adapterConfig = adapters[adapterId];
		
		// console.log('adapterConfig', adapterConfig);
		// process.exit();
		
		this.getServicesForAdapter(adapterConfig, (err, services) => {
			console.log('after getServicesForAdapter', err, services);
			
			
			if (err) {
				this.log('createAdapter error', err);
				process.exit();
				debugger;
				return;
				
				// immediately delete the adapter
				const adapters = {
					...this.state.adapters
				};
				delete adapters[adapterId];
				this.setState({
					adapters
				});
				
				if (callback) {
					console.log('errrr');
					callback(err, adapterId);
				}
				else {
					console.log('Service error', err);
					for (let type in err) {
						if ('notEnabled' in err[type]) {
							console.log('To enable the service: jaxcore.enableService{{'+type+': true}}')
						}
					}
					console.log('quit?');
					// process.exit();
				}
			}
			else {
				
				if (!services) {
					quit('createAdapter: no service for adapter', adapterConfig);
				}
				
				let serviceTypes = Object.keys(services);
				
				console.log('serviceTypes', serviceTypes);
				// console.log('services', services);
				
				
				this.log('CREATED ADAPTER:', adapterConfig, 'services:', serviceTypes);
				
				this.startDeviceAdapter(this.state.adapters[adapterId], device, services, callback);
				// if (device) {
				// }
				// else {
				//
				// }
			}
		});
		
		return adapterId;
	}
	
	launchAdapter(device, adapterType, config, callback) {
		const adapterConfig = this.findSpinAdapter(device, adapterType, config);
		
		if (adapterConfig) {
			this.log('found adapter', adapterConfig);
			// process.exit();
			
			// todo: relaunch aadapter is deprecated?
			this.relaunchAdapter(adapterConfig, device, (err, adapterInstance, adapterConfig) => {
				if (err) {
					this.log('launchAdapter relaunch error', err);
					if (callback) callback(err);
					else {
						this.log('exiting');
						// process.exit();
					}
				}
				else {
					this.log('adapter relaunched', adapterConfig);
					if (callback) callback(err, adapterInstance, adapterConfig, false);
				}
			});
		}
		else {
			this.log('DID NOT FIND ADAPTER FOR:', device? device.id:null, config);
			
			this.createAdapter(device, adapterType, config, (err, adapterInstance, adapterConfig) => {
				if (err) {
					this.log('launchAdapter create error', err);
					if (callback) {
						callback(err);
					}
					else {
						console.log('create Adapter failed', err);
						// quit(err);
						// quit(err);
						
					}
				}
				else {
					this.log('adapter launched', adapterConfig);
					if (callback) {
						this.log('adapter launched callback');
						callback(err, adapterInstance, adapterConfig, true);
					}
					else {
						console.log('no launchAdapter callback')
					}
				}
			});
		}
	}
	
	startDeviceAdapter(adapterConfig, device, services, callback) {
		this.log('startDeviceAdapter:', adapterConfig, device? device.deviceType:'no device', Object.keys(services));
		
		const devices = {};
		
		let deviceOrServiceType;
		
		if (device) {
			if (device.deviceType) {
				deviceOrServiceType = device.deviceType;
			}
			else if (device.serviceType) {
				deviceOrServiceType = device.serviceType;
			}
			else {
				debugger;
				return quit('device has no deviceType or serviceType');
			}
			
			devices[deviceOrServiceType] = device;
		}
		
		
		for (let serviceType in services) {
			if (!services[serviceType].state.connected) {
				console.log('startDeviceAdapter service not connected', serviceType);
				if (callback) {
					callback({
						serviceNotConnected: serviceType
					});
				}
				console.log('not connected');
				return;
			}
			if (adapterConfig.serviceIds) {
				adapterConfig.serviceIds[serviceType] = services[serviceType].id
			}
			else {
				this.log('no service serviceIds');
				// process.exit();
			}
		}
		
		
		this.log('adapter devices', Object.keys(devices));
		this.log('adapter services', Object.keys(services));
		
		
		const adapterClass = this.adapterClasses[adapterConfig.type];
		
		let adapterInstance;
		adapterInstance = new adapterClass(this.stores.adapters, adapterConfig, this.themes[adapterConfig.theme], devices, services);
		this.adapterInstances[adapterConfig.id] = {
			type: adapterConfig.type,
			instance: adapterInstance
		};
		
		let onDisconnect = () => {
			this.log('device disconnected, destroying adapter....', adapterConfig);
			this.destroyAdapter(adapterConfig);
			this.removeListener('disconnect', onDisconnect);
		};
		
		for (let i in devices) {
			(function (id) {
				devices[id].addListener('disconnect', onDisconnect);
			})(i);
		}
		
		adapterConfig.destroyed = false;
		
		adapterInstance.connect();
		
		if (callback) {
			callback(null, adapterInstance, adapterConfig);
		}
	}
	
	destroyService(serviceType, serviceId) {
		console.log('destroyService', serviceType, serviceId);
		
		if (this.state.services[serviceType][serviceId]) {
			this.log('destroying service', serviceType, serviceId);
			
			let onDestroyService = () => {
				this.state.services[serviceType][serviceId].adapters.forEach((adapterId) => {
					const adapterConfig = adapters[adapterId];
					this.destroyAdapter(adapterConfig);
				});
				this.log('clearout', this.state.services[serviceType][serviceId]);
				
				this.serviceInstances[serviceId].instance.removeListener('teardown', onDestroyService);
				delete this.serviceInstances[serviceId].instance;
				delete this.serviceInstances[serviceId];
				delete this.state.services[serviceType][serviceId].adapters;
				delete this.state.services[serviceType][serviceId];
			};
			
			this.serviceInstances[serviceId].instance.addListener('teardown', onDestroyService);
			
			if (this.serviceInstances[serviceId].instance.destroy) {
				this.serviceInstances[serviceId].instance.destroy();
			}
			else {
				console.error('Service '+serviceId+' does not have .destroy');
				console.error('Service '+serviceId+' does not have .destroy');
				console.error('Service '+serviceId+' does not have .destroy');
				console.error('Service '+serviceId+' does not have .destroy');
			}
			
			
		}
		else {
			this.log('destroyService', this.state.services);
			this.log('destroy type', serviceType, this.state.services[serviceType]);
			this.log('destroy id', serviceId, this.state.services[serviceType][serviceId]);
			this.log('destroyService failed, not found', serviceType, serviceId);
		}
	}
	
	destroyAdapter() {
		let adapterConfig;
		if (typeof arguments[0] === 'string') {
			adapterConfig = this.state.adapters[arguments[0]];
			if (!adapterConfig) {
				console.log('adapter does not exist', arguments[0], this.state.adapters);
				// process.exit();
				return;
			}
			console.log('destroying', adapterConfig);
		}
		else if (!arguments[0]) {
			console.log('no id?');
			return;
		}
		else if (typeof arguments[0] === 'object') {
			adapterConfig = arguments[0];
		}
		
		
		if (adapterConfig.destroyed) {
			this.log('adapter already destroyed');
			return;
		}
		
		const adapterId = adapterConfig.id;
		this.log('destroyAdapter', adapterId, adapterConfig);
		
		if (this.adapterInstances[adapterId] && this.adapterInstances[adapterId].instance) {
			let adapterInstance = this.adapterInstances[adapterId].instance;
			adapterInstance.setState({
				destroyed: true
			});
			adapterInstance.emit('teardown');
			if (adapterInstance.destroy) {
				adapterInstance.destroy();
			}
			else {
				debugger;
			}
			
			delete this.adapterInstances[adapterId].instance;
			delete this.adapterInstances[adapterId];
		}
		
		adapterConfig.destroyed = true;
		
		for (let serviceType in adapterConfig.serviceIds) {
			let serviceId = adapterConfig.serviceIds[serviceType];
			let index = this.state.services[serviceType][serviceId].adapters.indexOf(adapterId);
			this.state.services[serviceType][serviceId].adapters.splice(index, 1);
			
			this.log('service adapter Ids', this.state.services[serviceType][serviceId].adapters);
		}
		this.log('destroyed adapter', adapterId);
		
		const adapters = {
			...this.state.adapters
		};
		delete adapters[adapterId];
		this.setState({
			adapters
		});
		
		// this.stores.adapters.destroy(adapterId);
	}
	
	connectWebsocket(webSocketClientConfig, callback) {
		this.isWebsocket = true;
		
		this.addWebsocketSpin();
		
		// this.startService('websocketClient', null, null, webSocketClientConfig, (err, websocketClient) => {
		this.startService('websocketClient', webSocketClientConfig, (err, websocketClient) => {
			// console.log('websocketClient', websocketClient);
			// process.exit();
			if (callback) callback(err, websocketClient);
		});
	}
	
	addWebsocketSpin() {
		if (!this.serviceClasses.websocketClient) {
			this.addPlugin(WebSocketClientPlugin);
		}
		this.startDevice('websocketSpin');
	}
	
	connectBrowserExtension(callback) {
		this.addWebsocketSpin();
		
		this.isBrowserExtension = true;
		
		if (!this.serviceClasses.browserService) {
			this.addPlugin(BrowserPlugin);
		}
		
		// this.startService('browserService', 'browserService', null, null, (err, browserService) => {
		this.startService('browserService', {}, (err, browserService) => {
			if (callback) {
				callback(err, browserService);
			}
		});
	}
}

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}

module.exports = Jaxcore;

module.exports.Adapter = Adapter;
module.exports.Service = Client;
module.exports.Client = Client;
module.exports.Store = Store;
module.exports.logger = logger;
module.exports.createLogger = createLogger;
module.exports.createServiceStore = createServiceStore;
module.exports.createClientStore = createClientStore;
