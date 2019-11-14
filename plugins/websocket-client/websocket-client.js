const {Client, createLogger} = require('jaxcore-plugin');
const TransportSpin = require('./transport-spin');
const WebsocketTransport = require('./websocket-transport');
const io = require('socket.io-client');

const log = createLogger('WebSocketClient');

let spinStore;
let socketTransport;

const schema = {
	id: {
		type: 'string',
		defaultValue: ''
	},
	host: {
		type: 'string',
		defaultValue: ''
	},
	port: {
		type: 'integer',
		defaultValue: 0
	},
	connected: {
		type: 'boolean',
		defaultValue: false
	}
};

var _instance = 0;
class WebsocketClient extends Client {
	constructor(defaults, store, socketTransport) {
		super(schema, store, defaults);
		
		this.socketTransport = socketTransport;
		
		this.log = createLogger('WebsocketClient ' + (_instance++));
		this.log('create', defaults);
		
	}
	
	connect() {
		this.log('connecting x', this.state.host + ':' + this.state.port);
		// console.log('wsc state', this.state);
		// process.exit();
		
		// this.setState({
		// 	connecting: true,
		// 	status: 'connecting'
		// });
		// if (!socketTransport) socketTransport = new WebsocketTransport(TransportSpin, spinStore);
		
		let socketConfig = this.state;
		
		const url = socketConfig.protocol + '://' + socketConfig.host + ':' + socketConfig.port;
		this.log('connecting websocket ' + url + ' ...');
		
		const socket = io.connect(url, socketConfig.options);
		
		const socketTransport = this.socketTransport;
		
		const onConnect = function(id, state) {
			log('ON spin-connect', id, state);
			
			let spin = socketTransport.connectSpin(id, state);
			console.log('spin-connect CONNECTING...');
			
			spin.once('connect', function() {
				console.log('onConnect connect', id);
				TransportSpin.onSpinConnected(id);
			}, 'connect');
			spin.connect();
			
			log('spin-connect spin created', spin);
			// process.exit();
			
			// TransportSpin.createSpin(this.transport, id, state);
			
		};
		const onDisconnect = function(id, state) {
			log('ON spin-disconnect', id, state);
			TransportSpin.onSpinDisconnected(id);
			
			// socket.removeListener('spin-connect', onConnect);
			socket.removeListener('spin-update', onUpdate);
			socket.removeListener('spin-disconnect', onDisconnect);
		};
		
		const onUpdate = function(id, changes) {
			console.log('spin-update', changes);
			
			if ('connected' in changes && !changes.connected) {
				console.log('spin-update disconnecting', changes);
				socketTransport.disconnectSpin(id, changes);
			}
			else {
				let spin = socketTransport.updateSpin(id, changes);
				if (!spin.state.connected) {
					console.log('spin-update CONNECTING...');
					spin.once('connect', function () {
						TransportSpin.onSpinConnected(id);
					});
					spin.connect();
				}
			}
		};
		
		socket.on('connect', function() {
			log('socket connect');
			
			socket.on('spin-update', onUpdate);
			socket.on('spin-disconnect', onDisconnect);
			socket.on('spin-connect', onConnect);
			
		});
		
		socket.on('disconnect', () => {
			log('socket disconnect');
			
			socket.removeListener('spin-update', onUpdate);
			socket.removeListener('spin-disconnect', onDisconnect);
			socket.removeListener('spin-connect', onConnect);
		});
		
		return socket;
	};
	
	
}

module.exports = WebsocketClient;