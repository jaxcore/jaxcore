var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var robot = require("robotjs");

function MouseService(defaults) {
	this.constructor();
	this.createStore('Mouse Store', true);
	this.id = 'mouse';
	this.log = plugin.createLogger('Mouse');
	this.log('created');
	
	this.setStates({
		connected: {
			type: 'boolean',
			defaultValue: false
		}
	}, defaults);
}

MouseService.prototype = new Client();
MouseService.prototype.constructor = Client;

MouseService.id = function() {
	return 'mouse';
};

let mouseInstance = null;

MouseService.getOrCreateInstance = function(serviceId, serviceConfig, callback) {
	if (!mouseInstance) {
		console.log('CREATE MOUSE');
		mouseInstance = new MouseService(serviceConfig);
	}
	callback(null, mouseInstance);
};
MouseService.destroyInstance = function(serviceId, serviceConfig) {
	if (mouseInstance) {
		mouseInstance.destroy();
	}
};

MouseService.prototype.connect = function () {
	this.setState({
		connected: true
	});
	this.emit('connect');
};

MouseService.prototype.disconnect = function (options) {
	this.log('disconnecting...');
};

MouseService.prototype.moveMouse = robot.moveMouse.bind(robot);
MouseService.prototype.dragMouse = robot.dragMouse.bind(robot);
MouseService.prototype.mouseToggle = robot.mouseToggle.bind(robot);
MouseService.prototype.mouseClick = robot.mouseClick.bind(robot);
MouseService.prototype.getMousePos = robot.getMousePos.bind(robot);
MouseService.prototype.getScreenSize = robot.getScreenSize.bind(robot);

MouseService.prototype.scroll = function (diffX, diffY) {
	robot.scrollMouse(-diffX, -diffY);
};

MouseService.prototype.destroy = function () {
	this.emit('teardown');
	mouseInstance = null;
};

module.exports = MouseService;

