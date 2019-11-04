function getDefaultState() {
	return {
		didKnobSpin: false,
		isRewinding: false,
		isFastForwarding: false,
		fastForwardTime: 0,
		rewindTime: 0
	};
}

function mediaAdapter() {
	const {spin} = this.devices;
	const {keyboard,volume} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.scale(volume.state.volumePercent, theme.low, theme.high, theme.middle);
	
	this.startRewind = function () {
		if (this.state.isFastForwarding) {
			this.stopFastForward();
		}
		if (!this.state.isRewinding) {
			this.state.isRewinding = true;
			this.state.rewindTime = new Date().getTime();
			this.log('audio_prev', 'down');
			keyboard.keyToggle('audio_prev', 'down');
			spin.orbit(-1, 150, theme.low, theme.low);
			this.rewindInterval = setInterval(() => {
				let time = (new Date().getTime() - this.state.rewindTime) / 1000;
				if (time < 5) {
					spin.orbit(-1, (150 - time * 25), theme.low, theme.low);
				}
			}, 1000);
		}
	};
	this.stopRewind = function () {
		if (this.state.isRewinding) {
			this.state.isRewinding = false;
			keyboard.keyToggle('audio_prev', 'up');
			clearInterval(this.rewindInterval);
			spin.lightsOff();
		}
	};
	this.startFastForward = function () {
		if (this.state.isRewinding) {
			this.stopRewind();
		}
		if (!this.state.isFastForwarding) {
			this.state.isFastForwarding = true;
			this.state.fastForwardTime = new Date().getTime();
			keyboard.keyToggle('audio_next', 'down');
			spin.orbit(1, 150, theme.high, theme.high);
			this.fastForwardInterval = setInterval(() => {
				let time = (new Date().getTime() - this.state.fastForwardTime) / 1000;
				if (time < 5) {
					spin.orbit(1, (150 - time * 25), theme.high, theme.high);
				}
			}, 1000);
		}
	};
	this.stopFastForward = function () {
		if (this.state.isFastForwarding) {
			this.state.isFastForwarding = false;
			keyboard.keyToggle('audio_next', 'up');
			clearInterval(this.fastForwardInterval);
			spin.lightsOff();
		}
	};
	
	this.setEvents({
		volume: {
			volume: function (volumePercent, volume) {
				this.log('desktop started vol=', volumePercent, volume);
				spin.scale(volumePercent, theme.low, theme.high, theme.middle);
			},
			muted: function (muted) {
				this.log('muted', muted);
				if (muted) {
					spin.scale(volume.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				} else {
					spin.scale(volume.state.volumePercent, theme.low, theme.high, theme.middle);
				}
			}
		},
		spin: {
			spin: function (diff, spinTime) {
				this.log('spin rotate', diff);
				
				if (spin.state.knobPushed) {
					if (!volume.state.muted) {
						this.state.didKnobSpin = true;
						let posDiff = spin.state.spinPosition - this.state.knobPushPosition;
						if (posDiff === 0) {
							this.stopFastForward();
							this.stopRewind();
						} else if (posDiff > 0) {
							this.startFastForward();
						} else if (posDiff < 0) {
							this.startRewind();
						}
					}
				} else if (spin.state.buttonPushed) {
				
				} else {
					if (volume.state.muted) {
						if (volume.state.volumePercent < 0.04) {
							volume.changeVolume(diff, spinTime);
						} else {
							spin.scale(volume.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
						}
					} else {
						volume.changeVolume(diff, spinTime);
					}
				}
			},
			knob: function (pushed) {
				this.log('knob !!', pushed);
				if (pushed) {
					this.state.didKnobSpin = false;
					this.state.knobPushPosition = spin.state.spinPosition;
				} else {
					if (this.state.didKnobSpin) {
						this.stopRewind();
						this.stopFastForward();
					} else {
						// optional? if (state.useMediaKeys)
						volume.toggleMuted();
					}
				}
			},
			button: function (pushed) {
				this.log('button !!', pushed);
				if (pushed) {
					keyboard.keyPress('audio_play');
					spin.flash(theme.secondary);
					// // optional? use Next or Play  keyboard.keyPress('audio_next');
				}
			}
		}
	});
}

mediaAdapter.getServicesConfig = function(adapterConfig) {
	return {
		keyboard: true,
		volume: true
	};
};

mediaAdapter.getDefaultState = getDefaultState;

module.exports = mediaAdapter;