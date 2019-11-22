const EventEmitter = require('events');
const {createLogger} = require('jaxcore-plugin');

class BrowserTransport extends EventEmitter {
	constructor(WebsocketSpin, spinStore) {
		super();
		this.WebsocketSpin = WebsocketSpin;
		this.spinStore = spinStore;
		this.log = createLogger('BrowserTransport');
		global.browserTransport = this;
	}
	
	createSpin(id, state) {
		if (id in this.WebsocketSpin.spinIds) {
			// return spinIds[id];
		}
		else {
			if (state && state.connected) state.connected = false;
			this.log('WebsocketSpin.createSpin', typeof id, id, typeof state, state);
			
			let device = {
				transport: this,
				id
			};
			this.log('createSpin', id);
			if (typeof id !== 'string') {
				debugger;
				return;
			}
			let spin = new this.WebsocketSpin(device, this.spinStore, state);
			this.WebsocketSpin.onSpinConnected(id);
			return spin;
		}
	}
	
	connectSpin(id, state) {
		this.log('connectSpin', id, state);
		
		if (state && state.connected) state.connected = false;
		
		if (id in this.WebsocketSpin.spinIds) {
			this.log('WebsocketSpin.connectSpin', id, state);
			
			let spin = this.WebsocketSpin.spinIds[id];
			spin.setState(state);
			
			this.WebsocketSpin.onSpinConnected(id);
			return spin;
		}
		else {
			this.log('connectSpin CREATING', id, state);
			// debugger;
			return this.createSpin(id, state);
		}
	}
	
	updateSpin(id, changes) {
		if (!changes) {
			this.log('no changes?');
			return;
		}
		
		
		
		if (id in this.WebsocketSpin.spinIds) {
			this.log('SPIN UPDATING', id, changes);
			
			let spin = this.WebsocketSpin.spinIds[id];
			spin.setState(changes);
			
			// if ('connected' in changes) {
			// 	if (changes.connected) this.WebsocketSpin.onSpinConnected(id);
			// 	else this.WebsocketSpin.onSpinDisconnected(id);
			// }
			
			if ('knobPushed' in changes) {
				this.log('spin emit button', changes.knobPushed);
				spin.emit('knob', changes.knobPushed);
			}
			if ('buttonPushed' in changes) {
				// this.log('emit button pushed', spin.state.id, changes.buttonPushed);
				this.log('spin emit button', changes.buttonPushed);
				spin.emit('button', changes.buttonPushed);
			}
			if ('spinPosition' in changes) {
				let previousSpinPosition;
				if ('previousSpinPosition' in changes) previousSpinPosition = changes.previousSpinPosition;
				else previousSpinPosition = spin.state.previousSpinPosition;
				
				let previousSpinTime;
				if ('previousSpinTime' in changes) previousSpinTime = changes.previousSpinTime;
				else previousSpinTime = spin.state.previousSpinTime;
				
				let diff = spin.state.spinPosition - previousSpinPosition;
				let time = spin.state.spinTime - previousSpinTime;
				if (!isNaN(diff)) {
					this.log('spin emit spin', diff, time);
					spin.emit('spin', diff, time);
				}
			}
			
			if ('knobHold' in changes) {
				this.log('emit knob', changes.knobHold);
				spin.emit('knob-hold', changes.knobHold);
			}
			if ('buttonHold' in changes) {
				this.log('emit button', changes.buttonHold);
				spin.emit('button-hold', changes.buttonHold);
			}
			
			if ('connected' in changes) {
				if (changes.connected) {
					this.emit('spin-connected', spin);
					spin.emit('connect');
				}
				else {
					this.emit('spin-disconnected', spin);
					spin.emit('disconnect');
				}
			}
			
			return spin;
		}
		else {
			this.log('updateSpin CREATING', id, changes);
			// debugger;
			return this.createSpin(id, changes);
		}
		
	}
	
	disconnectSpin(id, changes) {
		this.log('disconnectSpin', id, changes);
		if (id in this.WebsocketSpin.spinIds) {
			let spin = this.WebsocketSpin.spinIds[id];
			if (!changes) changes = {};
			changes.connected = false;
			spin.setState(changes);
			this.emit('spin-disconnected', spin);
			spin.emit('disconnect');
			this.WebsocketSpin.onSpinConnected(id);
		}
		else {
			this.log('invalid id', id, this.WebsocketSpin.spinIds);
		}
	}
	
	update(id, changes) {
		this.log('transport update', id, changes);
		
		var spin = this.WebsocketSpin.spinIds[id];
		
		for (let c in changes) {
			spin.state[c] = changes[c];
		}
		
		// this.log('update changed', changed);
		
		if ('knobPushed' in changes) {
			spin.emit('knob', changes.knobPushed);
		}
		if ('buttonPushed' in changes) {
			// this.log('emit button pushed', spin.state.id, changes.buttonPushed);
			spin.emit('button', changes.buttonPushed);
		}
		if ('spinPosition' in changes) {
			spin._lastSpinPosition = spin.state.spinPosition;
			spin.emit('spin', spin.state.spinDirection, spin.state.spinPosition);
		}
		
		if ('connected' in changes) {
			if (changes.connected) {
				this.emit('spin-connected', spin);
				spin.emit('connect');
			}
			else {
				this.emit('spin-disconnected', spin);
				spin.emit('disconnect');
			}
		}
		
		this.log('update', changes);
		spin.emit('update', changes);
	}
	
	sendCommand(spin, args) {
		let id = args.shift();
		let method = args.shift();
		// this.emit('spin-command', id, method, args);
		this.log('BrowserTransport emit spin-command', id, method, args);
		this.emit('spin-command', id, method, args);
	}
	
	socketConnected(socket) {
		this.socket = socket;
	}
	
	socketDisconnected(socket) {
		this.log('disconnect all', this.WebsocketSpin.spinIds);
		// debugger;
		for (let id in this.WebsocketSpin.spinIds) {
			// if (this.WebsocketSpin.spinIds[id].connected) {
				this.disconnectSpin(id);
			// }
		}
		this.socket = null;
	}
}

module.exports = BrowserTransport;