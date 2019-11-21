const {Service, createLogger, createClientStore} = require('jaxcore-plugin');
const BrowserTransport = require('./browser-transport');
const WebsocketSpin = require('../websocket-client/websocket-spin');
// const io = require('socket.io-client');

const JAXCORE_PROTOCOL_VERSION = 2;

const log = createLogger('BrowserServiceS');

let transportSpinStore;
let browserTransport;

transportSpinStore = createClientStore('WebsocketSpin Store');
browserTransport = new BrowserTransport(WebsocketSpin, transportSpinStore);

function postMessage(data) {
	window.postMessage({
		jaxcore: {
			protocol: JAXCORE_PROTOCOL_VERSION,
			pageMessage: data
		}
	}, window.document.location.protocol + window.document.location.host);
}

function postHandshakeToContentPort(data) {
	window.postMessage({
		jaxcore: {
			protocol: JAXCORE_PROTOCOL_VERSION,
			pageHandshake: data
		}
	}, window.document.location.protocol + window.document.location.host);
}

const schema = {
	id: {
		type: 'string'
	},
	connected: {
		type: 'boolean'
	},
	grantedPrivileges: {
		type: 'object'
	},
	websocketConnected: {
		type: 'boolean'
	},
	portActive: {
		type: 'boolean'
	}
};

let browserServiceInstance;

class BrowserService extends Service {
	constructor(defaults, store) {
		super(schema, store, defaults);
		// this.setState({
		// 	id: 'browserService'
		// });
		// this.id = this.state.id;
		this.log = createLogger('BrowserService');
		this.log('create', defaults);
		
		this._onMessage = this.onMessage.bind(this);
		window.addEventListener("message", this._onMessage);
	}
	
	onMessage(event) {  // message from Content Script
		if (document.location.href.indexOf(event.origin) === 0) {
			if (event.data.jaxcore) {
				if (event.data.jaxcore.protocol !== JAXCORE_PROTOCOL_VERSION) {
					console.error('JAXCORE PROTOCOL MISMATCH, REQUIRE PROTOCOL ',JAXCORE_PROTOCOL_VERSION);
					return;
				}
				
				let msg = event.data.jaxcore;
				
				// if ('portConnected' in msg) {
				// 	debugger;
				// 	this.emit('port-connected', msg);
				// }
				// else if ('portActive' in msg) {
				// 	debugger;
				// 	this.emit('port-active', msg.portActive);
				// }
				
				if ('contentHandshake' in event.data.jaxcore) {
					const contentHandshake = event.data.jaxcore.contentHandshake;
					if ('extensionReady' in contentHandshake) {
						
						this._connected();
						
						postHandshakeToContentPort({
							connectExtension: {
								requestPrivileges: {
									spin: true,
									speech: true
								}
							}
						});
					}
					
					else if ('extensionDisconnected' in contentHandshake) {
						debugger;
						this.emit('extension-disconnected');
					}
					
					else if ('portConnected' in contentHandshake) {
						let portConnected = contentHandshake.portConnected;
						let portActive = contentHandshake.portActive;
						let grantedPrivileges = contentHandshake.grantedPrivileges;
						let websocketConnected = contentHandshake.websocketConnected;
						// console.log('grantedPrivileges', grantedPrivileges);
						console.log('portConnected', portConnected);
						console.log('portActive', portActive);
						this.setState({
							portConnected,
							portActive
						});
						this.emit('extension-connected', {
							// grantedPrivileges,
							extensionConnected: portConnected,
							tabActive: portActive,
							websocketConnected,
							grantedPrivileges
						});
					}
					else if ('portActive' in contentHandshake) {
						this.log('browser got port-active');
						this.emit('port-active', contentHandshake.portActive);
						// debugger;
					}
					
					else if ('websocketConnected' in contentHandshake) {
						const websocketConnected = contentHandshake.websocketConnected;
						console.log('websocketConnected', websocketConnected);
						// debugger;
						this.setState({
							websocketConnected
						});
						this.emit('websocket-connected', websocketConnected);
						
					}
					else {
						debugger;
					}
				}
				else if ('contentMessage' in event.data.jaxcore) {
					debugger;
				}
				else {
					// debugger;
				}
			}
		}
	}
	
