const {Service, createLogger, createClientStore} = require('jaxcore-plugin');
const TransportSpin = require('./transport-spin');
const WebsocketTransport = require('./websocket-transport');
const WebsocketClient = require('./websocket-client');
// const io = require('socket.io-client');

const log = createLogger('WebSocketClient');

let transportSpinStore;
let socketTransport;

var serviceInstance;

class WebsocketClientService extends Service {
	constructor(defaults) {
		super(defaults);
		this.log = createLogger('WebsocketClientService');
		this.log('created');
		this.clients = {};
	}
	
	// static connectSocket(socketConfig) {
	// 	const url = socketConfig.protocol + '://' + socketConfig.host + ':' + socketConfig.port;
	// 	console.log('connecting websocket ' + url + ' ...');
	//
	// 	const socket = io.connect(url, socketConfig.options);
	//
	// 	const onConnect = function(id, state) {
	// 		log('ON spin-connect', id, state);
	//
	// 		let spin = socketTransport.connectSpin(id, state);
	// 		console.log('spin-connect CONNECTING...');
	//
	// 		spin.once('connect', function() {
	// 			console.log('onConnect connect', id);
	// 			TransportSpin.onSpinConnected(id);
	// 		}, 'connect');
	// 		spin.connect();
	//
	// 		log('spin-connect spin created', spin);
	// 		// process.exit();
	//
	// 		// TransportSpin.createSpin(this.transport, id, state);
	//
	// 	};
	// 	const onDisconnect = function(id, state) {
	// 		log('ON spin-disconnect', id, state);
	// 		TransportSpin.onSpinDisconnected(id);
	//
	// 		// socket.removeListener('spin-connect', onConnect);
	// 		socket.removeListener('spin-update', onUpdate);
	// 		socket.removeListener('spin-disconnect', onDisconnect);
	// 	};
	//
	// 	const onUpdate = function(id, changes) {
	// 		console.log('spin-update', changes);
	//
	// 		if ('connected' in changes && !changes.connected) {
	// 			console.log('spin-update disconnecting', changes);
	// 			socketTransport.disconnectSpin(id, changes);
	// 		}
	// 		else {
	// 			let spin = socketTransport.updateSpin(id, changes);
	// 			if (!spin.state.connected) {
	// 				console.log('spin-update CONNECTING...');
	// 				spin.once('connect', function () {
	// 					TransportSpin.onSpinConnected(id);
	// 				});
	// 				spin.connect();
	// 			}
	// 		}
	// 	};
	//
	// 	socket.on('connect', function() {
	// 		log('socket connect');
	//
	// 		socket.on('spin-update', onUpdate);
	// 		socket.on('spin-disconnect', onDisconnect);
	// 		socket.on('spin-connect', onConnect);
	//
	// 	});
	//
	// 	socket.on('disconnect', () => {
	// 		log('socket disconnect');
	//
	// 		socket.removeListener('spin-update', onUpdate);
	// 		socket.removeListener('spin-disconnect', onDisconnect);
	// 		socket.removeListener('spin-connect', onConnect);
	// 	});
	//
	// 	return socket;
	// };
	
	create(config, serviceStore) {
		var id = WebsocketClientService.id(config);
		config.id = id;
		
		if (id in this.clients) {
			this.log('client exists', id);
			return;
		}
		
		this.log('create wsc', id);
		
		// console.log('serviceStore', serviceStore);
		// process.exit();
		this.clients[id] = new WebsocketClient(config, serviceStore, socketTransport, transportSpinStore);
		
		// this.clients[id].on('connect', () => {
		// 	this.emit('connect', this.clients[id]);  // TODO: emit connect-client?
		// });
		// this.clients[id].once('disconnect', () => {
		// 	me.emit('disconnect', this.clients[id]);
		// });
		
		return this.clients[id];
	}
	
	// connect(id, callback) {
	// 	if (callback) {
	// 		this.clients[id].on('connect', callback);
	// 	}
	// 	this.clients[id].connect();
	// }
	//
	// disconnect(id, callback) {
	// 	this.clients[id].removeAllListeners('connect');
	// 	this.clients[id].removeAllListeners('disconnect');
	// 	callback();
	// }
	
	static id(serviceConfig) {
		return 'wsc:'+serviceConfig.host+':'+serviceConfig.port;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		log('WebsocketClientService getOrCreateInstance', serviceId, serviceConfig);
		if (!serviceInstance) {
			WebsocketClientService.startService();
		}
		
		if (serviceInstance.clients[serviceId]) {
			let instance = serviceInstance.clients[serviceId];
			log('RETURNING WSC CLIENT', instance);
			// process.exit();
			return instance;
		}
		else {
			log('CREATE WSC', serviceId, serviceConfig);
			var instance = serviceInstance.create(serviceConfig, serviceStore);
			log('CREATED WSC CLIENT', instance);
			callback(null, instance);
		}
	}
	
	static startService() {
		if (!serviceInstance) {
			transportSpinStore = createClientStore('TransportSpin Store');
			socketTransport = new WebsocketTransport(TransportSpin, transportSpinStore);
			serviceInstance = new WebsocketClientService();
		}
	}
	
	// static destroyInstance(serviceId, serviceConfig) {
	// 	if (volumeInstance) {
	// 		volumeInstance.destroy();
	// 		volumeInstance = null;
	// 	}
	// }
}

module.exports = WebsocketClientService;