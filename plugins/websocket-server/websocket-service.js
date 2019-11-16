const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const {Service, createLogger} = require('jaxcore-plugin');
const app = express();

const socketServer = http.createServer(app);

const Spin = require('jaxcore-spin');

const schema = {
	id: {
		type: 'string',
		defaultValue: ''
	},
	connected: {
		type: 'boolean',
		defaultValue: false
	},
	port: {
		type: 'number',
		defaultValue: 0
	},
	connectedSpins: {
		type: 'object'
	}
};

const websocketInstances = {};

class WebsocketService extends Service {
	constructor(defaults, store) {
		super(schema, store, defaults);
		this.log = createLogger('Websocket Service');
		this.log('created');
		this._onConnect = this.onConnect.bind(this);
		this._onDisconnect = this.onDisconnect.bind(this);
		this._onSpinCcommand = this.onSpinCcommand.bind(this);
	}
	
	connect() {
		const options = this.state.options;
		
		// this.io = socketIO(socketServer, options);
		this.io = socketIO(socketServer, options);
		
		this.io.on('connection', this._onConnect);
		
		this.log('starting on port', this.state.port, options);
		
		socketServer.listen(this.state.port, options, () => {
			this.log('Socket server listening on : ' + this.state.port);
			
			this.setState({
				connected: true
			});
			
			this.emit('connect');
		});
	}
	
	onSpinCcommand(id, method, args) {
		console.log('SPIN-COMMAND', id, method, args);
		let spin = Spin.spinIds[id];
		if (spin.state.connected) {
			spin.processCommand(method, args);
		}
	}
	
	onConnect(socket) {
		this.log('Socket connected', socket.id, socket.handshake.headers.host, socket.handshake.headers['user-agent']);
		
		this.log('socket', socket.conn.remoteAddress);
		// '::ffff:192.168.1.29',
		if (this.state.allowClients && this.state.allowClients.length) {
			if (this.state.allowClients.indexOf(socket.conn.remoteAddress) === -1) { //} !== '::ffff:127.0.0.1') {
				this.log('invalid remote address', socket.conn.remoteAddress, 'allowed clients are:', this.state.allowClients);
				// this.log('socket', socket);
				// socket.disconnect();
				process.exit();
				return;
			}
		}
		
		socket.once('disconnect', () => {
			this.log('socket disconnected');
			socket.removeListener('spin-command', this._onSpinCcommand);
		});
		
		socket.on('spin-command', this._onSpinCcommand);
		
		for (let id in this.state.connectedSpins) {
			let spin = Spin.spinIds[id];
			if (spin.state.connected) {
				socket.emit('spin-update', id, spin.state);
			}
		}
		// socket.emit('connected-spins', this.state.connectedSpins);
	};
	
	onDisconnect(socket) {
		this.log('Socket disconnected x', socket);
		// process.exit();
		// socket.on('disconnect', this._onDisconnect);
		socket.off('spin-command', this._onSpinCcommand);
	};
	
	connectSpin(spin) {
		this.log('Spin connected to websocket', spin.id);
		const {connectedSpins} = this.state;
		connectedSpins[spin.id] = true;
		this.setState(connectedSpins);
		
		this.io.emit('spin-connect', spin.id, spin.state);
	}
	disconnectSpin(spin) {
		this.log('Spin disconnected from websocket', spin.id);
		const {connectedSpins} = this.state;
		delete connectedSpins[spin.id];
		this.setState(connectedSpins);
		
		this.io.emit('spin-disconnect', spin.id);
	}
	
	spinUpdate(spin, changes) {
		this.log('Spin changes', changes);
		this.io.emit('spin-update', spin.id, changes);
	}
	
	
	
	disconnect(options) {
		this.log('disconnecting...');
	}
	
	destroy() {
		this.emit('teardown');
		
	}
	
	static id(serviceConfig) {
		return 'websocket:'+serviceConfig.port;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		let websocketInstance;
		
		if (serviceId in websocketInstances) {
			websocketInstance = websocketInstances[serviceId];
		}
		else {
			console.log('CREATE WEBSOCKET', serviceConfig);
			websocketInstance = new WebsocketService(serviceConfig, serviceStore);
		}
		callback(null, websocketInstance);
	}
	
	static destroyInstance(serviceId, serviceConfig) {
		if (websocketInstances[serviceId]) {
			websocketInstances[serviceId].destroy();
			delete websocketInstances[serviceId];
		}
	}
}

// WebsocketService.prototype.connect = function(config, callback) {
// 	var me = this;
//
// 	// this.listen = new Listen({
// 	// 	path: config.modelPath  //__dirname+'/../../jaxcore-listen/models'
// 	// });
//
// 	if (config.ids) {
// 		this.validIds = config.ids;
// 	}
// 	else this.validIds = null;
//
// 	io.on('connection', function (socket) {
// 		log('Socket connection established');
// 		me.onConnect(socket);
// 	});
//
// 	socketServer.listen(config.port, function () {
// 		log('Socket server listening on : ' + config.port);
// 		callback();
// 	});
//
// 	const spinCreate = function(id, state) {
// 		if (me.isValidId(id)) {
// 			log('SEND spin created', id, state);
// 			me.emit('spin-created', id, state);
// 		}
// 		else log('spinCreate invalid id', id);
// 	};
// 	const spinUpdate = function(id, state) {
// 		if (me.isValidId(id)) {
// 			log('SEND spin update', id, state);
// 			me.emit('spin-update', id, state);
// 		}
// 		else log('spinUpdate invalid id', id);
// 	};
// 	const spinDestroy = function(id, state) {
// 		if (me.isValidId(id)) {
// 			log('SEND spin destroyed', id);
// 			me.emit('spin-destroyed', id, state);
// 		}
// 		else log('spinDestroy invalid id', id);
// 	};
//
// 	Spin.store.addListener('created', spinCreate);
// 	Spin.store.addListener('update', spinUpdate);
// 	Spin.store.addListener('destroyed', spinDestroy);
// };


