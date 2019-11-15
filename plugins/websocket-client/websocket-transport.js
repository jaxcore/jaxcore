const EventEmitter = require('events');
const {createLogger} = require('jaxcore-plugin');
const log = createLogger('WebsocketTransport');

class WebsocketTransport extends EventEmitter {
	constructor(TransportSpin, spinStore) {
		super();
		this.TransportSpin = TransportSpin;
		this.spinStore = spinStore;
	}
	
	createSpin(id, state) {
		if (id in this.TransportSpin.spinIds) {
			// return spinIds[id];
		}
		else {
			if (state && state.connected) state.connected = false;
			log('TransportSpin.createSpin', typeof id, id, typeof state, state);
			
			let device = {
				transport: this,
				id
			};
			return new this.TransportSpin(device, this.spinStore, state);
		}
	}
	
	connectSpin(id, state) {
		if (state && state.connected) state.connected = false;
		
		if (id in this.TransportSpin.spinIds) {
			log('TransportSpin.connectSpin', id, state);
			
			let spin = this.TransportSpin.spinIds[id];
			spin.setState(state);
			return spin;
		}
		else {
			log('connectSpin CREATING', id, state);
			return this.createSpin(id, state);
		}
	}
	
	updateSpin(id, changes) {
		if (!changes) {
			log('no changes?');
			return;
		}
		
		if (id in this.TransportSpin.spinIds) {
			// log('SPIN UPDATING', id, changes);
			
			let spin = this.TransportSpin.spinIds[id];
			spin.setState(changes);
			if ('knobPushed' in changes) {
				log('emit button', changes.knobPushed);
				spin.emit('knob', changes.knobPushed);
			}
			if ('buttonPushed' in changes) {
				// log('emit button pushed', spin.state.id, changes.buttonPushed);
				log('emit button', changes.buttonPushed);
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
				log('emit spin', diff, time);
				spin.emit('spin', diff, time);
			}
			
			if ('knobHold' in changes) {
				log('emit knob', changes.knobHold);
				spin.emit('knob-hold', changes.knobHold);
			}
			if ('buttonHold' in changes) {
				log('emit button', changes.buttonHold);
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
			log('updateSpin CREATING', id, changes);
			return this.createSpin(id, changes);
		}
		
	}
	
	disconnectSpin(id, changes) {
		log('disconnectSpin', id, changes);
		if (id in this.TransportSpin.spinIds) {
			let spin = this.TransportSpin.spinIds[id];
			changes.connected = false;
			spin.setState(changes);
			this.emit('spin-disconnected', spin);
			spin.emit('disconnect');
		}
	}
	
	update(id, changes) {
		log('transport update', id, changes);
		
		var spin = this.Spin.spinIds[id];
		
		for (let c in changes) {
			spin.state[c] = changes[c];
		}
		
		// log('update changed', changed);
		
		if ('knobPushed' in changes) {
			spin.emit('knob', changes.knobPushed);
		}
		if ('buttonPushed' in changes) {
			// log('emit button pushed', spin.state.id, changes.buttonPushed);
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
		
		log('update', changes);
		spin.emit('update', changes);
	}
	
	sendCommand(spin, args) {
		log('WebsocketTransport sendCommand', args);
		
		let id = args.shift();
		let method = args.shift();
		// this.emit('spin-command', id, method, args);
		log('emit spin-command-'+id, method, args);
		this.emit('spin-command-'+id, id, method, args);
	}
	
}

module.exports = WebsocketTransport;