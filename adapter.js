var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var adapterStore = plugin.createStore('Adapter');
// var adapter = require('./events');

var instances = 0;

function Adapter(config, theme, devices, initializer) {
	this.constructor();
	
	this.config = config;
	
	this.instance = instances++;
	var deviceName = 'Adapter:';
	for (var i in devices) {
		deviceName += i + ':';
	}
	this.log = plugin.createLogger(deviceName+(this.instance));
	
	this.devices = devices;
	
	this.setStore(adapterStore);
	
	// var id = config.id; //Math.random().toString().substring(2);
	this.setState({
		id: config.id,
		connected: false
	});
	
	this.setState(initializer.getDefaultState());
	
	this.log('ADAPTER SETTINGS:', config.settings);
	
	if (config.settings) {
		for (var i in config.settings) {
			this.log('ADAPTER SETTING:', i, ':', config.settings[i]);
			this.state[i] = config.settings[i];
		}
	}
	
	initializer.call(this, devices);
}

Adapter.prototype = new Client();
Adapter.prototype.constructor = Client;

Adapter.prototype.setEvents = function(events) {
	this.events = events;
	// this.events = adapter(this, this.devices);
	this._destroy = this.destroy.bind(this);
	
	// if (this.state.adapterActive) {
	// 	this.log('already active');
	// 	process.exit();
	// 	return;
	// }
	
	// var allConnected = true;
	// for (var i in this.devices) {
	// 	if (!this.devices[i].state.connected) {
	// 		this.log(i, 'is not cconnected');
	// 		process.exit();
	// 		allConnected = false;
	// 	}
	// }
	
	// if (true) {
		var event, device, fn;
		
		for (device in events) {
			for (event in events[device]) {
				var evt = kebabcase(event);
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
		
		// this.devices.spin.on('disconnect',this._destroy);
		// this.devices.kodi.on('disconnect',this._destroy);
		
		// this.devices.kodi.on('destroy',this._destroy);
		
		this.setState({connected: true});
		this.log('Adapter active');
		
	// }
	// else {
	// 	// this.log('kodi connected?', this.devices.kodi.state.connected);
	// 	// this.log('spin connected?', this.devices.spin.state.connected);
	// 	console.log('adapter devices not connected', this.state);
	// 	process.exit();
	// }
	
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
	this.log('destroy');
	
	if (!this.state.connected) {
		this.log('not active');
		// return;
	}
	
	var event, device, fn;
	var events = this.events;
	for (device in events) {
		for (event in events[device]) {
			
			var evt = kebabcase(event);
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
	
	for (var i in this.devices) {
		this.devices[i].removeListener('disconnect',this._destroy);
	}
	// this.devices.spin.removeListener('disconnect',this._destroy);
	// this.devices.kodi.removeListener('disconnect',this._destroy);
	
	this.setState({connected:false});
	
	this.emit('destroy');
	
};


module.exports = Adapter;