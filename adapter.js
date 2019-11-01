var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var adapterStore = plugin.createStore('Adapter');

var instances = 0;

function Adapter(config, theme, devices, services, initializer) {
	this.constructor();
	
	this.config = config;
	this.theme = theme;
	this.devices = devices;
	this.services = services;
	
	this.instance = instances++;
	let deviceName = 'Adapter('+config.type+'):';
	for (let i in devices) {
		deviceName += i + ':';
	}
	for (let i in services) {
		deviceName += i + ':';
	}
	this.log = plugin.createLogger(deviceName+(this.instance));
	
	this.setStore(adapterStore);
	
	this.setState({
		id: config.id,
		connected: false
	});
	
	this.setState(initializer.getDefaultState());
	
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
	
	initializer.call(this, config.settings);
}

Adapter.prototype = new Client();
Adapter.prototype.constructor = Client;

Adapter.prototype.setEvents = function(events) {
	this.events = {};
	for (let deviceType in events) {
		this.events[deviceType] = {};
		for (let eventType in events[deviceType]) {
			this.events[deviceType][eventType] = events[deviceType][eventType].bind(this);
		}
	}
	this._destroy = this.destroy.bind(this);
	
	for (let deviceType in this.events) {
		for (let eventType in this.events[deviceType]) {
			if (this.devices[deviceType]) {
				this.devices[deviceType].addListener(kebabcase(eventType), this.events[deviceType][eventType]);
				console.log('added device event', deviceType, eventType);
			}
			else {
				console.log('no device', deviceType);
			}
		}
	}
	for (let serviceType in this.events) {
		for (let eventType in this.events[serviceType]) {
			if (this.services[serviceType]) {
				this.services[serviceType].addListener(kebabcase(eventType), this.events[serviceType][eventType]);
				console.log('added service event', serviceType, eventType);
			}
			else {
				console.log('no service', serviceType);
			}
		}
	}
	
	this.setState({connected: true});
	this.log('Adapter active');
	
	this.emit('connected');
};

function kebabcase(s) {
	return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function camelcase(s) {
	return s.replace(/\W+(.)/g, function(match, chr) {
		return chr.toUpperCase();
	});
}

Adapter.prototype.destroy = function() {
	this.log('destroying');
	this.emit('teardown');
	
	for (let deviceType in this.events) {
		for (let eventType in this.events[deviceType]) {
			if (this.devices[deviceType]) {
				this.devices[deviceType].removeListener(kebabcase(eventType), this.events[deviceType][eventType]);
				this.log('removed event',deviceType,eventType);
			}
			else {
				this.log('no device', deviceType, eventType);
				
			}
		}
	}
	
	for (let serviceType in this.events) {
		for (let eventType in this.events[serviceType]) {
			if (this.services[serviceType]) {
				this.services[serviceType].removeListener(kebabcase(eventType), this.events[serviceType][eventType]);
				this.log('removed service event',serviceType,eventType);
			}
			else {
				this.log('no service', serviceType, eventType);
			}
		}
	}
	
	for (let i in this.devices) {
		this.devices[i].removeListener('disconnect',this._destroy);
		delete this.devices[i];
	}
	delete this.devices;
	
	for (let i in this.services) {
		this.services[i].removeListener('disconnect',this._destroy);
		delete this.services[i];
	}
	delete this.services;
	
	this.setState({connected:false});
	this.emit('destroy');
};


module.exports = Adapter;