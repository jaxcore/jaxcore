const Jaxcore = require('../../jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addAdapter('basic', require('../../adapters/basic-adapter'));

const WEBSOCKET_PORT = 37500;

const websocketClientConfig = {
	protocol: 'http',
	// host: '127.0.0.1',
	// host: '192.168.1.29',
	host: 'localhost',
	port: WEBSOCKET_PORT,
	options: {
		reconnection: true
	}
};

jaxcore.connectWebsocket(websocketClientConfig, function(err, websocketClient) {
	if (err) {
		console.log('websocketClient error', err);
		process.exit();
	}
	else if (websocketClient) {
		console.log('websocketClient connected');
	}
});

jaxcore.on('device-connected', function(type, device) {
	if (type === 'websocketSpin') {
		const spin = device;
		console.log('connected', spin);
		jaxcore.createAdapter(spin, 'basic');
	}
	else {
		console.log('device-connected', type);
		process.exit();
	}
});

