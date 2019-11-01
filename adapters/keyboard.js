function getDefaultState() {
	return {
		didKnobSpin: false,
		didKnobHold: false,
		
		didButtonSpin: false,
		didButtonHold: false,
		
		didBothSpin: false,
		didBothHold: false,
		
		bothPushed: false,
		bothReleased: false,
		isBothRepeating: false,
		
		settings: {
			bothPress: {
				key: 'escape',
				modifiers: []
			},
			bothHold: {
				key: null,
				modifiers: [],
				repeat: true,
				repeatDelay: 600,
				repeatSpeed: 100
			},
			knobPress: {
				key: 'enter',
				modifiers: []
			},
			knobHold: {
				key: 'enter',
				modifiers: [],
				repeat: true,
				repeatDelay: 600,
				repeatSpeed: 100
			},
			buttonPress: {
				key: 'backspace',
				modifiers: []
			},
			buttonHold: {
				key: null,
				modifiers: [],
				repeat: true,
				repeatDelay: 600,
				repeatSpeed: 100
			},
			spinLeft: {
				key: 'up',
				modifiers: [],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			},
			spinRight: {
				key: 'down',
				modifiers: [],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			},
			knobSpinLeft: {
				key: 'pageup',
				modifiers: [],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			},
			knobSpinRight: {
				key: 'pagedown',
				modifiers: [],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			},
			buttonSpinLeft: {
				key: 'left',
				modifiers: [],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			},
			buttonSpinRight: {
				key: 'right',
				modifiers: [],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			},
			bothSpinLeft: {
				key: 'left',
				modifiers: ['command'],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			},
			bothSpinRight: {
				key: 'right',
				modifiers: ['command'],
				bufferKinetic: 1,
				bufferStatic: 1,
				momentumTimeout: 300
			}
		}
	};
}

