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
	
	function onSpin(diff, time) {
		console.log('transport ON SPIN', diff, time);
	}
	function onButton(pushed) {
		console.log('transport ON BUTTON', pushed);
	}
	function onKnob(pushed) {
		console.log('transport ON KNOB', pushed);
	}
	spin.on('spin', onSpin);
	spin.on('button', onButton);
	spin.on('knob', onKnob);
	
	spin.once('disconnect', function() {
		console.log('final disconnected');
		
		spin.removeListener('spin', onSpin);
		spin.removeListener('button', onButton);
		spin.removeListener('knob', onKnob);
	});
});


const onConnect = function(id, state) {
	log('ON spin-connect', id, state);
	
	let spin = socketTransport.connectSpin(id, state);
	console.log('spin-connect CONNECTING...');
	
	spin.once('connect', function() {
		console.log('onConnect connect', id);
		TransportSpin.onSpinConnected(id);
	}, 'connect');
	spin.connect();
	
	log('spin-connect spin created', spin);
	// process.exit();
	
	// TransportSpin.createSpin(this.transport, id, state);
	
};
const onDisconnect = function(id, state) {
	log('ON spin-disconnect', id, state);
	TransportSpin.onSpinDisconnected(id);
	
	// socket.removeListener('spin-connect', onConnect);
	socket.removeListener('spin-update', onUpdate);
	socket.removeListener('spin-disconnect', onDisconnect);
};

const onUpdate = function(id, changes) {
	console.log('spin-update', changes);
	
	if ('connected' in changes && !changes.connected) {
		console.log('spin-update disconnecting', changes);
		socketTransport.disconnectSpin(id, changes);
	}
	else {
		let spin = socketTransport.updateSpin(id, changes);
		if (!spin.state.connected) {
			console.log('spin-update CONNECTING...');
			spin.once('connect', function () {
				TransportSpin.onSpinConnected(id);
			});
			spin.connect();
		}
	}
};

socket.on('connect', function() {
	log('socket connect');

	socket.on('spin-update', onUpdate);
	socket.on('spin-disconnect', onDisconnect);
	socket.on('spin-connect', onConnect);

});

socket.on('disconnect', () => {
	log('socket disconnect');
	
	socket.removeListener('spin-update', onUpdate);
	socket.removeListener('spin-disconnect', onDisconnect);
	socket.removeListener('spin-connect', onConnect);
});