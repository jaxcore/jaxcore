const Client = require('../../lib/client');
const Store = require('../../lib/store');
const {createClientStore} = Store;
const {createLogger} = require('../../lib/logger');
const WebsocketTransport = require('./websocket-transport');
const WebsocketSpin = require('./websocket-spin');
const io = require('socket.io-client');

const log = createLogger('WebSocketClient');

let transportSpinStore;
let socketTransport;

transportSpinStore = createClientStore('WebsocketSpin Store');
socketTransport = new WebsocketTransport(WebsocketSpin, transportSpinStore);

const schema = {
	id: {
		type: 'string'
	},
	host: {
		type: 'string'
	},
	port: {
		type: 'integer'
	},
	options: {
		type: 'object'
	},
	connected: {
		type: 'boolean'
	}
};

let _instance = 0;

const clients = {};

global.websocketClients = clients;

class WebsocketClient extends Client {
	constructor(defaults, store) {
		super(schema, store, defaults);
		
		this.log = createLogger('WebsocketClient ' + (_instance++));
		this.log('create', defaults);
		this._instance = _instance;
		clients[this.state.id] = this;
	}
	
	connect() {
		let socketConfig = this.state;
		const url = socketConfig.protocol + '://' + socketConfig.host + ':' + socketConfig.port;
		this.log('connecting websocket ' + url + ' ...');
		
		const socket = io.connect(url, socketConfig.options);
		this.socket = socket;
		
		const onSpinCommand = function(id, method, args) {
			//console.log('RECEIVED SPIN COMMAND', id, method, args);
			socket.emit('spin-command', id, method, args);
		};
		
		const onSpinConnect = function(id, state) {
			let spin = socketTransport.connectSpin(id, state);
			//log('spin-connect spin created', spin.id);
			
			spin.once('connect', function() {
				spin.on('disconnect', function() {
					socketTransport.removeListener('spin-command-'+id, onSpinCommand);
				});
				socketTransport.on('spin-command-'+id, onSpinCommand);
				WebsocketSpin.onSpinConnected(id);
			}, 'connect');
			
			spin.connect();
		};
		
		const onSpinDisconnect = function(id, state) {
			//log('ON spin-disconnect', id, state);
			
			WebsocketSpin.onSpinDisconnected(id);
			
			socket.removeListener('spin-update', onSpinUpdate);
			socket.removeListener('spin-disconnect', onSpinDisconnect);
			
			socketTransport.removeListener('spin-command-'+id, onSpinCommand);
		};
		
		const onSpinUpdate = function(id, changes) {
			//console.log('spin-update', changes);
			
			if ('connected' in changes) {
				if (changes.connected) {
					onSpinConnect(id, changes);
				}
				else {
					console.log('spin-update disconnecting', changes);
					
					socketTransport.disconnectSpin(id, changes);
				}
			}
			else {
				socketTransport.updateSpin(id, changes);
			}
		};
		
		socket.once('connect', () => {
			log('socket connect');
			// debugger;
			
			socketTransport.socketConnected(socket);
			
			socket.on('spin-update', onSpinUpdate);
			socket.on('spin-disconnect', onSpinDisconnect);
			socket.on('spin-connect', onSpinConnect);
			
			this.emit('connect', socket);
		});
		
		socket.once('disconnect', () => {
			log('socket disconnect');
			// debugger;
			
			socketTransport.socketDisconnected(socket);
			
			socket.removeListener('spin-update', onSpinUpdate);
			socket.removeListener('spin-disconnect', onSpinDisconnect);
			socket.removeListener('spin-connect', onSpinConnect);
			
			// debugger;
			socket.destroy();
			
			this.emit('disconnect');
		});
		
		return socket;
	};
	
	
	destroy() {
		this.emit('teardown');
		if (this.socket) this.socket.destroy();
		this.removeAllListeners();
		delete this.socket;
		delete clients[this.state.id];
		// debugger;
	}
	
	static id(serviceConfig) {
		return 'wsc:'+serviceConfig.host+':'+serviceConfig.port;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		log('WebsocketClientService getOrCreateInstance', serviceId, serviceConfig);
		
		if (serviceId in clients) {
			console.log('wsc', serviceId, 'exists');
			process.exit();
			callback(null, clients[serviceId], false);
		}
		else {
			log('CREATE WSC', serviceId, serviceConfig);
			
			var instance = WebsocketClient.create(serviceConfig, serviceStore);
			
			log('CREATED WSC CLIENT', instance);
			
			callback(null, clients[serviceId], true);
			
			// instance.on('connect', function() {
			// 	// console.log('hix');
			// 	// process.exit();
			// 	if (callback) callback(null, instance, true);
			// });
			//
			// instance.connect();
			
		}
		// if (serviceInstance.clients[serviceId]) {
		// 	let instance = serviceInstance.clients[serviceId];
		// 	log('RETURNING WSC CLIENT', instance);
		// 	// process.exit();
		// 	return instance;
		// }
		// else {
		
		// }
	}
	
	
	static create(config, serviceStore) {
		var id = WebsocketClient.id(config);
		config.id = id;
		log('create wsc', id);
		
		// console.log('serviceStore', serviceStore);
		// process.exit();
		
		if (!transportSpinStore) {
			
			// serviceInstance = new WebsocketClientService();
		}
		
		let client = new WebsocketClient(config, serviceStore);
		
		// clients[id].once('disconnect', () => {
		// 	debugger;
		// 	log('wsc disconnect');
		// 	delete
		// });
		
		return client;
	}
	
	// static startService() {
	//
	// }
	
	// static destroyInstance(serviceId, serviceConfig) {
	// 	if (volumeInstance) {
	// 		volumeInstance.destroy();
	// 		volumeInstance = null;
	// 	}
	// }
}

module.exports = WebsocketClient;