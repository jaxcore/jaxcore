var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var robot = require("robotjs");
var MomentumScroll = require('../tools/momentumscroll/lib/src/momentumscroll/momentumscroll.js').default;

function ScrollService(defaults) {
	this.constructor();
	this.createStore('Scroll Store', true);
	this.id = 'scroll';
	this.log = plugin.createLogger('Scroll');
	this.log('created');
	
	this.momentumScroll = new MomentumScroll({
		intervalTime: 1
	});
	
	this._onScroll = (scrollX, scrollY) => {
		robot.scrollMouse(-scrollX, -scrollY);
		this.emit('scroll', scrollX, scrollY);
	};
	this.momentumScroll.addListener('scroll', this._onScroll);
	
	this.setStates({
		connected: {
			type: 'boolean',
			defaultValue: false
		}
	}, defaults);
	
	this.setState({
		scrollForce: 0.01,
		scrollFriction: 0.05,
		shuttleForce: 0.001,
		shuttleFriction: 0.05,
		shuttleIntervalTime: 30,
		shuttlePositionH: 0,
		shuttlePositionV: 0
	});
}

ScrollService.prototype = new Client();
ScrollService.prototype.constructor = Client;

ScrollService.id = function () {
	return 'scroll';
};

var scrollInstance = null;

ScrollService.getOrCreateInstance = function (serviceId, serviceConfig, callback) {
	if (!scrollInstance) {
		console.log('CREATE SCROLL');
		scrollInstance = new ScrollService(serviceConfig);
	}
	callback(null, scrollInstance);
};
ScrollService.destroyInstance = function (serviceId, serviceConfig) {
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

ScrollService.prototype.scrollVertical = function (diff, time) {
	let dir = diff > 0 ? 1 : -1;
	let scrollForce, scrollFriction;
	if (time > 170) {
		scrollForce = diff * this.state.scrollForce;
		scrollFriction = this.state.scrollFriction;
	} else if (time > 70) {
		scrollForce = dir * Math.pow(Math.abs(diff * 1), 1.2) * this.state.scrollForce;
		scrollFriction = this.state.scrollFriction;
	} else {
		scrollForce = dir * Math.pow(Math.abs(diff * 1.1), 1.5) * this.state.scrollForce;
		scrollFriction = this.state.scrollFriction;
	}
	this.momentumScroll.scrollVertical(diff, scrollForce, scrollFriction);
	// robot.scrollMouse(0, -diff);
};
ScrollService.prototype.scrollHorizontal = function (diff, time) {
	let dir = diff > 0 ? 1 : -1;
	let scrollForce, scrollFriction;
	if (time > 170) {
		scrollForce = diff * this.state.scrollForce;
		scrollFriction = this.state.scrollFriction;
	} else if (time > 70) {
		scrollForce = dir * Math.pow(Math.abs(diff * 1), 1.2) * this.state.scrollForce;
		scrollFriction = this.state.scrollFriction;
	} else {
		scrollForce = dir * Math.pow(Math.abs(diff * 1.1), 1.5) * this.state.scrollForce;
		scrollFriction = this.state.scrollFriction;
	}
	this.momentumScroll.scrollHorizontal(diff, scrollForce, scrollFriction);
};

ScrollService.prototype.startShuttleVertical = function (spinPosition) {
	if (!this.state.shuttleVertical) {
		this.state.shuttlePositionV = spinPosition;
		this.state.shuttleVertical = true;
	}
};
ScrollService.prototype.stopShuttleVertical = function () {
	this.state.shuttleVertical = false;
	this.momentumScroll.stopShuttleVertical();
};
ScrollService.prototype.startShuttleHorizontal = function (spinPosition) {
	if (!this.state.shuttleHorizontal) {
		this.state.shuttlePositionH = spinPosition;
		this.state.shuttleHorizontal = true;
	}
};
ScrollService.prototype.stopShuttleHorizontal = function () {
	this.state.shuttleHorizontal = false;
	this.momentumScroll.stopShuttleHorizontal();
};

ScrollService.prototype.shuttleVertical = function (spinPosition) {
	let shuttleDiff = spinPosition - this.state.shuttlePositionV;
	if (shuttleDiff === 0) {
		this.momentumScroll.stopShuttleVertical();
	} else {
		let d = shuttleDiff > 0 ? 1 : -1;
		let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), 1.5) * this.state.shuttleForce;
		this.momentumScroll.startShuttleVertical(shuttleDiff, shuttleForce, this.state.shuttleFriction, this.state.shuttleIntervalTime);
	}
	return shuttleDiff;
};
ScrollService.prototype.shuttleHorizontal = function (spinPosition) {
	let shuttleDiff = spinPosition - this.state.shuttlePositionH;
	if (shuttleDiff === 0) {
		this.momentumScroll.stopShuttleHorizontal();
	} else {
		let d = shuttleDiff > 0 ? 1 : -1;
		let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), 1.5) * this.state.shuttleForce;
		this.momentumScroll.startShuttleHorizontal(shuttleDiff, shuttleForce, this.state.shuttleFriction, this.state.shuttleIntervalTime);
	}
	return shuttleDiff;
};

ScrollService.prototype.stop = function () {
	this.momentumScroll.stop();
};

ScrollService.prototype.destroy = function () {
	this.emit('teardown');
	this.momentumScroll.removeListener('scroll', this._onScroll);
	scrollInstance = null;
};

module.exports = ScrollService;

