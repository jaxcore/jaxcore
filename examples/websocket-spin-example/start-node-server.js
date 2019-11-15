const Jaxcore = require('../../jaxcore');
const jaxcore = new Jaxcore();

// PLUGINS
jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/websocket-server'));

const WEBSOCKET_PORT = 37500;
// const WEBSOCKET_HOST = '127.0.0.1'; // <---- Restrict to localhost here
const WEBSOCKET_HOST = '192.168.1.29'; // <---- Restrict to 192.168.1.29 here
// const WEBSOCKET_HOST = '*'; // <---- Allow any origin here

// jaxcore.on('spin-connected', function(spin) {
jaxcore.on('device-connected', function(type, device) {
	if (type === 'spin') {
		const spin = device;
		console.log('connected', spin.id);
		const adapterConfig = jaxcore.findSpinAdapter(spin);
		if (adapterConfig) {
			console.log('found adapter', adapterConfig);
			jaxcore.relaunchAdapter(adapterConfig, spin);
			// jaxcore.emit('device-connected', 'spin', spin, adapterConfig);
		}
		else {
			console.log('DID NOT FIND ADAPTER FOR:', spin.id);
			// jaxcore.emit('device-connected', 'spin', spin, null);
			
			// START WEBSOCKET SERVER
			jaxcore.createAdapter(spin, 'websocketServer', {
				services: {
					'websocketServer': {
						// host: '0.0.0.0',
						// host: '127.0.0.1',
						// host: 'localhost',
						port: WEBSOCKET_PORT,
						options: {
							transports: [ 'websocket' ],
							// origins: '*:*'  // <---- Allow any origin here
							origins: WEBSOCKET_HOST + ':*'
						}
					}
				}
			}, function(err, config, adapter) {
				if (err) {
					console.log('websocket error', err);
					process.exit();
				}
				else {
					console.log('launched websocket adapter', config, adapter);
					// process.exit();
				}
			});
		}
	}
});

jaxcore.startDevice('spin');
