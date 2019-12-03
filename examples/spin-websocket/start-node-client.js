const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addAdapter('basic', require('../spin-basic/spin-basic-adapter'));

jaxcore.defineAdapter('basic-spin-adapter', {
	adapterType: 'basic',
	deviceType: 'spin'
});

// the host and port must match the websocket-server settings in start-node-server.js
const WEBSOCKET_HOST = 'localhost';
const WEBSOCKET_PORT = 37500;

jaxcore.on('service-disconnected', (type, device) => {
	if (type === 'websocketClient') {
		console.log('websocket service-disconnected', type, device.id);
		connectSocket();
	}
});

jaxcore.on('service-connected', (type, device) => {
	console.log('service-connected', type, device.id);
});

function connectSocket() {
	jaxcore.connectWebsocket({
		protocol: 'http',
		host: WEBSOCKET_HOST,
		port: WEBSOCKET_PORT,
		options: {
			reconnection: true
		}
	}, function (err, websocketClient) {
		if (err) {
			console.log('websocketClient error', err);
			process.exit();
		}
		else if (websocketClient) {
			console.log('websocketClient connected');
		}
	});
}

jaxcore.on('device-connected', function(type, device) {
	if (type === 'websocketSpin') {
		const spin = device;
		console.log('connected', spin);
		jaxcore.connectAdapter(spin, 'basic-spin-adapter');
	}
	else {
		console.log('device-connected', type);
		process.exit();
	}
});

connectSocket();