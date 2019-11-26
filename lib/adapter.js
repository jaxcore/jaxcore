const logger = require('./logger');
const Client = require('./client');
const Store = require('./store');

let adapterStore;

let instances = 0;

function kebabcase(s) {
	return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

class Adapter extends Client {
	constructor(store, config, theme, devices, services) {
		super();
		
		this.config = config;
		this.theme = theme;
		this.devices = devices;
		this.services = services;
		
		this.instance = instances++;
		let deviceName = 'Adapter(' + config.type + '):';
		for (let i in devices) {
			deviceName += i + ':';
		}
		for (let i in services) {
			deviceName += i + ':';
		}
		this.log = logger.createLogger(deviceName + (this.instance));
		
		if (!store) {
			console.log('no store');
			process.exit();
			if (!adapterStore) adapterStore = Store.createStore('Adapter');
			store = adapterStore;
		}
		this.setStore(store);
		
		this.setState({
			id: config.id,
			connected: false
		});
		
		if (this.constructor.getDefaultState) {
			const defaults = this.constructor.getDefaultState();
			this.setState({
				...defaults
			});
		}
		
		if (config.settings) {
			this.log('Apply settings', config.settings);
			
			const s = {};
			for (let i in config.settings) {
				s[i] = config.settings[i];
			}
			this.setState({
				settings: {
					...this.state.settings,
					...s
				}
			});
		}
		
		this._bindedEvents = {};
		this._events = {};
		this._destroy = this.destroy.bind(this);
		// initializer.call(this, config.settings);
	}
	
	addEvents(deviceOrService, events) {
		if (!deviceOrService) {
			console.log('no deviceOrService', deviceOrService);
			debugger;
			// process.exit();
			return;
		}
		if (!deviceOrService.id) {
			console.log('no id for deviceOrService', deviceOrService);
			debugger;
			// process.exit();
			return;
		}
		if (!this._events[deviceOrService.id]) this._events[deviceOrService.id] = {};
		for (let eventType in events) {
			let evt = events[eventType].bind(this);
			this._events[deviceOrService.id][eventType] = evt;
			deviceOrService.addListener(kebabcase(eventType), evt);
		}
	}
	
	removeEvents() {
		for (let deviceOrServiceId in this._events) {
			for (let deviceType in this.devices) {
				let device = this.devices[deviceType];
				if (deviceOrServiceId === device.id && device.id in this._events) {
					for (let eventType in this._events[device.id]) {
						let evt = this._events[device.id][eventType];
						this.log('REMOVE DEVICE EVENT', device.id, eventType);
						device.removeListener(kebabcase(eventType), evt);
					}
				}
			}
			for (let serviceType in this.services) {
				let service = this.services[serviceType];
				if (deviceOrServiceId === service.id && service.id in this._events) {
					for (let eventType in this._events[service.id]) {
						let evt = this._events[service.id][eventType];
						this.log('REMOVE SERVICE EVENT', service.id, eventType);
						service.removeListener(kebabcase(eventType), evt);
					}
				}
			}
		}
	}
	
	connect() {
		this.setState({connected: true});
		this.log('Adapter active');
		this.emit('connected');
	}
	
	disconnect() {
		this.setState({connected: false});
		this.emit('destroy');	// disconnect?
	}
	
	destroy() {
		this.log('destroying');
		this.emit('teardown');
		
		this.removeEvents();
		
		// for (let deviceType in this._bindedEvents) {
		// 	for (let eventType in this._bindedEvents[deviceType]) {
		// 		if (this.devices[deviceType]) {
		// 			this.devices[deviceType].removeListener(kebabcase(eventType), this._bindedEvents[deviceType][eventType]);
		// 			this.log('removed event', deviceType, eventType);
		// 		} else {
		// 			this.log('no device', deviceType, eventType);
		//
		// 		}
		// 	}
		// }
		//
		// for (let serviceType in this._bindedEvents) {
		// 	for (let eventType in this._bindedEvents[serviceType]) {
		// 		if (this.services[serviceType]) {
		// 			this.services[serviceType].removeListener(kebabcase(eventType), this._bindedEvents[serviceType][eventType]);
		// 			this.log('removed service event', serviceType, eventType);
		// 		} else {
		// 			this.log('no service', serviceType, eventType);
		// 		}
		// 	}
		// }
		
		for (let i in this.devices) {
			this.devices[i].removeListener('disconnect', this._destroy);
			delete this.devices[i];
		}
		delete this.devices;
		
		for (let i in this.services) {
			this.services[i].removeListener('disconnect', this._destroy);
			delete this.services[i];
		}
		delete this.services;
		
		this.disconnect();
	}
}

module.exports = Adapter;