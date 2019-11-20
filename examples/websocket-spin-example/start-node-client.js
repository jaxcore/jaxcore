const Jaxcore = require('../../jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addAdapter('basic', require('../../adapters/basic-adapter'));

// host and port must match the websocket-server
const WEBSOCKET_HOST = 'localhost';
// const WEBSOCKET_HOST = '192.168.1.29';
const WEBSOCKET_PORT = 37500;
// const WEBSOCKET_HOST = '127.0.0.1';

jaxcore.on('service-disconnected', (type, device) => {
	console.log('x service-disconnected', type, device.id);
	if (type === 'websocketClient') {
		// process.exit();
		connectSocket();
	}
});

jaxcore.on('service-connected', (type, device) => {
	console.log('service-connected', type, device.id);
	
	// process.exit();
	// if (type === 'websocketClient') {
	//
	// }
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
		jaxcore.createAdapter(spin, 'basic');
	}
	else {
		console.log('device-connected', type);
		process.exit();
	}
});


connectSocket();