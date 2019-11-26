const Service = require('../../lib/client');
const Store = require('../../lib/store');
const {createClientStore} = Store;
const {createLogger} = require('../../lib/logger');
const BrowserTransport = require('./browser-transport');
const WebsocketSpin = require('../websocket-client/websocket-spin');

const JAXCORE_EXTENSION_VERSION = '0.0.3';
const JAXCORE_PROTOCOL_VERSION = 2;

const log = createLogger('BrowserServiceS');

let transportSpinStore = createClientStore('WebsocketSpin Store');
let browserTransport = new BrowserTransport(WebsocketSpin, transportSpinStore);

function postToContentPortMessage(data) {
	window.postMessage({
		jaxcore: {
			protocol: JAXCORE_PROTOCOL_VERSION,
			version: JAXCORE_EXTENSION_VERSION,
			pageMessage: data
		}
	}, window.document.location.protocol + window.document.location.host);
}

function postHandshakeToContentPort(data) {
	window.postMessage({
		jaxcore: {
			protocol: JAXCORE_PROTOCOL_VERSION,
			version: JAXCORE_EXTENSION_VERSION,
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
		
		this._onSpinCommand = this.onSpinCommand.bind(this);
		browserTransport.on('spin-command', this._onSpinCommand);
	}
	
	onSpinCommand(id, method, args) {
		postToContentPortMessage({
			spin: {
				command: {
					id,
					method,
					args
				}
			}
		});
	}
	
	onMessage(event) {  // message from Content Script
		if (document.location.href.indexOf(event.origin) === 0) {
			if (event.data.jaxcore) {
				
				if (event.data.jaxcore.protocol !== JAXCORE_PROTOCOL_VERSION) {
					console.error('JAXCORE PROTOCOL MISMATCH, REQUIRE PROTOCOL ',JAXCORE_PROTOCOL_VERSION);
					return;
				}
				if (event.data.jaxcore.version !== JAXCORE_EXTENSION_VERSION) {
					console.error('JAXCORE VERSION MISMATCH, REQUIRE VERSION ',JAXCORE_EXTENSION_VERSION);
					return;
				}
				
				
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
						this.emit('extension-disconnected');
					}
					else if ('portConnected' in contentHandshake) {
						let portConnected = contentHandshake.portConnected;
						let portActive = contentHandshake.portActive;
						let grantedPrivileges = contentHandshake.grantedPrivileges;
						let websocketConnected = contentHandshake.websocketConnected;
						this.setState({
							portConnected,
							portActive
						});
						this.emit('extension-connected', {
							extensionConnected: portConnected,
							tabActive: portActive,
							websocketConnected,
							grantedPrivileges
						});
					}
					else if ('portActive' in contentHandshake) {
						this.emit('port-active', contentHandshake.portActive);
					}
					else if ('websocketConnected' in contentHandshake) {
						const websocketConnected = contentHandshake.websocketConnected;
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
					const msg = event.data.jaxcore.contentMessage;
					if ('spinUpdate' in msg) {
						this.log('spinUpdate', msg);
						
						const changes = msg.spinUpdate.changes;
						
						browserTransport.updateSpin(msg.spinUpdate.id, changes);
						//debugger;
					}
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
		this.emit('connect');
	}
	
	connect() {
		this.log('connecting to extension');
		
		// this.once('extension-ready', () => {
		// 	console.log('extension ready');
		//
		// 	// this.emit('connect'); // emits to jaxcore.on('service-connected')
		// 	debugger;
		// });
	};
	
	
	destroy() {
		this.emit('teardown');
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