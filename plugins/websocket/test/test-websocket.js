// Jaxcore.hijack(function(jaxcore) {
//		jaxcore.on('device-connected')
//   let spin = spins[0];
//	 devices.speech
//	 devices.spin
// });

const WebsocketTransport = require('jaxcore-spin/lib/transports/websocket');
const TransportSpin = require('jaxcore-spin/lib/transport-spin');
const {createClientStore, createLogger} = require('jaxcore-plugin');

const io = require('socket.io-client');

const socketHost = 'localhost';
const socketPort = 37524;
console.log('connecting port ' + socketPort + ' ...');

const socket = io.connect('http://' + socketHost + ':' + socketPort, {
	reconnection: true
});

const log = createLogger('TestWebsocket');

const spinStore = createClientStore('TransportSpin');

const socketTransport = new WebsocketTransport(TransportSpin, spinStore);

// const spinIds = {};

TransportSpin.connect(function(spin) {
	console.log('transport spin connected', spin.id);
	
	spin.on('spin', function(diff, time) {
		console.log('transport ON SPIN', diff, time);
	});
	spin.on('button', function(pushed) {
		console.log('transport ON BUTTON', pushed);
	});
	spin.on('knob', function(pushed) {
		console.log('transport ON KNOB', pushed);
	});
});


socket.on('connect', function() {
	log('socket connect');
	
	
	socket.on('spin-connect', function(id, state) {
		log('ON spin-connect', id, state);
		
		let spin = socketTransport.connectSpin(id, state);
		console.log('spin-connect CONNECTING...');
		
		// spin.on('connect', function() {
		// 	console.log('on connect', id);
		// 	process.exit();
		// 	TransportSpin.onSpinConnected(id);
		// });
		// spin.connect();
		log('spin-connect spin created', spin);
		// process.exit();
		
		// TransportSpin.createSpin(this.transport, id, state);
	});
	socket.on('spin-disconnect', function(id, state) {
		log('ON spin-disconnect', id, state);
		TransportSpin.onSpinDisconnected(id);
	});
	
	socket.on('spin-update', function(id, changes) {
		
		let spin = socketTransport.updateSpin(id, changes);
		if (!spin.state.connected) {
			console.log('spin-update CONNECTING...');
			spin.on('connect', function () {
				TransportSpin.onSpinConnected(id);
			});
			spin.connect();
		}
	});
});

socket.on('disconnect', () => {
	log('socket disconnect');
});