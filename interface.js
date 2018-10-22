module.exports = function (log) {
	return {
		states: {
			sentVolume: {
				type: 'integer'
			},
			sentVolumeTime: {
				type: 'timestamp'
			},
			receivedVolume: {
				type: 'integer'
			},
			receivedVolumeTime: {
				type: 'timestamp'
			},
			volumeIncrement: {
				type: 'integer',
				defaultValue: 1
			},
			volumePercent: {
				type: 'float',
				defaultValue: 0
			},
			audioPolling: {
				type: 'integer',
				defaultValue: 200
			}
		},
		settings: {
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
			}
		},
		devices: {
			audio: {
				events: {
					volume: ['int', 'float'],
					muted: ['boolean']
				},
				actions: {
					volumeUp: function () {
						var v = this.state.volume + this.state.volumeIncrement;
						this.audio.volume(v);
					},
					volumeDown: function () {
						var v = this.state.volume - this.state.volumeIncrement;
						this.audio.volume(v);
					},
					toggleMuted: function () {
						var muted = !this.state.muted;
						this.audio.muted(muted);
					},
					mute: function () {
						this.audio.muted(true);
					},
					unmute: function () {
						this.audio.muted(false);
					},
					getMuted: function () {
						
					},
					getVolume: function () {
						
					}
				},
				settings: {
					volume: function (v) {
						if (this.state.sentVolume === v) {
							log('volume already', v);
						}
						else {
							log('volume()', v, this.state);
							v = parseInt(v) || 0;
							if (isNaN(v)) {
								log('isNaN', v);
								return;
							}

							if (v > this.state.maxVolume) {
								log(v + ' exceeds maximum volume');
								if (this.state.volume !== this.state.maxVolume) {
									log('setting volume to maximum');
									v = this.state.maxVolume;
								}
								else {
									log('already at max');
									return;
								}
							}
							if (v < this.state.minVolume) {
								log(v + ' below minimum volume');
								if (this.state.volume !== this.state.minVolume) {
									log('setting volume to minimum');
									v = this.state.minVolume;
								}
								else {
									log('already at min');
									return;
								}
							}

							var volumePercent = (v - this.state.minVolume) / Math.abs(this.state.maxVolume - this.state.minVolume);
							if (volumePercent>1) volumePercent = 1;
							if (volumePercent<0) volumePercent = 0;
							var now = new Date().getTime();
							this.setState({
								volume: v,
								volumePercent: volumePercent,
								sentVolumeTime: now,
								sentVolume: v
							});
							this.audio.emit('volume', volumePercent, v);
							this.audioDevice.set(v);
						}
					},
					minVolume: function (v) {
						this.setState({
							minVolume: v
						});
					},
					maxVolume: function (v) {
						this.setState({
							maxVolume: v
						});
					},
					muted: function (muted) {
						if (muted) this.audioDevice.mute();
						else audioDevice.audio.umute();
					}
				}
				
			}
		},

		parsers: {
			volume: function (v) {
				var now = new Date().getTime();
				
				if (now - this.state.sentVolumeTime > 1000) {
					if (this.state.volume != v) {
						log('volume( '+v+' )');
						var volumePercent = (v - this.state.minVolume) / Math.abs(this.state.maxVolume - this.state.minVolume);
						if (volumePercent>1) volumePercent = 1;
						if (volumePercent<0) volumePercent = 0;
						this.setState({
							volume: v,
							volumePercent: volumePercent,
							receivedVolume: v,
							receivedVolumeTime: now
						});
						this.audio.emit('volume', volumePercent, v);
					}
				}
				else {
					log('volume( '+v+' ) SKIP');
					this.setState({
						receivedVolume: v,
						receivedVolumeTime: now
					});
				}
			},
			muted: function (m) {
				if (this.state.muted != m) {
					log('muted( '+m+' )');
					this.setState({
						muted: m
					});
					this.audio.emit('muted', m);
				}
			}
		}
	}
};