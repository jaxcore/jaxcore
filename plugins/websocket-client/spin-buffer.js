// var Jaxcore = require('jaxcore');
// var {createLogger} = require('jaxcore');
// var log = plugin.createLogger('Spin Buffer');
const {createLogger} = require('../../lib/logger');
// const Jaxcore = require('jaxcore');
// console.log('Jaxcore',Jaxcore);
// process.exit();

var _instance = 0;

function SpinBuffer(spin, config) {
	// if (!createLogger) {
	// 	console.log('no c', createLogger);
	// 	process.exit();
	// }
	this.log = createLogger('Spin Buffer ' + (_instance++));
	this.log('created buffer');
	this._spin = spin;
	this.delayTime = 0;
	this.spinDelayed = false;
	
	this.staticBuffer = 0;
	this.kineticBuffer = 0;
	this.spinDirection = 0;
	// this.lastSpinTime = 0;
	if (!config) config = {};
	this.defaultDelay = config.defaultDelay || 500;
	this.staticTimeout = config.staticTimeout || 2000;
	this.delayLength = this.defaultDelay;
	
	// this._onPushKnob = this.onPushKnob.bind(this);
	// spin.on('knob', this._onPushKnob);
	
	// var me = this;
	// this.destroy = function() {
	// 	spin.removeListener('knob', me._onPushKnob);
	// };
}

SpinBuffer.prototype = {};


SpinBuffer.prototype.reset = function (forceStatic) {
	this.staticBuffer = 0;
	this.kineticBuffer = 0;
	if (forceStatic) {
		this.spinDirection = 0;
	}
};

// SpinBuffer.prototype.onPushKnob = function() {
// 	this.log('reset');
// 	this.reset();
// };