function keyboardAdapter() {
	const {spin} = this.devices;
	const {keyboard} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	this.pushedBoth = function() {
		this.state.bothPushed = true;
		this.state.didBothHold = false;
		this.log('PUSHED BOTH');
		
		if (this.state.didKnobHold) {
			clearInterval(this.knobRepeatTimeout);
			clearInterval(this.knobRepeatInterval);
		}
		if (this.state.didButtonHold) {
			clearInterval(this.buttonRepeatTimeout);
			clearInterval(this.buttonRepeatInterval);
		}
	};
	
	this.holdBoth = function(spin) {
		if (!this.state.didBothSpin) {
			this.log('BOTH HOLD');
			this.state.didBothHold = true;
			const settings = this.state.settings.bothHold;
			if (this.state.isBothRepeating) {
				this.log('ALREDY BOTH REPEATING');
			}
			if (settings.repeat && !this.state.isBothRepeating) {
				this.state.isBothRepeating = true;
				keyboard.keyPress(settings.key, settings.modifiers);
				this.bothRepeatTimeout = setTimeout(() => {
					this.bothRepeatInterval = setInterval(() => {
						this.log('repeat both....');
						keyboard.keyPress(settings.key, settings.modifiers);
						spin.flash(theme.tertiary);
					}, settings.repeatSpeed);
				}, settings.repeatDelay);
			}
		}
		else this.log('CANCEL BOTH HOLD');
	};
	
	this.cancelHoldBoth = function() {
		this.log('CANCEL BOTH HOLD');
		if (this.state.bothPushed) {
			this.state.didBothHold = true;
			this.state.isBothRepeating = false;
			clearTimeout(this.bothRepeatTimeout);
			this.log('clearTimeout(this.bothRepeatTimeout);');
			clearInterval(this.bothRepeatInterval);
			this.log('clearInterval(this.bothRepeatInterval);');
		}
		else this.log('CANCEL BOTH HOLD OOOPS??');
	};
	
	this.releasedBoth = function(spin) {
		if (this.state.bothPushed) {
			this.state.bothReleased = true;
			if (this.state.didBothHold) {
				this.cancelHoldBoth();
				this.state.bothPushed = false;
			}
			else {
				this.state.bothPushed = false;
				this.log('RELEASED BOTH');
				keyboard.keyPress(this.state.settings.bothPress.key, this.state.settings.bothPress.modifiers);
				spin.flash(theme.tertiary);
			}
		}
	};
	
	this.setEvents({
		spin: {
			spin: function (diff, spinTime) {
				this.log('spin rotate', diff);
				
				if (spin.state.knobPushed && spin.state.buttonPushed) {
					if (!this.state.didKnobHold && !this.state.didButtonHold && !this.state.didBothHold) {
						this.state.didBothSpin = true;
						const settings = diff > 0 ? this.state.settings.bothSpinRight : this.state.settings.bothSpinLeft;
						
						// diff = spin.resolution(diff, 16, settings.bufferStatic, settings.momentumTimeout);
						// if (diff !== 0) {
						// 	keyboard.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
						// 	spin.rotate(diff, theme.secondary, theme.secondary);
						// }
						
						spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, (bdiff) => {
							keyboard.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
							spin.rotate(diff, theme.secondary, theme.secondary);
						});
					}
				}
				else if (spin.state.knobPushed) {
					if (!this.state.didKnobHold) {
						this.state.didKnobSpin = true;
						const settings = diff > 0 ? this.state.settings.knobSpinRight : this.state.settings.knobSpinLeft;
						spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, (bdiff) => {
							keyboard.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
							spin.rotate(diff, theme.primary, theme.primary);
						});
					}
				}
				else if (spin.state.buttonPushed) {
					if (!this.state.didButtonHold) {
						this.state.didButtonSpin = true;
						const settings = diff > 0 ? this.state.settings.buttonSpinRight : this.state.settings.buttonSpinLeft;
						spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, (bdiff) => {
							keyboard.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
							spin.rotate(diff, theme.high);
						});
					}
				}
				else {
					const settings = diff > 0 ? this.state.settings.spinRight : this.state.settings.spinLeft;
					spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, (bdiff) => {
						const adiff = Math.abs(bdiff);
						keyboard.keyPressMultiple(spin, adiff, settings.key, settings.modifiers);
						const dir = bdiff > 0? 1:-1;
						if (adiff>1) spin.rotate(dir, theme.low, theme.low);
						else spin.rotate(dir, theme.low);
					});
				}
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) {
					this.state.didKnobSpin = false;
					this.state.didKnobHold = false;
					this.state.didBothSpin = false;
					this.state.bothPushed = false;
					this.state.bothReleased = false;
					
					if (spin.state.buttonPushed) {
						this.pushedBoth(spin);
					}
				}
				else {
					// if (this.state.bothPushed && spin.state.buttonPushed) {
					if (this.state.bothPushed) {
						this.releasedBoth(spin);
					}
					
					if (this.state.didKnobHold) {
						clearTimeout(this.knobRepeatTimeout);
						clearInterval(this.knobRepeatInterval);
					}
					else {
						if (!this.state.didKnobSpin && !this.state.bothReleased) {
							if (this.state.settings.knobPress.key) {
								keyboard.keyPress(this.state.settings.knobPress.key, this.state.settings.knobPress.modifiers);
								spin.flash(theme.primary);
							}
						}
					}
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
				if (pushed) {
					this.state.didButtonSpin = false;
					this.state.didButtonHold = false;
					this.state.didBothSpin = false;
					this.state.bothPushed = false;
					this.state.bothReleased = false;
					
					if (spin.state.knobPushed) {
						this.pushedBoth();
					}
				}
				else {
					// if (this.state.bothPushed && spin.state.knobPushed) {
					if (this.state.bothPushed) {
						this.releasedBoth(spin);
					}
					
					if (this.state.didButtonHold) {
						clearTimeout(this.buttonRepeatTimeout);
						clearInterval(this.buttonRepeatInterval);
					}
					else {
						if (!this.state.didButtonSpin && !this.state.bothReleased) {
							if (this.state.settings.buttonPress.key) {
								keyboard.keyPress(this.state.settings.buttonPress.key, this.state.settings.buttonPress.modifiers);
								spin.flash(theme.secondary);
							}
						}
					}
				}
			},
			knobHold: function () {
				if (this.state.bothPushed) { // && !this.state.didBothHold
					this.holdBoth(spin);
					return;
				}
				
				if (!this.state.bothPushed && !this.state.bothReleased) {
					this.log('knob HOLD');
					this.state.didKnobHold = true;
					const settings = this.state.settings.knobHold;
					keyboard.keyPress(settings.key, settings.modifiers);
					spin.flash(theme.primary);
					if (settings.repeat) {
						this.knobRepeatTimeout = setTimeout(() => {
							this.knobRepeatInterval = setInterval(() => {
								keyboard.keyPress(settings.key, settings.modifiers);
								spin.flash(theme.primary);
							}, settings.repeatSpeed);
						}, settings.repeatDelay);
					}
				}
				else this.log('cancel knob HOLD');
			},
			buttonHold: function () {
				if (this.state.bothPushed) { // && !this.state.didBothHold
					this.holdBoth(spin);
					return;
				}
				
				if (!this.state.bothPushed && !this.state.bothReleased) {
					this.log('button HOLD');
					this.state.didButtonHold = true;
					const settings = this.state.settings.buttonHold;
					keyboard.keyPress(settings.key, settings.modifiers);
					spin.flash(theme.secondary);
					if (settings.repeat) {
						this.buttonRepeatTimeout = setTimeout(() => {
							this.buttonRepeatInterval = setInterval(() => {
								keyboard.keyPress(settings.key, settings.modifiers);
								spin.flash(theme.secondary);
							}, settings.repeatSpeed);
						}, settings.repeatDelay);
					}
				}
				else this.log('cancel button HOLD');
			}
		}
	});
}

keyboardAdapter.getServicesConfig = function(adapterConfig) {
	console.log('keyboardAdapter getServicesConfig', adapterConfig);
	
	let servicesConfig = {
		keyboard: {
			x: 123
		}
	};
	
	return servicesConfig;
};

keyboardAdapter.getDefaultState = getDefaultState;

module.exports = keyboardAdapter;
