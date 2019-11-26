let EventEmitter = require('events');
let Store = require('./store');

class Client extends EventEmitter {
	constructor(schema, store, defaults) {
		super();
		if (store) {
			this.setStore(store, store.singleton);
			if (schema) {
				this.setStates(schema, defaults);
				if (this.state.id) this.id = this.state.id;
			}
		}
	}
	
	createStore(name, singleton) {
		let store = new Store(name);
		this.setStore(store, singleton);
	}
	
	setStore(store, singleton) {
		if (singleton) this._setServiceStore(store);
		else this._setClientStore(store);
	}
	_setServiceStore(store) {
		this.store = null;
		this.state = store;
	}
	_setClientStore(store) {
		this.store = store;
	}
	
	setState(data) {
		// console.log('set state', data);
		if (typeof arguments[0] === 'string') {
			// let type = arguments[0];
			// data = arguments[1];
			// let d = Object.assign({}, this.state[type]);
			// this.state[type] = d;
			//
			// let changes = {};
			// changes[type] = {};
			// for (let name in data) {
			// 	if (d[name] !== data[name]) {
			// 		d[name] = data[name];
			// 		changes[type][name] = data[name];
			// 	}
			// }
			//
			// return changes;
		}
		else {
			if (this.store) {
				let id = this.state ? this.state.id : data.id;
				let changes = this.store.set(id, data);
				this.state = this.store[id];
				
				if (changes) this.emit('update', changes, this.state);
				
				return changes;
			}
			else {
				return this._setState(data);
			}
		}
	}
	
	_setState(data) {
		console.log('_setState', data);
		
		const changes = {};
		let hasChanges = false;
		const s = this.state;
		for (let i in data) {
			if (typeof data[i] === 'object' || s[i] !== data[i]) {
				hasChanges = true;
				changes[i] = data[i];
				this.state[i] = data[i];
			}
		}
		if (hasChanges) {
			console.log('spin update', changes);
			this.emit('update', changes, this.state);
			return changes;
		}
		else {
			return null;
		}
	}
	
	getState() {
		return (this.state.id in this.store) ? this.store[this.state.id] : {};
	}
	
	setStates(schema, defaults) {
		let states = {};
		
		this.schema = Object.assign({}, schema);
		let now = new Date().getTime();
		
		for (let state in schema) {
			if (typeof states[state] === 'undefined' && 'defaultValue' in schema[state]) {
				states[state] = schema[state].defaultValue;
			}
			else if (schema[state].type === 'boolean') {
				states[state] = false;
			}
			else if (schema[state].type === 'date') {
				states[state] = now;
			}
			else if (schema[state].type === 'number') {
				states[state] = 0;
			}
			else if (schema[state].type === 'object') {
				states[state] = {};
			}
			else states[state] = null;
		}
		if (defaults) {
			for (let i in defaults) {
				states[i] = defaults[i];
			}
		}
		
		this.setState(states);
	}
}

module.exports = Client;