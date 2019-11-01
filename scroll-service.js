var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var robot = require("robotjs");

function ScrollService(defaults) {
	this.constructor();
	this.createStore('Scroll Store', true);
	this.id = 'scroll';
	this.log = plugin.createLogger('Scroll');
	this.log('created');
	
	this.setStates({
		connected: {
			type: 'boolean',
			defaultValue: false
		}
	}, defaults);
}

ScrollService.prototype = new Client();
ScrollService.prototype.constructor = Client;

ScrollService.id = function() {
	return 'scroll';
};

var scrollInstance = null;

ScrollService.getOrCreateInstance = function(serviceId, serviceConfig) {
	if (!scrollInstance) {
		console.log('CREATE SCROLL');
		scrollInstance = new ScrollService(serviceConfig);
	}
	else {
		console.log('RECONNECT SCROLL');
	}
	
	return scrollInstance;
};
ScrollService.destroyInstance = function(serviceId, serviceConfig) {
	if (scrollInstance) {
		scrollInstance.destroy();
	}
};

ScrollService.prototype.connect = function () {
	// this.lastSetVolume = new Date();
	this.setState({
		connected: true
	});
	this.emit('connect');
};

ScrollService.prototype.disconnect = function (options) {
	this.log('disconnecting...');
};

ScrollService.prototype.scrollVertical = function (diff) {
	robot.scrollMouse(0, -diff);
};
ScrollService.prototype.scrollHorizontal = function (diff) {
	robot.scrollMouse(-diff, 0);
};
ScrollService.prototype.scroll = function (diffX, diffY) {
	robot.scrollMouse(-diffX, -diffY);
};

ScrollService.prototype.destroy = function () {
	this.emit('teardown');
	this.stopMonitor();
	scrollInstance = null;
	// this.removeAllListeners();
};

module.exports = ScrollService;

