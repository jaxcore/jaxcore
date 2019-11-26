const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();
jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/websocket-server'));

// host and port must match the websocket-client
const WEBSOCKET_PORT = 37500;
const WEBSOCKET_HOST = 'localhost'; // <---- Listen on localhost
// const WEBSOCKET_HOST = '127.0.0.1'; // <---- Listen on localhost
// const WEBSOCKET_HOST = '192.168.1.29'; // <---- Listen on specific IP address

jaxcore.on('spin-connected', function (spin) {
	console.log('connected', spin.id);
	
	jaxcore.launchAdapter(spin, 'websocketServer', {
		services: {
			websocketServer: {
				host: WEBSOCKET_HOST,
				port: WEBSOCKET_PORT,
				allowClients: ['::1', '::ffff:127.0.0.1', '127.0.0.1'],   // only allow clients to connect from localhost or 127.0.0.1
				// allowClients: ['192.168.1.29', '::ffff:192.168.1.29'], // only allow clients to connect from a specific IP address
				options: {
					allowUpgrades: true,
					transports: ['polling', 'websocket']
				}
			}
		}
	}, function (err, adapterInstance, adapterConfig, didCreate) {
		console.log('adapter ' + (didCreate ? 'launched' : 'relaunched'), adapterConfig);
		console.log('websocketServer settings', adapterConfig.settings.services.websocketServer);
		
		adapterInstance.on('teardown', function () {
			console.log('adapter is destroying', adapterConfig);
			// process.exit();
		});
		
	});
});

jaxcore.startDevice('spin');
