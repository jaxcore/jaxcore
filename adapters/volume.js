function getDefaultState() {
	return {
	};
}

function volumeAdapter() {
	const {spin} = this.devices;
	const {volume} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.scale(volume.state.volumePercent, theme.low, theme.high, theme.middle);
	
	this.setEvents({
		volume: {
			volume: function (volumePercent, volume) {
				this.log('volume started vol=', volumePercent, volume);
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
				this.log('knob', pushed);
				if (pushed) {
				
				} else {
					volume.toggleMuted();
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
			}
		}
	});
}

volumeAdapter.getServicesConfig = function(adapterConfig) {
	console.log('getServicesConfig adapterConfig', adapterConfig);
	
	let servicesConfig = {
		volume: {
			minVolume: 0,
			maxVolume: 100
		}
	};
	// defaults
	
	return servicesConfig;
};

volumeAdapter.getDefaultState = getDefaultState;

module.exports = volumeAdapter;