var plugin = require('jaxcore-plugin');
var log = require('debugger')('System Volume Interface');
//plugin.createLogger('System Volume Interface');

module.exports = {
	states: {
		connected: {
			type: 'boolean',
			defaultValue: false
		},
		muted: {
			type: 'boolean',
			defaultValue: false
		},
		volume: {
			type: 'integer',
			defaultValue: 0,
			minimum: 'minVolume',
			maximum: 'maxVolume'
		},
		volumePercent: {
			type: 'float',
			defaultValue: 0
		},
		minVolume: {
			type: 'integer',
			defaultValue: 0,
			maximumValue: 100,
			minimumValue: 0
		},
		maxVolume: {
			type: 'integer',
			defaultValue: 100,
			maximumValue: 100,
			minimumValue: 0
		},
		volumeIncrement: {
			type: 'integer',
			defaultValue: 1
		}
	},
	devices: {
		// audio: {
		// 	actions: {
		// 		volumeUp: function () {
		// 			// var v = this.state.volume + this.state.volumeIncrement;
		// 			// log('volumeUp', v, this.state.volume, this.state.volumeIncrement);
		// 			// this.audio.volume(v);
		// 			this.audio.volumeUp();
		// 		},
		// 		volumeDown: function () {
		// 			// var v = this.state.volume - this.state.volumeIncrement;
		// 			// log('volumeDown', v, this.state.volume, this.state.volumeIncrement);
		// 			// this.audio.volume(v);
		// 			this.audio.volumeDown();
		// 		},
		// 		toggleMuted: function () {
		// 			// var muted = !this.state.muted;
		// 			// this.audio.muted(muted);
		// 			this.audio.toggleMuted();
		// 		},
		// 		mute: function () {
		// 			this.audio.muted(true);
		// 		},
		// 		unmute: function () {
		// 			this.audio.muted(false);
		// 		}
		// 	},
		// 	settings: {
		// 		volume: function (v) {
		// 			if (v<this.state.minVolume) v = this.state.minVolume;
		// 			if (v>this.state.maxVolume) v = this.state.maxVolume;
		// 			console.log('audio.volume()', v);
		// 			this.setState({
		// 				volume: v
		// 			});
		// 			this.device.setVolume(v);
		// 		},
		// 		minVolume: function (v) {
		// 			this.setState({
		// 				minVolume: v
		// 			});
		// 		},
		// 		maxVolume: function (v) {
		// 			this.setState({
		// 				maxVolume: v
		// 			});
		// 		},
		// 		muted: function (muted) {
		// 			log('muted', muted);
		// 			this.device.setMuted(muted);
		// 		}
		// 	}
		// }
	}
};
