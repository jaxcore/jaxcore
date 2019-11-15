const Jaxcore = require('./jaxcore');

const jaxcore = Jaxcore.connectWebsocket('localhost', 37524);

jaxcore.addAdapter('basic', require('./adapters/basic-adapter'));

jaxcore.on('device-connected', function(type, device) {
	if (type === 'websocket-spin') {
		const spin = device;
		console.log('connected', spin);
		jaxcore.createAdapter(spin, 'basic');
	}
	else {
		console.log('device-connected', type);
		process.exit();
	}
});

