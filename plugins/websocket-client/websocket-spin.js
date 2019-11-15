const {Client, createLogger, createClientStore} = require('jaxcore-plugin');
const SpinBuffer = require('jaxcore-spin/lib/buffer');
const EventEmitter = require('events');
const spinMonitor = new EventEmitter();

const log = createLogger('WebsocketSpin');

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

class WebsocketSpin extends Client {
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
		
		this.deviceType = 'spin';
		
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
		if (!this.transport.connectSpin) {
			console.log('no this.transport.connectSpin');
			process.exit();
		}
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
		args.unshift(this.id);
		this.transport.sendCommand(this, args);
	}
	
	orbit(direction, speed, color1, color2) {
		// this.log('client orbit(', direction, speed, color1, color2);
		this.sendCommand('ORBIT', direction, speed, color1, color2);
	}
	
	flash(color) {
		this.sendCommand('FLASH', color);
	}
	
	quickFlash(color, repeat) {
		if (!repeat) repeat = 1;
		this.sendCommand('QUICKFLASH', color.join(',') + ',' + repeat);
	}
	
	lightsOn(color) {
		this.sendCommand('LIGHTSON', color);
	}
	
	lightsOff() {
		this.sendCommand('LIGHTSOFF');
	}
	
	setBrightness(brightness) {
		this.sendCommand('BRIGHTNESS', brightness);
	}
	
	rainbow(rotations) {
		this.sendCommand('RAINBOW', rotations);
	}
	
	rotate(diff, color1, color2) {
		// this._rotationIndex += diff;
		// if (this._rotationIndex <= 0 || this._rotationIndex >= 16384) this._rotationIndex = 8192;
		// this.sendCommand('ROTATE', [this._rotationIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
		// this.sendCommand('ROTATE', [this._rotationIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
		this.sendCommand('ROTATE', diff, color1, color2);
	}
	
	scale(scalePercent, color1, color2, color3) {
		if (scalePercent < 0) scalePercent = 0;
		if (scalePercent > 1) scalePercent = 1;
		var scaleIndex = Math.round(scalePercent * 25);
		this.sendCommand('SCALAR', [scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	// scale (percent, color1, color2, color3) {
	// 	this.sendCommand('SCALAR', percent, color1, color2, color3);
	// }
	
	dial(scalePercent, color1, color2, color3) {
		if (scalePercent < 0) scalePercent = 0;
		if (scalePercent > 1) scalePercent = 1;
		var scaleIndex = Math.round(scalePercent * 25);
		log('dial', scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]);
		this.sendCommand('DIAL', [scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	orbit(direction, speed, color1, color2) {
		if (this.bleDevice) this.bleDevice.orbit(direction, speed, color1, color2);
		else this.sendCommand('ORBIT', [direction === 1 ? 1 : 0, speed, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
	}
	
	
	balance(balancePercent, color1, color2, color3) {
		var balanceIndex;
		if (balancePercent === 0) balanceIndex = 24;
		else if (balancePercent < 0) balanceIndex = 23 - Math.round(Math.abs(balancePercent) * 23);
		else balanceIndex = 24 + Math.round(balancePercent * 23);
		log('balancePercent', balancePercent, 'balanceIndex=' + balanceIndex);
		this.sendCommand('BALANCE', [balanceIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	startTimer(ms, color1, color2) {
		this.sendCommand('TIMER', [ms, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
	}
	
	cancelTimer() {
		this.sendCommand('TIMER', [0]);
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
		let spin = WebsocketSpin.spinIds[id];
		console.log('onSpinConnected', id);
		// process.exit();
		
		if (spin) {
			console.log('spinMonitor emit spin-connected', id);
			// process.exit();
			spinMonitor.emit('spin-connected', spin);
		}
	}
	static onSpinDisconnected(id) {
		let spin = WebsocketSpin.spinIds[id];
		if (spin) spinMonitor.emit('spin-disconnected', spin);
	}
	
	static connect(callback) {
		console.log('spinMonitor waiting for on spin-connected');
		spinMonitor.on('spin-connected', callback);
	}
	
	static startJaxcoreDevice(ids, deviceStore, callback) {
		console.log('WebsocketSpin startJaxcoreDevice', deviceStore);
		// process.exit();
		// ble.connectBLE(store, Spin.create, spinIds, callback);
		// websocketClient.on('connect', function() {
		//
		// });
		// websocketClient.connect();
		
		WebsocketSpin.connect(function(spin) {
			console.log('transport spin connected', spin.id);
			
			callback(spin);
			
			// function onSpin(diff, time) {
			// 	console.log('transport ON SPIN', diff, time);
			// }
			// function onButton(pushed) {
			// 	console.log('transport ON BUTTON', pushed);
			// }
			// function onKnob(pushed) {
			// 	console.log('transport ON KNOB', pushed);
			// }
			// spin.on('spin', onSpin);
			// spin.on('button', onButton);
			// spin.on('knob', onKnob);
			//
			// spin.once('disconnect', function() {
			// 	console.log('final disconnected');
			//
			// 	spin.removeListener('spin', onSpin);
			// 	spin.removeListener('button', onButton);
			// 	spin.removeListener('knob', onKnob);
			// });
		});
	}
}

WebsocketSpin.spinIds = spinIds;

module.exports = WebsocketSpin;