
function volumeAdapter(spin, desktopService) {
	spin.flash([0,255,255]);
	
	var adapter = {
		state: {
			didKnobSpin: false,
			isRewinding: false,
			isFastForwarding: false,
			fastForwardTime: 0,
			rewindTime: 0
		}
	};
	
	desktopService.on('volume', function (volumePercent, volume) {
		console.log('desktopService started vol=', volumePercent, volume);
		spin.scale(volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
	});
	
	desktopService.on('muted', function (muted) {
		console.log('muted', muted);
		if (muted) {
			spin.scale(desktopService.state.volumePercent, [100, 100, 0], [255, 255, 0], [255, 255, 255]);
		} else {
			spin.scale(desktopService.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
		}
	});
	
	function startRewind() {
		if (adapter.state.isFastForwarding) {
			stopFastForward();
		}
		if (!adapter.state.isRewinding) {
			adapter.state.isRewinding = true;
			adapter.state.rewindTime = new Date().getTime();
			console.log('audio_prev', 'down');
			desktopService.keyToggle('audio_prev', 'down');
			spin.orbit(-1, 150, [0, 0, 255], [0, 0, 255]);
			adapter.rewindInterval = setInterval(function() {
				let time = (new Date().getTime() - adapter.state.rewindTime) / 1000;
				if (time < 5) {
					spin.orbit(-1, (150 - time*25), [0, 0, 255], [0, 0, 255]);
				}
			}, 1000);
		}
	}
	function stopRewind() {
		if (adapter.state.isRewinding) {
			adapter.state.isRewinding = false;
			desktopService.keyToggle('audio_prev', 'up');
			clearInterval(adapter.rewindInterval);
			spin.lightsOff();
		}
	}
	function startFastForward() {
		if (adapter.state.isRewinding) {
			stopRewind();
		}
		if (!adapter.state.isFastForwarding) {
			adapter.state.isFastForwarding = true;
			adapter.state.fastForwardTime = new Date().getTime();
			desktopService.keyToggle('audio_next', 'down');
			spin.orbit(1, 150, [255, 0, 0], [255, 0, 0]);
			adapter.fastForwardInterval = setInterval(function() {
				let time = (new Date().getTime() - adapter.state.fastForwardTime) / 1000;
				if (time < 5) {
					spin.orbit(1, (150 - time*25), [255, 0, 0], [255, 0, 0]);
				}
			}, 1000);
		}
	}
	function stopFastForward() {
		if (adapter.state.isFastForwarding) {
			adapter.state.isFastForwarding = false;
			desktopService.keyToggle('audio_next', 'up');
			clearInterval(adapter.fastForwardInterval);
			spin.lightsOff();
		}
	}
	
	spin.on('rotate', function (diff, spinTime) {
		console.log('spin rotate', diff);
		
		if (spin.state.knobPushed) {
			if (!desktopService.state.muted) {
				adapter.state.didKnobSpin = true;
				let posDiff = spin.state.spinPosition - adapter.state.knobPushPosition;
				if (posDiff === 0) {
					stopFastForward();
					stopRewind();
				} else if (posDiff > 0) {
					startFastForward();
				} else if (posDiff < 0) {
					startRewind();
				}
			}
		}
		else if (spin.state.buttonPushed) {
		
		}
		else {
			if (desktopService.state.muted) {
				if (desktopService.state.volumePercent < 0.04) {
					desktopService.changeVolume(diff, spinTime);
				}
				else {
					spin.scale(desktopService.state.volumePercent, [100, 100, 0], [100, 100, 0], [255, 255, 255]);
				}
			}
			else {
				desktopService.changeVolume(diff, spinTime);
			}
		}
	});
	
	spin.on('knob', function (pushed) {
		console.log('knob !!', pushed);
		if (pushed) {
			adapter.state.didKnobSpin = false;
			adapter.state.knobPushPosition = spin.state.spinPosition;
			
		}
		else {
			if (adapter.state.didKnobSpin) {
				stopRewind();
				stopFastForward();
			}
			else {
				// optional? if (state.useMediaKeys)
				desktopService.toggleMuted();
			}
		}
	});
	
	spin.on('button', function (pushed) {
		console.log('button !!', pushed);
		if (pushed) {
			desktopService.keyPress('audio_play');
			spin.flash([0,255,255]);
			// // optional? use Next or Play  desktopService.keyPress('audio_next');
		}
	});
}

module.exports = volumeAdapter;