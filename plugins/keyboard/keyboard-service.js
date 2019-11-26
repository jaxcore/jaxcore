const Service = require('../../lib/client');
const {createLogger} = require('../../lib/logger');
const robot = require("robotjs");

let keyboardInstance = null;

const schema = {
	id: {
		type: 'string',
		defaultValue: 'keyboard'
	},
	connected: {
		type: 'boolean',
		defaultValue: false
	}
};

class KeyboardService extends Service {
	constructor(defaults, store) {
		super(schema, store, defaults);
		// this.createStore('Keyboard Store', true);
		
		this.log = createLogger('Keyboard');
		this.log('created');
		
		// this.setStates({
		// 	id: {
		// 		type: 'string',
		// 		defaultValue: 'keyboard'
		// 	},
		// 	connected: {
		// 		type: 'boolean',
		// 		defaultValue: false
		// 	}
		// }, defaults);
		
		// this.id = this.state.id;
	}
	
	
	connect() {
		this.setState({
			connected: true
		});
		this.emit('connect');
	}
	
	disconnect(options) {
		this.log('disconnecting...');
	}
	
	keyPress(k, modifiers) {
		if (modifiers && modifiers.length) {
			this.log('keyTap modifiers', k, modifiers);
			robot.keyTap(k, modifiers);
		}
		else {
			this.log('keyTap', k);
			robot.keyTap(k);
		}
	}
	
	keyPressMultiple(spin, number, k, modifiers) {
		this.log('keyPressMultiple', 'number', number, 'key', k, 'modifiers', modifiers);
		for (let i = 0; i < number; i++) {
			if (modifiers && modifiers.length) robot.keyTap(k, modifiers);
			else robot.keyTap(k);
		}
	}
	
	keyToggle() {
		let args = Array.prototype.slice.call(arguments);
		robot.keyToggle.apply(robot, args);
	}
	
	destroy() {
		this.emit('teardown');
		keyboardInstance = null;
	}
	
	static id(config, store) {
		return 'keyboard';
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		if (!keyboardInstance) {
			console.log('CREATE KEYBOARD', 'serviceStore=', serviceStore);
			keyboardInstance = new KeyboardService(serviceConfig, serviceStore);
		}
		callback(null, keyboardInstance);
	}
	
	static destroyInstance(serviceId, serviceConfig) {
		if (keyboardInstance) {
			keyboardInstance.destroy();
		}
	}
}

module.exports = KeyboardService;

