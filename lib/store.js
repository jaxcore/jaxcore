var EventEmitter = require('events');
var createLogger = require('./logger').createLogger;

function Store(name, singleton) {
	this.constructor();
	this.log = createLogger(name);
	this.log('created');
	this.ids = {};
	this._singleton = !!singleton;
}
Store.prototype = new EventEmitter(); // todo: no longer need EventEmitter?
Store.prototype.constructor = EventEmitter;

Store.prototype.get = function() {
	let data = {};
	for (let id in this.ids) {
		data[id] = this[id];
	}
	return data;
};

Store.prototype.destroy = function(id) {
	this.log('store destroying', id);
	// this[id].removeAllListeners('created');
	// this[id].removeAllListeners('update');
	delete this.ids[id];
	delete this[id];
	this.log('store emit destroyed', id);
	this.emit('destroyed', id);
};

Store.prototype.set = function(id, data) {
	// console.log('set', id, data);
	if (!id) {
		console.log('no set id', data);
		return;
	}
	var changes = {};
	var hasChanges = false;
	var created = false;
	if (!this[id]) {
		this[id] = data;
		this.ids[id] = true;
		// this.emit('created', id, data);
		this.log('created', id, data);
		hasChanges = true;
		created = true;
		changes = data;
	}
	else {
		var s = this[id];
		for (var i in data) {
			if (s[i] !== data[i]) {
				hasChanges = true;
				changes[i] = s[i] = data[i];
			}
		}
	}
	if (hasChanges) {
		// if (created) {
		// 	// this.emit('created', id, changes);
		// 	// console.log('emit create/update', id, this[id]);
		// }
		// else {
			// console.log('emit update', id, changes);
			this.emit('update', id, changes);
		// }
		// if ('connected' in changes) {
		// 	if (changes.connected) {
		// 		this.emit('connected', id, changes);
		// 	}
		// 	else {
		// 		this.emit('connected', id, changes);
		// 	}
		// }
		// 	// this.log(id + ' update', changes);
		// 	// console.log(id + ' update', changes);
		// }
		
		return changes;
	}
	else {
		// console.log('emit NO CHANGES');
		return null;
	}
};

Store.createStore = function(name) {
	return new Store(name);
};
Store.createClientStore = Store.createStore;
Store.createServiceStore = function(name) {
	return new Store(name, true);
};


module.exports = Store;