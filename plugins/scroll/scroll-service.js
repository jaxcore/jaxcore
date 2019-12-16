const Service = require('../../lib/client');
const {createLogger} = require('../../lib/logger');
const robot = require("robotjs");
const MomentumScroll = require('./momentumscroll/src/momentumscroll/momentumscroll.js');

let scrollInstance = null;

const schema = {
	id: {
		type: 'string',
		defaultValue: 'scroll'
	},
	connected: {
		type: 'boolean',
		defaultValue: false
	},
	abc: {
		type: 'number',
		defaultValue: 123
	},
	// scrollX: {
	// 	type: 'number'
	// },
	// scrollY: {
	// 	type: 'number'
	// },
	// velocityX: {
	// 	type: 'number'
	// },
	// velocityY: {
	// 	type: 'number'
	// },
	scrollForce: {
		type: 'number',
		defaultValue: 0.01
	},
	scrollForceFactorSlow: {
		type: 'number',
		defaultValue: 1
	},
	scrollSpeedSlow: {
		type: 'number',
		defaultValue: 1
	},
	scrollForceFactorMedium: {
		type: 'number',
		defaultValue: 1.05
	},
	scrollSpeedMedium: {
		type: 'number',
		defaultValue: 1.2
	},
	scrollScrollFactorFast: {
		type: 'number',
		defaultValue: 1.1
	},
	scrollSpeedFast: {
		type: 'number',
		defaultValue: 1.5
	},
	scrollFriction: {
		type: 'number',
		defaultValue: 0.05
	},
	shuttleForce: {
		type: 'number',
		defaultValue: 0.001
	},
	shuttleAcceleration: {
		type: 'number',
		defaultValue: 2
	},
	shuttleFriction: {
		type: 'number',
		defaultValue: 0.05
	},
	shuttleIntervalTime: {
		type: 'number',
		defaultValue: 30
	},
	shuttlePositionH: {
		type: 'number',
		defaultValue: 0
	},
	shuttlePositionV: {
		type: 'number',
		defaultValue: 0
	}
};

class ScrollService extends Service {
	constructor(defaults, store) {
		super(schema, store, defaults);
		
		this.log = createLogger('Scroll');
		this.log('created');
		
		this.momentumScroll = new MomentumScroll({
			intervalTime: 1
		});
		
		this._onScroll = (scrollX, scrollY, velocityX, velocityY) => {
			// this.setState({
			// 	scrollX,
			// 	scrollY,
			// 	velocityX,
			// 	velocityY
			// });
			robot.scrollMouse(-scrollX, -scrollY);
			this.emit('scroll', scrollX, scrollY, velocityX, velocityY);
		};
		this.momentumScroll.addListener('scroll', this._onScroll);
	}
	
	connect() {
		// this.lastSetVolume = new Date();
		this.setState({
			connected: true
		});
		this.emit('connect');
	}
	
	disconnect(options) {
		this.log('disconnecting...');
	}
	
	scrollVertical(diff, time) {
		let dir = diff > 0 ? 1 : -1;
		let scrollForce, scrollFriction;
		if (time > 170) {
			// scrollForce = diff * this.state.scrollForce;
			// scrollFriction = this.state.scrollFriction;
			scrollForce = dir * Math.pow(Math.abs(diff * this.state.scrollForceFactorSlow), this.state.scrollSpeedSlow) * this.state.scrollForce;
			scrollFriction = this.state.scrollFriction;
		}
		else if (time > 70) {
			scrollForce = dir * Math.pow(Math.abs(diff * this.state.scrollForceFactorMedium), this.state.scrollSpeedMedium) * this.state.scrollForce;
			scrollFriction = this.state.scrollFriction;
		}
		else {
			scrollForce = dir * Math.pow(Math.abs(diff * this.state.scrollScrollFactorFast), this.state.scrollSpeedFast) * this.state.scrollForce;
			scrollFriction = this.state.scrollFriction;
		}
		this.momentumScroll.scrollVertical(diff, scrollForce, scrollFriction);
	}
	
	scrollHorizontal(diff, time) {
		let dir = diff > 0 ? 1 : -1;
		let scrollForce, scrollFriction;
		if (time > 170) {
			scrollForce = diff * this.state.scrollForce;
			scrollFriction = this.state.scrollFriction;
		}
		else if (time > 70) {
			scrollForce = dir * Math.pow(Math.abs(diff * this.state.scrollForceFactorMedium), this.state.scrollSpeedMedium) * this.state.scrollForce;
			scrollFriction = this.state.scrollFriction;
		}
		else {
			scrollForce = dir * Math.pow(Math.abs(diff * this.state.scrollScrollFactorFast), this.state.scrollSpeedFast) * this.state.scrollForce;
			scrollFriction = this.state.scrollFriction;
		}
		this.momentumScroll.scrollHorizontal(diff, scrollForce, scrollFriction);
	}
	
	startShuttleVertical(spinPosition) {
		if (!this.state.shuttleVertical) {
			this.state.shuttlePositionV = spinPosition;
			this.state.shuttleVertical = true;
		}
	}
	
	stopShuttleVertical() {
		this.state.shuttleVertical = false;
		this.momentumScroll.stopShuttleVertical();
	}
	
	startShuttleHorizontal(spinPosition) {
		if (!this.state.shuttleHorizontal) {
			this.state.shuttlePositionH = spinPosition;
			this.state.shuttleHorizontal = true;
		}
	}
	
	stopShuttleHorizontal() {
		this.state.shuttleHorizontal = false;
		this.momentumScroll.stopShuttleHorizontal();
	}
	
	shuttleVertical(spinPosition) {
		let shuttleDiff = spinPosition - this.state.shuttlePositionV;
		if (shuttleDiff === 0) {
			this.momentumScroll.stopShuttleVertical();
		}
		else {
			let d = shuttleDiff > 0 ? 1 : -1;
			let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), this.state.shuttleAcceleration) * this.state.shuttleForce;
			this.momentumScroll.startShuttleVertical(shuttleDiff, shuttleForce, this.state.shuttleFriction, this.state.shuttleIntervalTime);
		}
		return shuttleDiff;
	}
	
	shuttleHorizontal(spinPosition) {
		let shuttleDiff = spinPosition - this.state.shuttlePositionH;
		if (shuttleDiff === 0) {
			this.momentumScroll.stopShuttleHorizontal();
		}
		else {
			let d = shuttleDiff > 0 ? 1 : -1;
			let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), this.state.shuttleAcceleration) * this.state.shuttleForce;
			this.momentumScroll.startShuttleHorizontal(shuttleDiff, shuttleForce, this.state.shuttleFriction, this.state.shuttleIntervalTime);
		}
		return shuttleDiff;
	}
	
	stop() {
		this.momentumScroll.stop();
	}
	
	destroy() {
		this.emit('teardown');
		this.momentumScroll.removeListener('scroll', this._onScroll);
		scrollInstance = null;
	}
	
	static id() {
		return 'scroll';
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		if (!scrollInstance) {
			console.log('CREATE SCROLL');
			scrollInstance = new ScrollService(serviceConfig, serviceStore);
		}
		callback(null, scrollInstance);
	}
	
	static destroyInstance(serviceId, serviceConfig) {
		if (scrollInstance) {
			scrollInstance.destroy();
		}
	}
}

module.exports = ScrollService;