// WebsocketService.prototype.onConnect = function(socket) {
//
// 	// var listen = this.listen;
//
// 	var me = this;
//
// 	socket.emit('spin-store', this.getSpinStore());
//
// 	socket._onCreated = function (id, state) {
// 		socket.emit('spin-created', id, state);
// 	};
// 	socket._onUpdate = function (id, state) {
// 		socket.emit('spin-update', id, state);
// 	};
// 	socket._onDestroyed  = function (id, state) {
// 		socket.emit('spin-destroyed', id, state);
// 	};
//
// 	this.addListener('spin-created', socket._onCreated);
// 	this.addListener('spin-update', socket._onUpdate);
// 	this.addListener('spin-destroyed', socket._onDestroyed);
//
// 	socket._onStore = function () {
// 		socket.emit('spin-store',  me.getSpinStore());
// 	};
// 	socket.on('get-spin-store', socket._onStore);
//
// 	// socket.on('spin', this._callSpinMethod);
//
// 	socket._onSpinCommand = function(command) {
// 		let id = command.id;
// 		let method = command.method;
// 		let args = command.args;
// 		if (id in Spin.spinIds) {
// 			console.log('spin-command', id, method, args);
// 			Spin.spinIds[id].sendCommand(id, method, args);
// 		}
// 		else {
// 			console.log('could not find ', id);
// 			process.exit();
// 		}
// 	};
//
// 	socket.on('spin-command', socket._onSpinCommand);
//
// 	const listenOnRecognize = function (text) {
// 		console.log('\nService Recognized as:', text);
// 		if (text.length>0) {
// 			console.log('sockdet emit listen-recognized', text);
// 			socket.emit('listen-recognized', text);
// 		}
// 		else {
// 			console.log('nothing recognized');
// 		}
// 	};
// 	// const listenOnStart = function () {
// 	// 	socket.emit('listen-start');
// 	// };
// 	// const listenOnStop = function () {
// 	// 	socket.emit('listen-stop');
// 	// };
// 	// const listenOnStartContinuous = function () {
// 	// 	socket.emit('listen-start-continuous');
// 	// };
// 	// const listenOnStopContinuous = function () {
// 	// 	socket.emit('listen-stop-continuous');
// 	// };
//
// 	socket._onListenCommand = function(listenCommand) {
// 		let command = listenCommand.command;
// 		let options = listenCommand.options;
//
// 		if (command === 'start') {
// 			console.log('Listen starting');
//
// 			// listen.once('recognize', listenOnRecognize);
//
// 			// listen.once('start', function() {
// 			// 	socket.emit('listen-start');
// 			// });
// 			// listen.start(); // todo: add options
// 		}
// 		else if (command === 'stop') {
// 			console.log('Listen stop');
// 			// listen.once('stop', function() {
// 			// 	socket.emit('listen-stop');
// 			// 	console.log('stoppp!!!');
// 			// 	process.exit();
// 			// });
// 			// // listen.removeListener('recognize', listenOnRecognize);
// 			// listen.stop();
// 		}
// 		else if (command === 'start-continuous') {
// 			console.log('Listen continuous starting');
// 			// listen.on('recognize', listenOnRecognize);
// 			// listen.once('start-continunous', function() {
// 			// 	socket.emit('listen-start-continuous');
// 			// });
// 			// listen.startContinuous(options);
// 		}
// 		else if (command === 'stop-continuous') {
// 			console.log('Listen continuous stopping');
// 			// listen.once('stop-continunous', function() {
// 			// 	socket.emit('listen-stop-continuous');
// 			// 	listen.removeListener('recognize', listenOnRecognize);
// 			// });
// 			// listen.stopContinuous();
// 		}
// 		else {
// 			console.log('listen command not recognized', command);
// 			process.exit();
// 		}
// 	};
//
// 	socket.on('listen-command', socket._onListenCommand);
//
// 	socket._onDisconnect = function() {
// 		log('socket DISCONNECT', socket.request.session);
//
// 		me.removeListener('spin-created', socket._onCreated);
// 		me.removeListener('spin-update', socket._onUpdate);
// 		me.removeListener('spin-destroyed', socket._onDestroyed);
//
// 		// socket.removeListener('spin', me._callSpinMethod);
// 		socket.removeListener('get-spin-store', socket._onStore);
//
// 		socket.removeListener('spin-command', socket._onSpinCommand);
//
// 		socket.removeListener('listen-command', socket._onListenCommand);
//
// 		socket.removeListener('disconnect', this._onDisconnect);
// 	};
// 	socket.on('disconnect', socket._onDisconnect);
// };

module.exports = WebsocketService;
