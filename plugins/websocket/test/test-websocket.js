const io = require('socket.io-client');

var socketPort = 37524;
console.log('connecting port ' + socketPort + ' ...');

var socket = io.connect('http://localhost:' + socketPort, {
	reconnection: true
});
console.log('socket', socket);

socket.on('connect', function() {
	console.log('connect');
	
	socket.on('spin-update', function(id, changes) {
		console.log('SPIN UPDATE', id, changes.spinPosition);
	});
});

socket.on('disconnect', () => {
	console.log('connect');
});