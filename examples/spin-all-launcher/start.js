const Jaxcore = require('../../index');
const jaxcore = new Jaxcore();

// PLUGINS
jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));
jaxcore.addPlugin(require('../../plugins/mouse'));
jaxcore.addPlugin(require('../../plugins/scroll'));
jaxcore.addPlugin(require('../../plugins/volume'));
jaxcore.addPlugin(require('../../plugins/websocket-server'));
jaxcore.addPlugin(require('../../plugins/websocket-client'));
jaxcore.addPlugin(require('jaxcore-chromecast-plugin'));
jaxcore.addPlugin(require('jaxcore-kodi-plugin'));
jaxcore.addPlugin(require('jaxcore-sonos-plugin'));

// ADAPTERS
// jaxcore.addAdapter('basic', require('./adapters/basic-adapter'));

let defaultAdapter = process.argv[2];

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	/*if (defaultAdapter === 'basic') {
		jaxcore.launchAdapter(spin, 'basic');
	}*/
	if (defaultAdapter === 'keyboard') {
		jaxcore.launchAdapter(spin, 'keyboard');
	}
	if (defaultAdapter === 'mouse') {
		jaxcore.launchAdapter(spin, 'mouse');
	}
	if (defaultAdapter === 'scroll') {
		jaxcre.launchAdapter(spin, 'scroll');
	}
	if (defaultAdapter === 'volume') {
		jaxcore.launchAdapter(spin, 'volume');
	}
	
	if (defaultAdapter === 'kodi') {
		jaxcore.launchAdapter(spin, 'kodi', {
			services: {
				kodi: {
					host: '192.168.0.33',
					// host: 'localhost',
					port: 9090
				}
			}
		});
	}
	
	if (defaultAdapter === 'chromecast') {
		jaxcore.launchAdapter(spin, 'chromecast', {
			services: {
				chromecast: {
					name: 'Family room TV'
				}
			}
		});
	}
	
	if (defaultAdapter === 'sonos') {
		jaxcore.launchAdapter(spin, 'sonos', {
			services: {
				sonos: {
					host: '192.168.1.231',
					port: 1400,
					minVolume: 0,
					maxVolume: 100
				}
			}
		});
	}
	
	if (defaultAdapter === 'websocketServer') {
		let WEBSOCKET_HOST = 'localhost';
		let WEBSOCKET_PORT = 37500;
		if (process.env.WEBSOCKET_HOST) {
			WEBSOCKET_HOST = process.env.WEBSOCKET_HOST
		}
		else {
			console.log('no WEBSOCKET_HOST specified, defaulting to', WEBSOCKET_PORT);
		}
		if (process.env.WEBSOCKET_PORT) {
			WEBSOCKET_HOST = process.env.WEBSOCKET_PORT
		}
		else {
			console.log('no WEBSOCKET_HOST specified, defaulting to', WEBSOCKET_HOST);
		}
		jaxcore.launchAdapter(spin, 'websocketServer', {
			services: {
				websocketServer: {
					host: WEBSOCKET_HOST,
					port: WEBSOCKET_PORT,
					allowClients: ['::1', '::ffff:127.0.0.1', '127.0.0.1'],   // only allow clients to connect from localhost or 127.0.0.1
					options: {
						allowUpgrades: true,
						transports: [ 'polling', 'websocket' ]
					}
				}
			}
		});
	}
	
	if (defaultAdapter === 'browserExtension') {
		// to use this, install jaxcore browser extension, and then run /examples/browser-extension-react web application
		jaxcore.launchAdapter(spin, 'websocketServer', {
			services: {
				websocketServer: {
					host: 'localhost',
					port: 37524,	// the port that the "jaxcore browser extension" will connect to
					allowClients: ['::1', '::ffff:127.0.0.1', '127.0.0.1'],   // only allow clients to connect from localhost or 127.0.0.1
					options: {
						allowUpgrades: true,
						transports: [ 'polling', 'websocket' ]
					}
				}
			}
		});
	}
});

jaxcore.startDevice('spin');
