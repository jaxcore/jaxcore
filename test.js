var Spin = require('jaxcore-spin');

var Desktop = require('./service');

// Desktop.connect();
// Desktop.on('connect', function (desktop) {

Desktop.connect(function (desktop) {
	console.log('connected!', desktop.state);
	
	desktop.audio.on('volume', function (volumePercent, volume) {
		console.log('volume', volumePercent, volume, desktop.state);
	});

	desktop.audio.on('muted', function (muted) {
		console.log('muted', muted);
	});
	
	// desktop.audio.volume(10);

	// desktop.audio.maxVolume(13);
	
	// desktop.audio.volumeUp();

	// setTimeout(function() {
	// 	desktop.audio.volumeUp();

	// 	setTimeout(function() {
	// 		desktop.audio.volumeUp();

	// 		setTimeout(function() {
	// 			desktop.audio.volumeUp();

	// 			setTimeout(function() {
	// 				desktop.audio.volumeUp();
	// 			},1000);
	// 		},1000);
	// 	},1000);
	// },1000);
	

	// desktop.audio.minVolume(10);
	// desktop.audio.maxVolume(99);
	
	// desktop.audio.volumeDown(20);

	// desktop.audio.volumeUp();
	// desktop.audio.volumeDown();
	// desktop.audio.volume(10);
	// desktop.audio.muted(true);
	// desktop.audio.muted(false);
	// desktop.audio.mute();
	// desktop.audio.unmute();
	// desktop.audio.toggleMuted();

	Spin.connect(function (spin) {
		// adapter.emit('spin-connected', spin);
		console.log('spin connected', spin);

		spin.on('spin', function (direction, position) {
			console.log('spin', direction, position);
			if (spin.buffer(direction, 0, 1)) {
				if (direction === 1) desktop.audio.volumeUp();
				else desktop.audio.volumeDown();
			}
		});

		spin.on('button', function (pushed) {
			console.log('button', pushed);
			//if (!pushed) desktop.audio.toggleMuted();
		});

		spin.on('knob', function (pushed) {
			console.log('knob', pushed);
			if (!pushed) desktop.audio.toggleMuted();
		});


	});


});


