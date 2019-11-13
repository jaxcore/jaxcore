// Jaxcore.hijack(function(jaxcore) {
//		jaxcore.on('device-connected')
//   let spin = spins[0];
//	 devices.speech
//	 devices.spin
// });

const io = require('socket.io-client');

const socketPort = 37524;
console.log('connecting port ' + socketPort + ' ...');

const socket = io.connect('http://localhost:' + socketPort, {
	reconnection: true
});

const spinIds = {};

socket.on('connect', function() {
	console.log('socket connect');
	
	socket.on('spin-connect', function(id, state) {
		console.log('ON spin-connect', id, state);
		
		let didCreate;
		if (id in spinIds){
			didCreate = false;
			console.log('DID NOT CREATE');
		}
		else {
			spinIds[id] = state;
			didCreate = true;
			console.log('DID CREATE');
		}
	});
	socket.on('spin-disconnect', function(id, state) {
		console.log('ON spin-disconnect', id, state)
	});
	
	socket.on('spin-update', function(id, changes) {
		
		if (!changes) {
			console.log('no changes?');
			return;
		}
		
		let didCreate;
		if (id in spinIds){
			didCreate = false;
		}
		else {
			spinIds[id] = changes;
			didCreate = true;
		}
		
		if (didCreate) {
			console.log('SPIN UPDATE CREATED', id, changes);
		}
		else {
			console.log('SPIN UPDATE', id, changes);
			
			for (let i in changes) {
				spinIds[id][i] = changes[i];
			}
			
		}
		
		if (!spinIds[id].connected) {
			console.log('not connected DESTROY', id);
			delete spinIds[id];
		}
	});
});

socket.on('disconnect', () => {
	console.log('socket disconnect');
});