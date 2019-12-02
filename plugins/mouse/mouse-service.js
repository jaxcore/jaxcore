const Service = require('../../lib/client');
const {createLogger} = require('../../lib/logger');
const robot = require("robotjs");

let mouseInstance = null;

const schema = {
	id: {
		type: 'string',
		defaultValue: 'mouse'
	},
	connected: {
		type: 'boolean',
		defaultValue: false
	},
	mouse: {
		type: 'number',
		defaultValue: 1234
	}
};

class MouseService extends Service {
	constructor(defaults, store) {
		super(schema, store, defaults);
		// super(defaults);
		// this.createStore('Mouse Store', true);
		
		this.log = createLogger('Mouse');
		this.log('created');
		
		// this.setStates({
		// 	id: {
		// 		type: 'string',
		// 		defaultValue: 'mouse'
		// 	},
		// 	connected: {
		// 		type: 'boolean',
		// 		defaultValue: false
		// 	}
		// }, defaults);
		
		// this.id = this.state.id
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
	
	destroy() {
		this.emit('teardown');
		mouseInstance = null;
	}
	
	static id() {
		return 'mouse';
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		if (!mouseInstance) {
			console.log('CREATE MOUSE');
			mouseInstance = new MouseService(serviceConfig, serviceStore);
		}
		callback(null, mouseInstance);
	}
	
	static destroyInstance(serviceId, serviceConfig) {
		if (mouseInstance) {
			mouseInstance.destroy();
		}
	}
}

MouseService.prototype.moveMouse = robot.moveMouse.bind(robot);
MouseService.prototype.dragMouse = robot.dragMouse.bind(robot);
MouseService.prototype.mouseToggle = robot.mouseToggle.bind(robot);
MouseService.prototype.mouseClick = robot.mouseClick.bind(robot);
MouseService.prototype.getMousePos = robot.getMousePos.bind(robot);
MouseService.prototype.getScreenSize = robot.getScreenSize.bind(robot);
MouseService.prototype.scroll = robot.scrollMouse.bind(robot);

module.exports = MouseService;

