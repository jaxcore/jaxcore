const Jaxcore = require('./jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('./plugins/websocket-client'));

jaxcore.addAdapter('console-websocket-test', require('./adapters/console-websocket-test-adapter'));

jaxcore.on('device-connected', function(type, device) {
	if (type === 'transport-spin') {
		const tspin = device;
		console.log('connected', tspin);
		jaxcore.createAdapter(tspin, 'console-websocket-test');
	}
	else {
		console.log('device-connected', type);
		process.exit();
	}
});

const webSocketClientConfig = {
	host: 'localhost',
	port: 37524,
	protocol: 'http',
	options: {
		reconnection: true
	}
};
jaxcore.startService('websocket-client', null, null, webSocketClientConfig, function(err, websocketClient) {
	console.log('websocketClient', websocketClient);
	
	websocketClient.on('connect', function() {
		console.log('websocketClient connect');
		process.exit();
		
	});
	websocketClient.connect();
	
});

jaxcore.startDevice('transport-spin');

// TransportSpin.connect(function(spin) {
// 	console.log('transport spin connected', spin.id);
//
// 	function onSpin(diff, time) {
// 		console.log('transport ON SPIN', diff, time);
// 	}
// 	function onButton(pushed) {
// 		console.log('transport ON BUTTON', pushed);
// 	}
// 	function onKnob(pushed) {
// 		console.log('transport ON KNOB', pushed);
// 	}
// 	spin.on('spin', onSpin);
// 	spin.on('button', onButton);
// 	spin.on('knob', onKnob);
//
// 	spin.once('disconnect', function() {
// 		console.log('final disconnected');
//
// 		spin.removeListener('spin', onSpin);
// 		spin.removeListener('button', onButton);
// 		spin.removeListener('knob', onKnob);
// 	});
// });

