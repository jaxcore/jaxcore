var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var robot = require("robotjs");

function KeyboardService(defaults) {
	this.constructor();
	this.createStore('Keyboard Store', true);
	this.id = 'keyboard';
	this.log = plugin.createLogger('Keyboard');
	this.log('created');
	
	this.setStates({
		connected: {
			type: 'boolean',
			defaultValue: false
		}
	}, defaults);
}

KeyboardService.prototype = new Client();
KeyboardService.prototype.constructor = Client;

KeyboardService.id = function() {
	return 'keyboard';
};

var keyboardInstance = null;

KeyboardService.getOrCreateInstance = function(serviceId, serviceConfig, callback) {
	if (!keyboardInstance) {
		console.log('CREATE KEYBOARD');
		keyboardInstance = new KeyboardService(serviceConfig);
	}
	callback(null, keyboardInstance);
};

KeyboardService.destroyInstance = function(serviceId, serviceConfig) {
	if (keyboardInstance) {
		keyboardInstance.destroy();
	}
};

KeyboardService.prototype.connect = function () {
	this.setState({
		connected: true
	});
	this.emit('connect');
};

KeyboardService.prototype.disconnect = function (options) {
	this.log('disconnecting...');
};

KeyboardService.prototype.keyPress = function(k, modifiers) {
	if (modifiers && modifiers.length) {
		this.log('keyTap modifiers', k, modifiers);
		robot.keyTap(k, modifiers);
	}
	else {
		this.log('keyTap', k);
		robot.keyTap(k);
	}
};
KeyboardService.prototype.keyPressMultiple = function(spin, number, k, modifiers) {
	this.log('keyPressMultiple', 'number', number, 'key', k, 'modifiers', modifiers);
	for (let i=0;i<number;i++) {
		if (modifiers && modifiers.length) robot.keyTap(k, modifiers);
		else robot.keyTap(k);
	}
};

KeyboardService.prototype.keyToggle = robot.keyToggle.bind(robot);

KeyboardService.prototype.destroy = function () {
	this.emit('teardown');
	keyboardInstance = null;
};

module.exports = KeyboardService;

