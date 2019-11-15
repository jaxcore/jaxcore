const {Client, createLogger} = require('jaxcore-plugin');
const WebsocketSpin = require('./websocket-spin');
const io = require('socket.io-client');

const log = createLogger('WebSocketClient');

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
		// if (!socketTransport) socketTransport = new WebsocketTransport(WebsocketSpin, spinStore);
		
		let socketConfig = this.state;
		
		const url = socketConfig.protocol + '://' + socketConfig.host + ':' + socketConfig.port;
		this.log('connecting websocket ' + url + ' ...');
		
		const socket = io.connect(url, socketConfig.options);
		
		const socketTransport = this.socketTransport;
		
		const onCommand = function(id, method, args) {
			console.log('RECEIVED SPIN COMMAND', id, method, args);
			// process.exit();
			socket.emit('spin-command', id, method, args);
		};
		
		const onConnect = function(id, state) {
			log('ON spin-connect', id, state);
			
			let spin = socketTransport.connectSpin(id, state);
			// console.log('spin-connect CONNECTING...', spin.state.connected);
			
			spin.once('connect', function() {
				console.log('onConnect connect', id);
				socketTransport.on('spin-command-'+id, onCommand);
				WebsocketSpin.onSpinConnected(id);
			}, 'connect');
			spin.connect();
			
			log('spin-connect spin created', spin);
			// process.exit();
			
			// WebsocketSpin.createSpin(this.transport, id, state);
			
		};
		const onDisconnect = function(id, state) {
			log('ON spin-disconnect', id, state);
			// WebsocketSpin.onSpinDisconnected(id);
			
			// socket.removeListener('spin-connect', onConnect);
			socket.removeListener('spin-update', onUpdate);
			socket.removeListener('spin-disconnect', onDisconnect);
			
			socketTransport.removeListener('spin-command-'+id, onCommand);
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
					
					// spin.once('connect', function () {
					// 	WebsocketSpin.onSpinConnected(id);
					// });
					// spin.connect();s
					
					spin.once('connect', function() {
						console.log('onConnect connect', id);
						socketTransport.on('spin-command-'+id, onCommand);
						WebsocketSpin.onSpinConnected(id);
					}, 'connect');
					spin.connect();
				}
			}
		};
		
		socket.on('connect', () => {
			log('socket connect');
			
			socket.on('spin-update', onUpdate);
			socket.on('spin-disconnect', onDisconnect);
			socket.on('spin-connect', onConnect);
			
			this.emit('connect', socket);
		});
		
		socket.on('disconnect', () => {
			log('socket disconnect');
			
			socket.removeListener('spin-update', onUpdate);
			socket.removeListener('spin-disconnect', onDisconnect);
			socket.removeListener('spin-connect', onConnect);
			
			this.emit('disconnect', socket);
		});
		
		return socket;
	};
	
	
}

module.exports = WebsocketClient;