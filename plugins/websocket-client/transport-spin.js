const {Client, createLogger, createClientStore} = require('jaxcore-plugin');
const SpinBuffer = require('jaxcore-spin/lib/buffer');
const EventEmitter = require('events');
const spinMonitor = new EventEmitter();

const log = createLogger('TransportSpin');

const spinIds = {};
let _instance = 0;

const schema = {
	id: {
		type: 'string'
	},
	instance: {
		type: 'number'
	},
	connected: {
		type: 'boolean'
	},
	spinPosition: {
		type: 'number'
	},
	spinPreviousTime: {
		type: 'date'
	},
	spinTime: {
		type: 'number'
	},
	knobPushed: {
		type: 'boolean'
	},
	knobPushTime: {
		type: 'date'
	},
	knobReleaseTime: {
		type: 'date'
	},
	knobHold: {
		type: 'boolean'
	},
	buttonPushed: {
		type: 'boolean'
	},
	buttonPushTime: {
		type: 'date'
	},
	buttonReleaseTime: {
		type: 'date'
	},
	buttonHold: {
		type: 'boolean'
	},
	batteryVoltage: {
		type: 'number'
	},
	batteryPercent: {
		type: 'number'
	},
	isCharging: {
		type: 'boolean'
	},
	isCharged: {
		type: 'boolean'
	},
	sleeping: {
		type: 'boolean'
	},
	brightness: {
		type: 'number',
		defaultValue: 16
	},
	knobHoldThreshold: {
		type: 'number',
		defaultValue: 2000
	},
	buttonHoldThreshold: {
		type: 'number',
		defaultValue: 2000
	},
	sleepEnabled: {
		type: 'boolean',
		defaultValue: true
	},
	sleepTimer: {
		type: 'number',
		defaultValue: 120
	}
};

let spinStore;

class TransportSpin extends Client {
	constructor(device, store) {
		let instance = (_instance++);
		
		if (!store) {
			if (!spinStore) spinStore = createClientStore('TSpin');
			store = spinStore;
		}
		
		const defaults = {
			id: device.id,
			instance: instance,
		};
		
		super(schema, store, defaults);
		
		this.log = createLogger('TransportSpin ' + instance);
		
		let id = device.id;
		spinIds[id] = this;
		this.id = id;
		
		if (device.transport) {
			this.transport = device.transport;
		}
		
		this._rotationIndex = 8192;
		
		this._bufferDiff = new SpinBuffer(this);
	}
	
	buffer(diff, kineticBufferLimit, staticBufferLimit, momentumTimeout, momentumBuffer) {
		return this._bufferDiff.buffer(diff, kineticBufferLimit, staticBufferLimit, momentumTimeout, momentumBuffer);
	}
	
	delay(ms) {
		this._bufferDiff.delay(ms);
	}
	
	cancelHoldEvents() {
		clearTimeout(this._knobHoldTimer);
		clearTimeout(this._buttonHoldTimer);
	}
	
	isConnected() {
		return this.state.connected;
	}
	
	connect() {
		this.transport.connectSpin(this);
		this._connected();
	}
	
	_connected() {
		this.resetDefaults();
		this.setState({
			connected: true,
			sleeping: false
		});
		this.emit('connect', this);
	}
	
	_removeEvents() {
		this.transport.disconnectSpin(this);
	}
	
	disconnect() {
		this.resetDefaults({
			connected: false
		});
		this.emit('disconnect', this);
	}
	
	resetDefaults(c) {
		const d = {
			spinPosition: 0,
			knobPushed: false,
			knobReleased: true,
			buttonPushed: false,
			buttonReleased: true
		};
		if (c) {
			for (let i in c) {
				d[i] = c[i];
			}
		}
		return d;
	}
	
	sendCommand() {
		let args = Array.prototype.slice.call(arguments);
		this.transport.sendCommand(this, args);
	}
	
	orbit(direction, speed, color1, color2) {
		// this.log('client orbit(', direction, speed, color1, color2);
		this.sendCommand(this.id, 'ORBIT', direction, speed, color1, color2);
	}
	
	flash(color) {
		this.sendCommand(this.id, 'FLASH', color);
	}
	
	quickFlash(color, repeat) {
		if (!repeat) repeat = 1;
		this.sendCommand(this.id, 'QUICKFLASH', color.join(',') + ',' + repeat);
	}
	
	lightsOn(color) {
		this.sendCommand(this.id, 'LIGHTSON', color);
	}
	
	lightsOff() {
		this.sendCommand(this.id, 'LIGHTSOFF');
	}
	
	setBrightness(brightness) {
		this.sendCommand(this.id, 'BRIGHTNESS', brightness);
	}
	
	rotate(direction, color1, color2) {
		this._rotationIndex += direction;
		if (this._rotationIndex <= 0 || this._rotationIndex >= 16384) this._rotationIndex = 8192;
		this.sendCommand(this.id, 'ROTATE', [this._rotationIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
		// this.sendCommand(this.id, 'ROTATE', direction, color1, color2);
	}
	
	scale(scalePercent, color1, color2, color3) {
		if (scalePercent < 0) scalePercent = 0;
		if (scalePercent > 1) scalePercent = 1;
		var scaleIndex = Math.round(scalePercent * 25);
		this.sendCommand(this.id, 'SCALAR', [scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	// scale (percent, color1, color2, color3) {
	// 	this.sendCommand(this.id, 'SCALAR', percent, color1, color2, color3);
	// }
	
	dial(scalePercent, color1, color2, color3) {
		if (scalePercent < 0) scalePercent = 0;
		if (scalePercent > 1) scalePercent = 1;
		var scaleIndex = Math.round(scalePercent * 25);
		log('dial', scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]);
		this.sendCommand(this.id, 'DIAL', [scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	orbit(direction, speed, color1, color2) {
		if (this.bleDevice) this.bleDevice.orbit(direction, speed, color1, color2);
		else this.sendCommand(this.id, 'ORBIT', [direction === 1 ? 1 : 0, speed, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
	}
	
	
	balance(balancePercent, color1, color2, color3) {
		var balanceIndex;
		if (balancePercent === 0) balanceIndex = 24;
		else if (balancePercent < 0) balanceIndex = 23 - Math.round(Math.abs(balancePercent) * 23);
		else balanceIndex = 24 + Math.round(balancePercent * 23);
		log('balancePercent', balancePercent, 'balanceIndex=' + balanceIndex);
		this.sendCommand(this.id, 'BALANCE', [balanceIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	startTimer(ms, color1, color2) {
		this.sendCommand(this.id, 'TIMER', [ms, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
	}
	
	cancelTimer() {
		this.sendCommand(this.id, 'TIMER', [0]);
	}
	
	setKnobHoldThreshold(th) {
		this.setState({knobHoldThreshold: th});
	}
	
	setButtonHoldThreshold(th) {
		this.setState({buttonHoldThreshold: th});
	}
	
	destroy() {
		this.disconnect();
		this.log('destroying');
		this._removeEvents();
		delete this.state;
		let id = this.id;
		delete spinIds[id];
	}
	
	
	static onSpinConnected(id) {
		let spin = TransportSpin.spinIds[id];
		// console.log('onSpinConnected', id);
		// process.exit();
		if (spin) spinMonitor.emit('spin-connected', spin);
	}
	static onSpinDisconnected(id) {
		let spin = TransportSpin.spinIds[id];
		if (spin) spinMonitor.emit('spin-disconnected', spin);
	}
	
	static connect(callback) {
		spinMonitor.on('spin-connected', callback);
	}
}

TransportSpin.spinIds = spinIds;

module.exports = TransportSpin;