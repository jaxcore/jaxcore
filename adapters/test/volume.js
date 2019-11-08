const Adapter = require('jaxcore-plugin').Adapter;

class VolumeAdapter extends Adapter {
	static getDefaultState () {
		return {};
	}
	
	constructor (config, theme, devices, services) {
		super(config, theme, devices, services);
		const {spin} = devices;
		const {volume} = services;
		spin.rotateRainbow(2);
		spin.scale(volume.state.volumePercent, theme.low, theme.high, theme.middle);
		
		this.addEvents(volume, {
			volume: function (volumePercent, volume) {
				this.log('volume started vol=', volumePercent, volume);
				spin.scale(volumePercent, theme.low, theme.high, theme.middle);
			},
			muted: function (muted) {
				this.log('muted', muted);
				if (muted) {
					spin.scale(volume.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				}
				else {
					spin.scale(volume.state.volumePercent, theme.low, theme.high, theme.middle);
				}
			}
		});
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				this.log('spin rotate', diff);
				
				if (spin.state.knobPushed) {
				}
				else if (spin.state.buttonPushed) {
				}
				else {
					if (volume.state.muted) {
						if (volume.state.volumePercent < 0.04) {
							volume.changeVolume(diff, spinTime);
						}
						else {
							spin.scale(volume.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
						}
					}
					else {
						volume.changeVolume(diff, spinTime);
					}
				}
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) {
				
				}
				else {
					volume.toggleMuted();
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
			}
		});
	}
	
	static getServicesConfig (adapterConfig) {
		return {
			volume: {
				minVolume: 0,
				maxVolume: 100
			}
		};
	}
}

module.exports = VolumeAdapter;