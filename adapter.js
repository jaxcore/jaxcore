var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var adapterStore = plugin.createStore('Adapter');

var instances = 0;

function Adapter(config, theme, devices, initializer) {
	this.constructor();
	
	this.config = config;
	this.theme = theme;
	
	this.instance = instances++;
	var deviceName = 'Adapter:';
	for (var i in devices) {
		deviceName += i + ':';
	}
	this.log = plugin.createLogger(deviceName+(this.instance));
	
	this.devices = devices;
	
	this.setStore(adapterStore);
	
	this.setState({
		id: config.id,
		connected: false
	});
	
	this.setState(initializer.getDefaultState());
	
	if (config.settings) {
		this.log('Apply settings', config.settings);
		
		var s = {};
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
	this.events = events;
	this._destroy = this.destroy.bind(this);
	
	let event, device, fn;
	
	for (device in events) {
		for (event in events[device]) {
			let evt = kebabcase(event);
			if (this.devices[device]) {
				fn = events[device][event];
				this['_' + device + '_' + event] = fn.bind(this);
				this.devices[device].addListener(evt, this['_' + device + '_' + event]);
				console.log('added event', device, event);
			}
			else {
				console.log('no device', device, event);
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
	
	// if (!this.state.connected) {
	// 	this.log('not active');
	// 	// return;
	// }
	
	let event, device, fn;
	let events = this.events;
	for (device in events) {
		for (event in events[device]) {
			
			let evt = kebabcase(event);
			if (this.devices[device]) {
				fn = events[device][event];
				this.devices[device].removeListener(evt, this['_'+device+'_'+event]);
				this.log('removed event',device,event);
			}
			else {
				this.log('no device', device, event);
				
			}
		}
	}
	
	for (let i in this.devices) {
		this.devices[i].removeListener('disconnect',this._destroy);
		delete this.devices[i];
	}
	delete this.devices;
	
	this.setState({connected:false});
	this.emit('destroy');
};


module.exports = Adapter;