SpinBuffer.prototype.buffer = function (diff, kineticBufferLimit, staticBufferLimit, momentumTimeout, momentumBuffer) {
	var direction = diff > 0 ? 1 : -1;
	var adiff = Math.abs(diff);
	var fn;
	var origStaticBufferLimit = staticBufferLimit;
	
	// if (kineticBufferLimit===0 && staticBufferLimit === 0 && momentumTimeout === 0) {
	//
	// }
	
	if (!kineticBufferLimit) kineticBufferLimit = 0;
	if (typeof staticBufferLimit === 'undefined' || staticBufferLimit === null) {
		if (kineticBufferLimit > 0) staticBufferLimit = kineticBufferLimit;
		else staticBufferLimit = 0;
	}
	kineticBufferLimit += 1;
	staticBufferLimit += 1;
	
	// var timeSinceLastSpin = new Date().getTime() - this.lastSpinTime;
	var timeSinceLastSpin = this._spin.state.timeSinceLastSpin; //new Date().getTime() - this.lastSpinTime;
	
	if (typeof momentumTimeout === 'undefined' || momentumTimeout === null) momentumTimeout = 0;
	if (momentumTimeout > 0 && timeSinceLastSpin > momentumTimeout) {
		if (!momentumBuffer) {
			if (origStaticBufferLimit) {
				momentumBuffer = origStaticBufferLimit;
			}
			else momentumBuffer = 1;
		}
		
		if (this.kineticBuffer >= kineticBufferLimit - momentumBuffer) {
			this.log('momentumTimeout subtract one from this.kineticBuffer', this.kineticBuffer, kineticBufferLimit);
			this.kineticBuffer = kineticBufferLimit - momentumBuffer;
		} else {
			this.log('momentumTimeout not reached limit', this.kineticBuffer, kineticBufferLimit);
		}
	}
	
	// this.lastSpinTime = new Date().getTime();
	// this.lastSpinTime = new Date().getTime();
	
	if (this.isDelayed()) {
		this.reset();
		return 0;
	}
	
	var staticTimeoutExceeded = (timeSinceLastSpin > this.staticTimeout); // after 2 sec reset static buffer
	if (staticTimeoutExceeded) {
		this.log('static timeout exceeded');
		this.reset(true);
	}
	
	var directionChanged = (direction !== this.spinDirection);
	if (directionChanged) {
		
		this.kineticBuffer = 0;
		this.staticBuffer += adiff;
		this.log('static buffer increase', 'this.staticBuffer='+this.staticBuffer, ' + adiff='+adiff);
		
		if (this.staticBuffer >= staticBufferLimit) {
			this.log('static buffer exeeded, spinDirection is now', direction);
			this.spinDirection = direction;
			
			// static direction changed, call fn() once
			
			
			// for remeaining spin events, apply kinetic buffer to determine how many additional times fn() must be called
			var staticOverflow = this.staticBuffer - staticBufferLimit;
			this.staticBuffer = 0;
			this.kineticBuffer = staticOverflow;
			this.log('static buffer', 'staticOverflow this.kineticBuffer now = ', this.kineticBuffer);
			// if (staticOverflow > 1) staticOverflow -= 1;  // subtract 1 t
			
			let count = 1;
			
			if (this.kineticBuffer >= kineticBufferLimit) {
				var kineticOoverflow = this.kineticBuffer - kineticBufferLimit;
				this.log('static kineticBufferLimit also exceeded by kineticOoverflow='+kineticOoverflow);
				count += Math.floor(this.kineticBuffer / kineticBufferLimit);
				this.kineticBuffer -= count * kineticBufferLimit;
				if (this.kineticBuffer<0) this.kineticBuffer = 0;
				this.log('static kineticBufferLimit count='+count, 'this.kineticBuffer='+this.kineticBuffer);
				
				// if (fn) {
				// 	// this.log('calling static first fn()', 0);
				// 	// fn(direction, 0, count);
				// 	// this.log('calling statickinetic fn()', count, 'times');
				// 	for (let i = 0; i < count; i++) {
				// 		this.log('calling statickinetic fn()', i);
				// 		fn(direction, i, count);
				// 	}
				// }
			}
			else {
				// if (fn) {
				// 	this.log('static non kinetic calling fn()');
				// 	fn(direction, 0, count);
				// }
			}
			// if (done) {
			// 	this.log('static calling done()');
			// 	done(direction*count);
			// }
			
			return direction*count;
			
			// return true;
		} else {
			// this.log('static buffer :', this.staticBuffer, '-', 'adiff='+adiff);
			this.log('static not exceeded');
			return 0;
		}
	} else {
		if (this.staticBuffer > 0) {
			console.log('staticBuffer > 0 decrease xxxxxxxxxxxxxxxx :', this.staticBuffer, this.kineticBuffer);
			this.staticBuffer -= adiff;
			if (this.staticBuffer < 0) this.staticBuffer = 0;
			// process.exit();
			return 0;
		}
		
		this.kineticBuffer += adiff;
		
		// this.staticBuffer = 0;
		
		this.log('kinetic buffer:', this.kineticBuffer, direction === 1 ? '+' : '-');
		
		if (this.kineticBuffer >= kineticBufferLimit) {
			if (kineticBufferLimit > 0) this.log('kineticBufferLimit exceeded');
			
			var kineticOoverflow = this.kineticBuffer - kineticBufferLimit;
			this.log('kineticBufferLimit exceeded by kineticOoverflow='+kineticOoverflow);
			let count = Math.floor(this.kineticBuffer / kineticBufferLimit);
			this.kineticBuffer -= count * kineticBufferLimit;
			if (this.kineticBuffer<0) this.kineticBuffer = 0;
			this.log('kineticBufferLimit count='+count, 'this.kineticBuffer='+this.kineticBuffer);
			
			if (fn) {
				this.log('calling kinetic fn()', count, 'times');
				for (var i = 0; i < count; i++) {
					this.log('calling kinetic fn()', i);
					fn(direction, i, count);
				}
			}
			
			// this.staticBuffer = 0;
			
			// this.kineticBuffer = 0;
			// this.reset();
			
			// if (done) {
			// 	this.log('kinetic calling done()');
			// 	done(direction*count);
			// }
			return direction*count;
			// return true;
		} else {
			return 0;
		}
	}
};

SpinBuffer.prototype.isDelayed = function () {
	if (this.spinDelayed) {
		let now = this._spin.state.spinTime;
		
		var diff = (now - this.delayTime);
		var d = diff > this.delayLength;
		if (d) {
			this.log('delay timed out', diff);
			this.delayLength = this.defaultDelay;
			this.spinDelayed = false;
			return false;
		} else {
			this.log('delaying for ' + (this.delayLength + ' ' + diff));
			return true;
		}
	} else {
		return false;
	}
};

SpinBuffer.prototype.delay = function (ms) {
	this.delayLength = ms || this.defaultDelay;
	this.log('delaying for ' + this.delayLength + 'ms');
	this.delayTime = new Date().getTime();
	this.spinDelayed = true;
};
SpinBuffer.prototype.cancelDelay = function () {
	this.delayTime = 0;
	this.spinDelayed = false;
};

module.exports = SpinBuffer;