
function volumeAdapter(theme, devices) {
	const {spin, desktop} = devices;
	spin.rotateRainbow(2);
	spin.scale(desktop.state.volumePercent, theme.low, theme.high, theme.middle);
	
	var adapter = {
		state: {
			didKnobSpin: false,
			isRewinding: false,
			isFastForwarding: false,
			fastForwardTime: 0,
			rewindTime: 0
		}
	};
	
	desktop.on('volume', function (volumePercent, volume) {
		console.log('desktop started vol=', volumePercent, volume);
		spin.scale(volumePercent, theme.low, theme.high, theme.middle);
	});
	
	desktop.on('muted', function (muted) {
		console.log('muted', muted);
		if (muted) {
			spin.scale(desktop.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
		} else {
			spin.scale(desktop.state.volumePercent, theme.low, theme.high, theme.middle);
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
			desktop.keyToggle('audio_prev', 'down');
			spin.orbit(-1, 150, theme.low, theme.low);
			adapter.rewindInterval = setInterval(function() {
				let time = (new Date().getTime() - adapter.state.rewindTime) / 1000;
				if (time < 5) {
					spin.orbit(-1, (150 - time*25), theme.low, theme.low);
				}
			}, 1000);
		}
	}
	function stopRewind() {
		if (adapter.state.isRewinding) {
			adapter.state.isRewinding = false;
			desktop.keyToggle('audio_prev', 'up');
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
			desktop.keyToggle('audio_next', 'down');
			spin.orbit(1, 150, theme.high, theme.high);
			adapter.fastForwardInterval = setInterval(function() {
				let time = (new Date().getTime() - adapter.state.fastForwardTime) / 1000;
				if (time < 5) {
					spin.orbit(1, (150 - time*25), theme.high, theme.high);
				}
			}, 1000);
		}
	}
	function stopFastForward() {
		if (adapter.state.isFastForwarding) {
			adapter.state.isFastForwarding = false;
			desktop.keyToggle('audio_next', 'up');
			clearInterval(adapter.fastForwardInterval);
			spin.lightsOff();
		}
	}
	
	spin.on('spin', function (diff, spinTime) {
		console.log('spin rotate', diff);
		
		if (spin.state.knobPushed) {
			if (!desktop.state.muted) {
				adapter.state.didKnobSpin = true;
				
				spin.buffer(diff, 0, 1, function(bdiff) {
					let posDiff = spin.state.spinPosition - adapter.state.knobPushPosition;
					if (posDiff === 0) {
						stopFastForward();
						stopRewind();
					} else if (posDiff > 0) {
						startFastForward();
					} else if (posDiff < 0) {
						startRewind();
					}
				});
				
			}
		}
		else if (spin.state.buttonPushed) {
		
		}
		else {
			if (desktop.state.muted) {
				if (desktop.state.volumePercent < 0.04) {
					desktop.changeVolume(diff, spinTime);
				}
				else {
					spin.scale(desktop.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				}
			}
			else {
				desktop.changeVolume(diff, spinTime);
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
				desktop.toggleMuted();
			}
		}
	});
	
	spin.on('button', function (pushed) {
		console.log('button !!', pushed);
		if (pushed) {
			desktop.keyPress('audio_play');
			spin.flash(theme.secondary);
			// // optional? use Next or Play  desktop.keyPress('audio_next');
		}
	});
}

module.exports = volumeAdapter;