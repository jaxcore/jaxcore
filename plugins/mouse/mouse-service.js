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
		this.log = createLogger('Mouse');
		this.log('created');
	}
	
	connect() {
		this.setState({
			connected: true
		});
		this.emit('connect');
	}
	
	disconnect() {
		this.log('disconnecting...');
		this.setState({
			connected: false
		});
		this.emit('disconnect');
	}
	
	destroy() {
		this.disconnect();
		mouseInstance = null;
	}
	
	scroll(x, y) {
		robot.scrollMouse(-x, -y);
	}
	
	static id() {
		return 'mouse';
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		if (!mouseInstance) {
			mouseInstance = new MouseService(serviceConfig, serviceStore);
		}
		callback(null, mouseInstance);
	}
}

MouseService.prototype.moveMouse = robot.moveMouse.bind(robot);
MouseService.prototype.moveMouseSmooth = robot.moveMouseSmooth.bind(robot);
MouseService.prototype.dragMouse = robot.dragMouse.bind(robot);
MouseService.prototype.mouseToggle = robot.mouseToggle.bind(robot);
MouseService.prototype.mouseClick = robot.mouseClick.bind(robot);
MouseService.prototype.getMousePos = robot.getMousePos.bind(robot);
MouseService.prototype.getScreenSize = robot.getScreenSize.bind(robot);

module.exports = MouseService;

