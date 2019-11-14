const {createClientStore} = require('jaxcore-plugin');
const TransportSpin = require('./plugins/websocket-client/transport-spin');

const WebSocketClient = require('./plugins/websocket-client/websocket-client');

const spinStore = createClientStore('TransportSpin');
WebSocketClient.setSpinStore(spinStore);

const socketConfig = {
	host: 'localhost',
	port: 37524,
	protocol: 'http',
	options: {
		reconnection: true
	}
};

const socket = WebSocketClient.connectSocket(socketConfig, spinStore);

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

