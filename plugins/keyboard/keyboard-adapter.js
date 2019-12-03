const Adapter = require('../../lib/adapter');

class KeyboardAdapter extends Adapter {
	static getDefaultState() {
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
					key: 'delete',
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
					key: 'space',
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
					key: 'escape',
					modifiers: [],
					repeat: false,
					repeatDelay: 600,
					repeatSpeed: 100
				},
				spinLeft: {
					key: 'left',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				spinRight: {
					key: 'right',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				knobSpinLeft: {
					// key: 'pageup',
					key: 'left',
					modifiers: [],
					shuttle: true, // TODO
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				knobSpinRight: {
					// key: 'pagedown',
					key: 'right',
					modifiers: [],
					shuttle: true, // TODO
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				buttonSpinLeft: {
					// key: 'left',
					key: 'up',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				buttonSpinRight: {
					// key: 'right',
					key: 'down',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				bothSpinLeft: {
					// key: 'left',
					// modifiers: ['alt'],
					key: 'pageup',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				bothSpinRight: {
					// key: 'right',
					// modifiers: ['alt'],
					key: 'pagedown',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				}
			}
		};
	}
	
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		
		const {spin} = devices;
		const {keyboard} = services;
		spin.rainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				this.log('spin rotate', diff);
				
				if (spin.state.knobPushed && spin.state.buttonPushed) {
					if (!this.state.didKnobHold && !this.state.didButtonHold && !this.state.didBothHold) {
						this.setState({didBothSpin: true});
						const settings = diff > 0 ? this.state.settings.bothSpinRight : this.state.settings.bothSpinLeft;
						
						diff = spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout);
						if (diff !== 0) {
							keyboard.keyPressMultiple(spin, Math.abs(diff), settings.key, settings.modifiers);
							spin.rotate(diff, theme.secondary, theme.secondary);
						}
					}
				}
				else {
					if (this.state.didBothSpin) {
						this.setState({ didBothSpin: false});
					}
					
					if (spin.state.knobPushed) {
						if (!this.state.didKnobHold) {
							this.setState({didKnobSpin : true});
							const settings = diff > 0 ? this.state.settings.knobSpinRight : this.state.settings.knobSpinLeft;
							diff = spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout);
							if (diff !== 0) {
								keyboard.keyPressMultiple(spin, Math.abs(diff), settings.key, settings.modifiers);
								spin.rotate(diff, theme.primary, theme.primary);
							}
						}
					}
					else {
						if (this.state.didKnobSpin) {
							this.setState({ didKnobSpin: false});
						}
					}
					
					if (spin.state.buttonPushed) {
						if (!this.state.didButtonHold) {
							this.setState({didButtonSpin : true});
							const settings = diff > 0 ? this.state.settings.buttonSpinRight : this.state.settings.buttonSpinLeft;
							diff = spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout);
							if (diff !== 0) {
								const adiff = Math.abs(diff);
								keyboard.keyPressMultiple(spin, adiff, settings.key, settings.modifiers);
								const dir = diff > 0 ? 1 : -1;
								if (adiff > 1) spin.rotate(dir, theme.high, theme.high);
								else spin.rotate(dir, theme.high);
							}
						}
					}
					else {
						if (this.state.didButtonSpin) {
							this.setState({ didButtonSpin: false});
						}
					}
					
					if (!spin.state.knobPushed && !spin.state.buttonPushed) {
						const settings = diff > 0 ? this.state.settings.spinRight : this.state.settings.spinLeft;
						diff = spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout);
						if (diff !== 0) {
							const adiff = Math.abs(diff);
							keyboard.keyPressMultiple(spin, adiff, settings.key, settings.modifiers);
							const dir = diff > 0 ? 1 : -1;
							if (adiff > 1) spin.rotate(dir, theme.low, theme.low);
							else spin.rotate(dir, theme.low);
						}
					}
				}
				
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) {
					this.setState({
						didKnobSpin : false,
						didKnobHold : false,
						didBothSpin : false,
						bothPushed : false,
						bothReleased : false
					});
					
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
					this.setState({
						didButtonSpin : false,
						didButtonHold : false,
						didBothSpin : false,
						bothPushed : false,
						bothReleased : false
					});
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
					this.setState({didKnobHold : true});
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
					this.setState({didButtonHold : true});
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
		});
	}
	
	pushedBoth() {
		this.setState({
			bothPushed : true,
			didBothHold : false
		});
		this.log('PUSHED BOTH');
		
		if (this.state.didKnobHold) {
			clearInterval(this.knobRepeatTimeout);
			clearInterval(this.knobRepeatInterval);
		}
		if (this.state.didButtonHold) {
			clearInterval(this.buttonRepeatTimeout);
			clearInterval(this.buttonRepeatInterval);
		}
	}
	
	holdBoth(spin) {
		if (!this.state.didBothSpin) {
			this.log('BOTH HOLD');
			this.setState({didBothHold : true});
			const settings = this.state.settings.bothHold;
			if (this.state.isBothRepeating) {
				this.log('ALREDY BOTH REPEATING');
			}
			if (settings.repeat && !this.state.isBothRepeating) {
				this.setState({isBothRepeating : true});
				this.services.keyboard.keyPress(settings.key, settings.modifiers);
				this.bothRepeatTimeout = setTimeout(() => {
					this.bothRepeatInterval = setInterval(() => {
						this.log('repeat both....');
						this.services.keyboard.keyPress(settings.key, settings.modifiers);
						spin.flash(theme.tertiary);
					}, settings.repeatSpeed);
				}, settings.repeatDelay);
			}
		}
		else this.log('CANCEL BOTH HOLD');
	}
	
	cancelHoldBoth() {
		this.log('CANCEL BOTH HOLD');
		if (this.state.bothPushed) {
			this.setState({
				didBothHold: true,
				isBothRepeating: false
			});
			clearTimeout(this.bothRepeatTimeout);
			this.log('clearTimeout(this.bothRepeatTimeout);');
			clearInterval(this.bothRepeatInterval);
			this.log('clearInterval(this.bothRepeatInterval);');
		}
		else this.log('CANCEL BOTH HOLD OOOPS??');
	}
	
	releasedBoth(spin) {
		if (this.state.bothPushed) {
			this.setState({bothReleased : true});
			if (this.state.didBothHold) {
				this.cancelHoldBoth();
				this.setState({bothPushed : false});
			}
			else {
				this.setState({bothPushed : false});
				this.log('RELEASED BOTH');
				this.services.keyboard.keyPress(this.state.settings.bothPress.key, this.state.settings.bothPress.modifiers);
				this.devices.spin.flash(this.theme.tertiary);
			}
		}
	}
	
	static getServicesConfig(adapterConfig) {
		return {
			keyboard: true
		};
	}
}

module.exports = KeyboardAdapter;