	_connected() {
		this.setState({
			connected: true
		});
		this.emit('connect'); // emits to jaxcore.on('service-connected')
		
	}
	
	connect() {
		this.log('connecting to extension');
		// debugger;
		
		// this.once('extension-connected', () => {
		// 	// this.emit('connect'); // emits to jaxcore.on('service-connected')
		// 	// this.setState();
		// });
		
		this.once('extension-ready', () => {
			console.log('extension ready');
			
			// this.emit('connect'); // emits to jaxcore.on('service-connected')
			debugger;
		});
		
		
		
		// let socketConfig = this.state;
		//
		// let socket;
		//
		// const onSpinCommand = function(id, method, args) {
		// 	console.log('RECEIVED SPIN COMMAND', id, method, args);
		// 	socket.emit('spin-command', id, method, args);
		// };
		//
		// const onSpinConnect = function(id, state) {
		// 	log('ON spin-connect', id, state);
		// 	let spin = browserTransport.connectSpin(id, state);
		// 	log('spin-connect spin created', spin.id);
		// 	// process.exit();
		//
		// 	spin.once('connect', function() {
		// 		console.log('onSpinConnect connect', id);
		//
		// 		spin.on('disconnect', function() {
		// 			debugger;
		// 			browserTransport.removeListener('spin-command-'+id, onSpinCommand);
		// 		});
		// 		browserTransport.on('spin-command-'+id, onSpinCommand);
		//
		// 		WebsocketSpin.onSpinConnected(id);
		// 	}, 'connect');
		// 	spin.connect();
		// };
		// const onSpinDisconnect = function(id, state) {
		// 	log('ON spin-disconnect', id, state);
		//
		// 	WebsocketSpin.onSpinDisconnected(id);
		//
		// 	// socket.removeListener('spin-connect', onSpinConnect);
		// 	socket.removeListener('spin-update', onSpinUpdate);
		// 	socket.removeListener('spin-disconnect', onSpinDisconnect);
		//
		// 	socketTransport.removeListener('spin-command-'+id, onSpinCommand);
		// };
		//
		// const onSpinUpdate = function(id, changes) {
		// 	console.log('spin-update', changes);
		//
		// 	if ('connected' in changes) {//} && !changes.connected) {
		// 		if (changes.connected) {
		// 			onSpinConnect(id, changes);
		// 		}
		// 		else {
		// 			console.log('spin-update disconnecting', changes);
		// 			socketTransport.disconnectSpin(id, changes);
		// 		}
		// 	}
		// 	else {
		// 		socketTransport.updateSpin(id, changes);
		// 	}
		// };
		//
		// socket.once('connect', () => {
		// 	log('socket connect');
		// 	debugger;
		//
		// 	socketTransport.socketConnected(socket);
		//
		// 	socket.on('spin-update', onSpinUpdate);
		// 	socket.on('spin-disconnect', onSpinDisconnect);
		// 	socket.on('spin-connect', onSpinConnect);
		//
		// 	this.emit('connect', socket);
		// });
		//
		// socket.once('disconnect', () => {
		// 	log('socket disconnect');
		// 	debugger;
		//
		// 	socketTransport.socketDisconnected(socket);
		//
		// 	socket.removeListener('spin-update', onSpinUpdate);
		// 	socket.removeListener('spin-disconnect', onSpinDisconnect);
		// 	socket.removeListener('spin-connect', onSpinConnect);
		//
		// 	debugger;
		// 	socket.destroy();
		//
		// 	this.emit('disconnect');
		// });
		//
		// return socket;
	};
	
	
	destroy() {
		this.emit('teardown');
		// if (this.socket) this.socket.destroy();
		// this.removeAllListeners();
		// delete this.socket;
		// delete clients[this.state.id];
		debugger;
	}
	
	static id() {
		return 'browserService';
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		log('browserService getOrCreateInstance', serviceId, serviceConfig);
		if (browserServiceInstance) {
			callback(null, browserServiceInstance, false);
		}
		else {
			serviceConfig = {
				id: 'browserService'
			};
			browserServiceInstance = new BrowserService(serviceConfig, serviceStore);
			log('CREATED browserServiceInstance', browserServiceInstance);
			callback(null, browserServiceInstance, true);
		}
	}
	
}

module.exports = BrowserService;