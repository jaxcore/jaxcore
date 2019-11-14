const Jaxcore = require('./jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addAdapter('console-websocket-test', require('./adapters/console-websocket-test-adapter'));

// jaxcore.addPlugin(require('./plugins/websocket-client'));

jaxcore.on('device-connected', function(type, device) {
	if (type === 'transport-spin') {
		const tspin = device;
		console.log('connected', tspin);
		// process.exit();
		
		jaxcore.createAdapter(tspin, 'console-websocket-test');
		
		// const adapterConfig = jaxcore.findSpinAdapter(spin);
		// if (adapterConfig) {
		// 	console.log('found adapter', adapterConfig);
		// 	jaxcore.relaunchAdapter(adapterConfig, spin);
		// }
		// else {
		// 	console.log('DID NOT FIND ADAPTER FOR:', spin.id);
		//
		// 	if (defaultAdapter === 'websocket') {
		// 		jaxcore.createAdapter(spin, 'websocket', {
		// 			services: {
		// 				websocket: {
		// 					port: 37524
		// 				}
		// 			}
		// 		}, function(err, config, adapter) {
		// 			if (err) {
		// 				console.log('websocket error', err);
		// 				process.exit();
		// 			}
		// 			else {
		// 				console.log('launched websocket adapter', config, adapter);
		// 				// process.exit();
		// 			}
		// 		});
		// 	}
		// }
	}
	else {
		console.log('device-connected', type);
		process.exit();
	}
});


// jaxcore.addPlugin(require('./plugins/websocket-client'));


jaxcore.addDevice('transport-spin', require('./plugins/websocket-client/transport-spin'), 'client');
jaxcore.addService('websocket-client', require('./plugins/websocket-client/websocket-client-service'), 'client');

// const {createClientStore} = require('jaxcore-plugin');

// const TransportSpin = require('./plugins/websocket-client/transport-spin');
// const WebSocketClient = require('./plugins/websocket-client/websocket-client');
//
// const spinStore = createClientStore('TransportSpin');
// WebSocketClient.setSpinStore(spinStore);
//
// const socket = WebSocketClient.connectSocket(socketConfig, spinStore);


const webSocketClientConfig = {
	host: 'localhost',
	port: 37524,
	protocol: 'http',
	options: {
		reconnection: true
	}
};

// let socketId = jaxcore.getServiceId(serviceType, serviceConfig);

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

