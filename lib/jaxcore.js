const async = require('async');
const Adapter = require('./adapter');
const Client = require('./client');
const Service = Client;
const Store = require('./store');
const createClientStore = Store.createClientStore;
const createServiceStore = Store.createServiceStore;
const logger = require('./logger');
const createLogger = logger.createLogger;

//const WebSocketClientPlugin = require('../plugins/websocket-client');
// const BrowserPlugin = require('../plugins/browser');
// const BasicAdapter = require('../adapters/basic-adapter');
const cyberTheme = require('../themes/cyber');

function quit() {
	let a = Array.prototype.slice.call(arguments);
	a.unshift('quit:');
	console.log.apply(null, a);
	// if (typeof process === 'object' && process.exit) {
		// process.exit();
		asdaf()
		console.log('QUIT.');
	// }
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
			// devicesEnabled: {},
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
			// servicesEnabled: {},
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
		
		// this.state.devicesEnabled[deviceType] = true;
		// }
	}
	
	// enableDevices(devices) {
	// 	for (let type in devices) {
	// 		if (type in this.deviceClasses) {
	// 			this.state.devicesEnabled[type] = devices[type];
	// 		}
	// 	}
	// }
	
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
		// this.state.servicesEnabled[serviceType] = true;
	}
	
	// enableServices(services) {
	// 	for (let type in services) {
	// 		if (type in this.serviceClasses) {
	// 			this.state.servicesEnabled[type] = services[type];
	// 		}
	// 	}
	// }
	
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
				// this.state.servicesEnabled[serviceType] = true;
			}
		}
		if (plugin.devices) {
			for (let deviceType in plugin.devices) {
				let device = plugin.devices[deviceType].device;
				let storeType = plugin.devices[deviceType].storeType;
				this.addDevice(deviceType, device, storeType);
				// this.state.devicesEnabled[deviceType] = true;
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
	
	startDevice(type, deviceConfig, deviceCallback, extraOptions) {
		
		const deviceClass = this.deviceClasses[type];
		const deviceStore = this.stores.devices[type];
		if (this.devicesStarted[type]) {
			this.log('device already started', type);
			// debugger;
			return;
		}
		
		let callbackx = (device) => {
			
			// debugger;
			
			const devices = {
				...this.state.devices
			};
			if (!devices[type]) devices[type] = [];
			devices[type].push(device.id);
			this.setState({devices});
			
			// todo: when to remove from devices
			// device.once('teardown', () => {
			// 	const devices = {
			// 		...this.state.devices
			// 	};
			// 	if (!devices[type]) devices[type] = [];
			// 	devices[type].splice(devices[type].indexOf(device.id),1);
			// 	this.setState({devices});
			// });
			
			this.log('connected Device', device.id, type);
			// debugger;

			this.log('emit device-connected');
			this.emit('device-connected', type, device);
			this.log('emit '+type+'-connected');
			this.emit(type+'-connected', device);

			if (deviceCallback) {
				try {
					this.log('deviceCallback()');
					deviceCallback(device);
				}
				catch(e) {
					console.log('deviceCallback err', e);
					// process.exit();
					debugger;
				}
			}
		};
		
		if (deviceClass.startJaxcoreDevice) {
			
			deviceClass.startJaxcoreDevice(deviceConfig, deviceStore, callbackx, extraOptions);
			this.devicesStarted[type] = true;
			
		}
		else {
			debugger;
		}
	}
	
	// startService(serviceType, serviceId, serviceStore, serviceConfig, callback) {
	startServiceProfile(serviceProfileName, callback) {
		console.log('startServiceProfile', serviceProfileName);
		let serviceProfile = this.state.serviceProfiles[serviceProfileName];
		let serviceType = serviceProfile.serviceType;
		// console.log('serviceProfile', serviceProfile);
		// process.exit();
		// // serviceType, serviceConfig
		this.getOrCreateService(null, serviceType, serviceProfile, callback);
	}
	
	stopServiceProfile(serviceProfileName, callback) {
		let serviceProfile = this.state.serviceProfiles[serviceProfileName];
		let serviceType = serviceProfile.serviceType;
		let serviceId;
		this.log('stopServiceProfile');
		for (let id in this.state.services[serviceType]) {
			let s = this.state.services[serviceType][id];
			if (s.serviceConfig.serviceProfileName === serviceProfileName) {
				serviceId = id;
				break;
			}
		}
		if (serviceId) {
			// debugger;
			this.destroyService(serviceType, serviceId);
			callback(null, serviceId);
		}
		else {
			callback({noServiceFound: 'service for profile '+serviceProfileName+' not found'});
		}
		
	}
	
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
					// if (!this.state.services[serviceType]) this.state.services[serviceType] = {};
					
					// this.state.services[serviceType][serviceId] = {
					// 	serviceConfig,
					// 	adapters: []
					// };
					let services = {
						...this.state.services
					};
					if (!services[serviceType]) services[serviceType] = {};
					services[serviceType][serviceId] = {
						serviceConfig,
						adapters: []
					};
					// debugger;
					this.setState({services});
					
					this.serviceInstances[serviceId] = {
						type: serviceType,
						instance: service
					};
					
					let onConnect = () => {
						this.emit('service-connected', serviceType, service);
						if (callback) callback(null, service);
					};
					
					service.once('disconnect', () => {
						debugger;
						
						console.log('service teardown', serviceType, serviceId);
						console.log('teardown this.destroyService', serviceType, serviceId);
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
		// this.log('findSpinAdapter');
		// let adapterId;
		// for (let id in this.state.adapters) {
		// 	if (this.state.adapters[id]) {
		// 		this.log('usage 1');
		// 		if (this.state.adapters[id].destroyed) {
		// 			this.log('adapter', id, 'was destroyed');
		// 			// process.exit();
		// 			delete this.state.adapters[id].destroyed;
		// 		}
		// 		if (this.state.adapters[id].deviceIds.spin === spin.id) {
		// 			adapterId = id;
		// 			this.log('FOUND ADAPTER', adapterId);
		// 			return this.state.adapters[id];
		// 		}
		// 	}
		// }
		this.findSpinIdAdapter(spin.id);
	}
	findSpinIdAdapter(spinId) {
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
				if (this.state.adapters[id].deviceIds.spin === spinId) {
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
			// process.exit();
			debugger;
			return
		}
		if (!serviceClass) {
			this.log('no service class for', serviceType);
			// process.exit();
			debugger;
			return
		}
		
		if (!serviceClass.id) {
			this.log('no .id() static method for', serviceType);
			// process.exit();
			debugger;
			return
		}
		const serviceId = serviceClass.id(serviceConfig, serviceStore);
		serviceConfig.id = serviceId;
		
		console.log('serviceId', serviceId);
		
		if (!this.state.services[serviceType]) this.state.services[serviceType] = {};
		
		this.log('start/get service serviceId', serviceId);
		
		if (serviceId && this.state.services[serviceType][serviceId] && this.serviceInstances[serviceId].instance) {
			this.log('usage 2');
			let serviceInstance = this.serviceInstances[serviceId].instance;
			
			let conTimeout;
			
			let done = () => {
				serviceInstance.__connecting = false;
				if (conTimeout) clearTimeout(conTimeout);
				if (adapterConfig) {
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
				}
				callback(null, this.serviceInstances[serviceId].instance);
			};
			
			if (serviceInstance.state.connected) {
				done();
			}
			else {
				if (serviceInstance.__connecting) {
					this.log('already connecting', serviceInstance.id, '------------------');
					this.log('already connecting', serviceInstance.id, '------------------');
					this.log('already connecting', serviceInstance.id, '------------------');
					this.log('already connecting', serviceInstance.id, '------------------');
					this.log('already connecting', serviceInstance.id, '------------------');
					this.log('already connecting', serviceInstance.id, '------------------');
					serviceInstance.once('connect', done);
					return;
				}
				serviceInstance.__connecting = true;

				serviceInstance.once('connect', done);
				conTimeout = setTimeout(() => {
					serviceInstance.__connecting = false;
					serviceInstance.removeListener('connect', done);
					callback({
						connectFailure: "the service could not be connected"
					});
				}, 5000);
				serviceInstance.connect();
			}
		}
		else {
			this.log('service does not exist', serviceId, serviceType);
			
			// this.log('getting...', this.state.services[serviceType][serviceId]);
			// process.exit();
			
			serviceClass.getOrCreateInstance(serviceStore, serviceId, serviceConfig, (serviceErr, serviceInstance) => {
				// debugger;
				if (serviceErr) {
					console.log('serviceClass.getOrCreateInstance error', serviceErr);
					this.log('serviceErr', serviceErr);
					callback(serviceErr);
					return;
				}
				if (serviceInstance) console.log('serviceClass.getOrCreateInstance instance', typeof serviceInstance);
				this.log('got serviceInstance serviceId=', serviceId);
				
				if (!serviceInstance) {
					quit('no service instance found', serviceType, serviceId);
				}
				
				if (serviceInstance.id === serviceId) {
					
					let {services} = this.state;
					services = {
						...services
					};
					
					if (!services[serviceType]) services[serviceType] = {};
					
					if (!services[serviceType][serviceId]) {
						if (this.serviceInstances[serviceId]) {
							quit('service instance exists', serviceId);
						}
						
						services[serviceType][serviceId] = {
							serviceConfig,
							adapters: []
						};
						
						this.serviceInstances[serviceId] = {
							type: serviceType,
							instance: serviceInstance
						};
					}
					if (adapterConfig) {
						//this.state.services[serviceType][serviceId].adapters.push(adapterConfig.id);
						
						services[serviceType][serviceId].adapters.push(adapterConfig.id);
						
						
						// adapterConfig.serviceIds[serviceType] = serviceId;
						// todo; setState() to update adapterConfig
						let {adapters} = this.state;
						adapters = {
							...adapters
						};
						adapters[adapterConfig.id].serviceIds[serviceType] = serviceId;
						this.setState({adapters});
					}
					
					this.setState({services});
				}
				else {
					quit('wrong id', serviceInstance.id, serviceId);
				}
				
				
				if (serviceInstance.state.connected) {
					this.log('service already connected', serviceType, serviceId);
					// debugger;
				}
				else {
					if (serviceInstance.__connecting) {
						this.log('already connecting', serviceInstance.id, '------------------');
						this.log('already connecting', serviceInstance.id, '------------------');
						this.log('already connecting', serviceInstance.id, '------------------');
						this.log('already connecting', serviceInstance.id, '------------------');
						this.log('already connecting', serviceInstance.id, '------------------');
						this.log('already connecting', serviceInstance.id, '------------------');
						return;
					}
					serviceInstance.__connecting = true;

					this.log('waiting for service to connect', serviceType, serviceId);
					
					if (serviceConfig.serviceTimeout) {
						debugger;
					}
					const serviceTimeout = serviceConfig.serviceTimeout || 5000;
					
					let connectTimeout = setTimeout(() => {
						
						serviceInstance.removeListener('connect', onConnect);
						
						this.log('connection timeout');
						this.destroyService(serviceType, serviceId);
						callback({timeout: true});
					}, serviceTimeout);  // todo: add configurable connectionTimeout??
					
					// let onReconnect = () => {
					// 	console.log('onReconnect?');
					//
					// 	// serviceInstance.on('connect', function() {
					// 	// 	console.log('onReconnect?');
					// 	// 	process.exit();
					// 	// });
					// 	// serviceInstance.on('connect', onReconnect);
					//
					// 	if (adapterConfig) {
					// 		this.reconnectServiceAdapter(adapterConfig, serviceType, serviceConfig, (err, success) => {
					// 			if (err) {
					// 				this.log('reconnectServiceAdapter error disable reconnect?');
					// 			}
					// 		});
					// 	}
					// };
					
					let onDisconnect = (service, reconnecting) => {
						debugger;
						serviceInstance.__connecting = false;
						// clearTimeout(connectTimeout);
						this.log(serviceType + ' service disconnected, destroy adapter??', 'reconnecting=' + reconnecting);
						
						if (adapterConfig) {
							// todo; should destroy all adapters connected to this service
							debugger;
							this.destroyAdapter(adapterConfig, () => {
								debugger;
								console.log('destroyed adapter');
							});
						}
						else {
							debugger;
						}
						this.log('onDisconnect() ', serviceType);
						// process.exit();
						
						// todo: do not destroy service on disconnect, test other services
						/// this.destroyService(serviceType, serviceId);
						
						// serviceInstance.on('connect', onReconnect);
					};
					
					let onConnect = () => {
						serviceInstance.__connecting = false;

						// console.log('onConnect', serviceInstance.state.connected);
						clearTimeout(connectTimeout);
						this.log('onConnect service connected', serviceType, serviceInstance.id);
						
						serviceInstance.once('disconnect', onDisconnect);
						this.log('getOrCreateService callback', typeof serviceInstance);
						callback(null, serviceInstance);
					};
					
					serviceInstance.once('connect', onConnect);
					
					// serviceInstance.once('teardown', () => {
					// 	console.log('teardown');
					// 	// serviceInstance.removeListener('connect', onReconnect);
					// 	serviceInstance.removeListener('disconnect', onDisconnect);
					// 	console.log('teardown service, onReconnect');
					// 	// process.exit();
					// });
					
					console.log(serviceInstance.id+' connect() ...');

					// zxcv();
					// process.exit();
					serviceInstance.connect();
				}
			});
		}
	}
	
	reconnectServiceAdapter(adapterConfig, serviceType, serviceConfig, callback) {
		// todo: this is deprecated?
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
		this.log('getServicesForAdapter ----------------------', adapterConfig);

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
									console.log('got serviceInstance');
									if (serviceInstance.state.connected) {
										console.log('got serviceInstance already connected');
										// console.log('getServicesForAdapter callback');
										const serviceInstances = {};
										serviceInstances[type] = serviceInstance;
										// debugger;
										asyncCallback(null, serviceInstances);
									}
									else {
										debugger;
										console.log('service not connected', serviceInstance.state);
										// connect() ??
									}
								}
								else {
									this.log('no service for', adapterConfig, config);
									
									let error = {};
									error[type] = {
										noServiceInstance: config
									};
									// debugger;
									console.log('asyncCallback(error)', error);
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
					this.log('results', results.length, typeof results.forEach);
					
					
					const combinedServices = {};
					results.forEach(function (serviceInstance) {
						console.log('foreaach', typeof serviceInstance);
						for (let type in serviceInstance) {
							console.log('type', type, typeof serviceInstance);
							combinedServices[type] = serviceInstance[type];
						}
					});
					
					this.log('serviceInstances combinedServices', Object.keys(combinedServices));
					//process.exit();
					
					callback(null, combinedServices);
				}
				else {
					this.log('no results----');
					debugger;
					// process.exit();
					s
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
	
	deleteServiceProfile(serviceProfileName) {
		// debugger;
		const serviceProfiles = {
			...this.state.serviceProfiles
		};
		
		if (serviceProfileName in serviceProfiles) {
			const adapterProfiles = {
				...this.state.adapterProfiles
			};
			for (let adapterName in adapterProfiles) {
				if (adapterProfiles[adapterName].serviceProfiles.indexOf(serviceProfileName) > -1) {
					delete adapterProfiles[adapterName];
				}
			}
			
			delete serviceProfiles[serviceProfileName];
			
			this.setState({
				serviceProfiles,
				adapterProfiles
			});
			
			// debugger;
			return true;
		}
		
		// debugger;
		return false;
	}
	
	defineService(serviceProfileName, serviceType, serviceConfig) {
		const serviceProfiles = {
			...this.state.serviceProfiles
		};
		if (serviceProfiles[serviceProfileName]) {
			this.log('serviceProfileName exists', serviceProfileName);
			// quit();
			debugger;
			return;
		}
		if (!serviceProfiles[serviceProfileName]) serviceProfiles[serviceProfileName] = {};
		
		if (!serviceConfig) {
			console.log('no serviceConfig', serviceProfileName);
			// process.exit();
			return;
		}
		// if (!serviceProfiles[serviceType]) serviceProfiles[serviceType] = {};
		// serviceConfig.serviceProfileName = serviceProfileName;
		serviceConfig.serviceType = serviceType;
		serviceConfig.serviceProfileName = serviceProfileName;
		// serviceProfiles[serviceType][serviceProfileName] = serviceConfig;
		serviceProfiles[serviceProfileName] = serviceConfig;
		// debugger;
		this.setState({serviceProfiles});
	}
	
	deleteAdapter(adapterProfileName) {
		for (let adapterId in this.state.adapters) {
			if (this.state.adapters[adapterId].profile.profileName === adapterProfileName) {
				debugger;
				this.destroyAdapter(adapterId);
			}
		}
		
		debugger;
		
		const adapterProfiles = {
			...this.state.adapterProfiles
		};
		delete adapterProfiles[adapterProfileName];
		this.setState({adapterProfiles});
	}
	
	updateAdapter(adapterProfileName, changes, theme) {
		if (adapterProfileName in this.state.adapterProfiles) {
			const adapterProfiles = {
				...this.state.adapterProfiles
			};
			for (let id in changes) {
				adapterProfiles[adapterProfileName][id] = changes[id];
			}
			this.setState({adapterProfiles});
			
			if ('settings' in changes) {
			
				// update the live adapter
				for (let adapterId in this.state.adapters) {
					if (this.state.adapters[adapterId].profile.profileName === adapterProfileName) {
						if (this.adapterInstances[adapterId].instance) {
							const instance = this.adapterInstances[adapterId].instance;
							debugger;
							
							instance.setState({
								settings: changes.settings
							});
							
							
							// if (changes.settings.spinSettings.theme && changes.spinSettings.settings.theme !== 'default' && theme) {
							if (theme) {
								debugger;
								// instance.theme[]
								for (let i in theme) {
									instance.theme[i] = theme[i];
								}
							}
							
							
							if ('spinSettings' in changes.settings && instance.devices.spin) {
								const spinSettings = changes.settings.spinSettings;
								const spin = instance.devices.spin;
								
								if (spinSettings.brightness !== -1) spin.setBrightness(spinSettings.brightness);
								if (spinSettings.knobHoldThreshold !== -1) spin.setKnobHoldThreshold(spinSettings.knobHoldThreshold);
								if (spinSettings.buttonHoldThreshold !== -1) spin.setButtonHoldThreshold(spinSettings.buttonHoldThreshold);
								if (spinSettings.staticTimeout !== -1) spin.setStaticTimeout(spinSettings.staticTimeout);
								
								// this.setTheme(theme);
								spin.flash([0,255,0]);
								debugger;
							}
							else {
								debugger;
							}
							
						}
					}
				}
			}
		}
		else {
			console.log('no adapterProfileName', adapterProfileName);
			
			debugger;
		}
	}
	
	defineAdapter(adapterName, adapterProfile) {
		// const {adapterProfiles} = this.state;
		const adapterProfiles = {
			...this.state.adapterProfiles
		};
		if (adapterName in adapterProfiles) {
			console.log('adapterName', adapterName, 'already exists');
			return;
		}
		adapterProfiles[adapterName] = adapterProfile;
		this.setState({adapterProfiles});
	}
	
	destroyDeviceAdapters(device) {
		for (let adapterId in this.state.adapters) {
			if (device.deviceType in this.state.adapters[adapterId].deviceIds) {
				if (this.state.adapters[adapterId].deviceIds[device.deviceType] === device.id) {
					debugger;
					this.destroyAdapter(adapterId);
				}
			}
		}
		
		debugger;
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
			console.log('after getServicesForAdapter');
			// console.log('after getServicesForAdapter', err, services);
			
			
			if (err) {
				this.log('createAdapter error', err);
				
				// process.exit();
				// debugger;
				// return;
				
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
				//process.exit();
				
				this.log('CREATED ADAPTER:', adapterConfig, 'services:', serviceTypes);
				debugger;
				
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
		
		let adapterConfig;
		if (device && device.deviceType === 'spin') {
			adapterConfig = this.findSpinAdapter(device, adapterType, config);
		}
		
		if (adapterConfig) {
			// if device has an adapter, destroy it?
			
			this.log('found adapter', adapterConfig);
			// process.exit();
			
			// // todo: relaunch aadapter is deprecated?
			// this.relaunchAdapter(adapterConfig, device, (err, adapterInstance, adapterConfig) => {
			// 	if (err) {
			// 		this.log('launchAdapter relaunch error', err);
			// 		if (callback) callback(err);
			// 		else {
			// 			this.log('exiting');
			// 			// process.exit();
			// 		}
			// 	}
			// 	else {
			// 		this.log('adapter relaunched', adapterConfig);
			// 		if (callback) callback(err, adapterInstance, adapterConfig, false);
			// 	}
			// });

			if (this.adapterInstances[adapterConfig.id]) {
				console.log('adapter exists', adapterConfig.id);
				
				// process.exit();
				if (this.adapterInstances[adapterConfig.id].destroy) {
					debugger;
					this.adapterInstances[adapterConfig.id].destroy();
				}
				else {
					console.log('what is', this.adapterInstances[adapterConfig.id]);
					debugger;
					
				}
			}
		}
		
		// else {
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
		// }
	}
	
	startDeviceAdapter(adapterConfig, device, services, callback) {
		this.log('startDeviceAdapter:', adapterConfig, device? device.deviceType:'no device', Object.keys(services));
		debugger;
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
			debugger;
			
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
				adapterConfig.serviceIds[serviceType] = services[serviceType].id;
				
				debugger;
				// for (let i in services) {
				// 	let services = services[i];
				// 	debugger;
				// 	// this.state.services[serviceType]["bbWebsocketClient:localhost:37688"].adapters
				// }
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
			debugger;
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
		debugger;
		
		if (this.state.services[serviceType][serviceId]) {
			this.log('destroying service', serviceType, serviceId);
			
			debugger;
			// debugger;
			
			// let onDestroyService = () => {
				let services = {
					...this.state.services
				} ;
				services[serviceType][serviceId].adapters.forEach((adapterId) => {
					// const adapterConfig = adapters[adapterId];
					// debugger;
					this.destroyAdapter(adapterId);
				});
				
				// this.log('clearout', this.state.services[serviceType][serviceId]);
				
				// this.serviceInstances[serviceId].instance.removeListener('teardown', onDestroyService);
				
				
				delete services[serviceType][serviceId].adapters;
				delete services[serviceType][serviceId];
				this.setState({services});
			// };
			
			// this.serviceInstances[serviceId].instance.addListener('teardown', onDestroyService);
			
			if (this.serviceInstances[serviceId].instance.destroy) {
				
				this.serviceInstances[serviceId].instance.destroy();
				this.serviceInstances[serviceId].instance.removeAllListeners();
				delete this.serviceInstances[serviceId].instance;
				delete this.serviceInstances[serviceId];
			}
			else {
				console.error('Service '+serviceId+' does not have .destroy');
				debugger;
			}
			
			// debugger;
		}
		else {
			this.log('destroyService service not found', serviceId, this.state.services);
			// this.log('destroy type', serviceType, this.state.services[serviceType]);
			// this.log('destroy id', serviceId, this.state.services[serviceType][serviceId]);
			// this.log('destroyService failed, not found', serviceType, serviceId);
			// debugger;
		}
		
		
	}
	
	destroyAdapter() {
		debugger;
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
			debugger;
			return;
		}
		
		const adapterId = adapterConfig.id;
		this.log('destroyAdapter', adapterId, adapterConfig);
		
		if (this.adapterInstances[adapterId] && this.adapterInstances[adapterId].instance) {
			debugger;
			let adapterInstance = this.adapterInstances[adapterId].instance;
			adapterInstance.setState({
				destroyed: true
			});
			adapterInstance.emit('teardown');
			if (adapterInstance.destroy) {
				debugger;
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
		
		debugger;
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
			console.log('websocketClient', websocketClient);
			// process.exit();
			
			// todo: problem: the jaxcore instance, the speech device, and websocketClient dont have references to eachother
			// todo: maybe websocketClient should have a reference to jaxcore and move this code there
			// todo: until I can think of a better way to do this, reroute the speech-recognize event right here
			this.startDevice('speech', null, function(speech) {
				
				const onRecog = (text, stats) => {
					console.log('speech.emit recognize', text, stats);
					speech.speechRecognize(text, stats);
				};
				
				websocketClient.on('disconnect', (text, stats) => {
					console.log('websocketClient speech-recognize REMOVE --------------')
					websocketClient.removeListener('speech-recognize', onRecog);
				});
				
				websocketClient.on('speech-recognize', onRecog);
			});
			
			if (callback) callback(err, websocketClient);
		});
	}

	addWebsocketSpin() {
		if (!this.serviceClasses.websocketClient) {
			console.log('websocketClient no loaded');
			// this.addPlugin(WebSocketClientPlugin);
			// debugger;
			return;
		}
		this.startDevice('websocketSpin');
		
		
	}

	connectBrowserExtension(callback) {
		this.addWebsocketSpin();

		this.isBrowserExtension = true;

		if (!this.serviceClasses.browserService) {
			debugger;
			return;
			// this.addPlugin(BrowserPlugin);
		}

		// this.startService('browserService', 'browserService', null, null, (err, browserService) => {
		this.startService('browserService', {}, (err, browserService) => {
			
			// todo: problem: same as above
			this.startDevice('speech', null, function(speech) {
				browserService.on('speech-recognize', (text, stats) => {
					console.log('speech.emit recognize', text, stats);
					speech.speechRecognize(text, stats);
				});
			});
			
			if (callback) {
				callback(err, browserService);
			}
		});
	}
	
	connectBrowser() {
		let connect = () => {
			this.connectBrowserExtension(function (err, browserService) {
				console.log('websocketClient connected', browserService);
			});
		};
		
		this.on('service-disconnected', (type, device) => {
			if (type === 'browserService') {
				// todo: not working
				debugger;
				console.log('browserService disconnected', type, device.id, 'reconnecting...');
				debugger;
				connect();
			}
		});
		
		connect();
	};
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
// module.exports.BasicAdapter = BasicAdapter;
