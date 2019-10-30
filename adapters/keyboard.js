
function keyboardAdapter(theme, devices) {
	const {spin, desktop} = devices;
	spin.rotateRainbow(1);
	spin.lightsOff();
	
	const adapter = {
		state: {
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
					// key: 'z',
					key: 'escape',
					modifiers: []
				},
				bothHold: {
					// key: 'z',
					// modifiers: ['shift'],
					// repeat: true,
					// repeatDelay: 600,
					// repeatSpeed: 100
				},
				knobPress: {
					// key: 'k',
					key: 'enter',
					modifiers: []
				},
				knobHold: {
					key: 'enter',
					// modifiers: ['shift'],
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
					// key: 'b',
					// modifiers: ['shift'],
					// repeat: true,
					// repeatDelay: 600,
					// repeatSpeed: 100
				},
				spinLeft: {
					// key: 'u',
					key: 'up',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				spinRight: {
					// key: 'd',
					key: 'down',
					modifiers: [],
					bufferKinetic: 1,
					bufferStatic: 1,
					momentumTimeout: 300
				},
				knobSpinLeft: {
					// key: 'u',
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
		}
	};
	
	spin.on('spin', function (diff, spinTime) {
		console.log('spin rotate', diff);
		
		const number = Math.abs(diff);
		if (spin.state.knobPushed && spin.state.buttonPushed) {
			if (!adapter.state.didKnobHold && !adapter.state.didButtonHold && !adapter.state.didBothHold) {
				adapter.state.didBothSpin = true;
				const settings = diff > 0 ? adapter.state.settings.bothSpinRight : adapter.state.settings.bothSpinLeft;
				spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, function(bdiff) {
					desktop.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
					spin.rotate(diff, theme.secondary, theme.secondary);
				});
			}
		}
		else if (spin.state.knobPushed) {
			if (!adapter.state.didKnobHold) {
				adapter.state.didKnobSpin = true;
				const settings = diff > 0 ? adapter.state.settings.knobSpinRight : adapter.state.settings.knobSpinLeft;
				spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, function(bdiff) {
					desktop.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
					spin.rotate(diff, theme.primary, theme.primary);
				});
			}
		}
		else if (spin.state.buttonPushed) {
			if (!adapter.state.didButtonHold) {
				adapter.state.didButtonSpin = true;
				const settings = diff > 0 ? adapter.state.settings.buttonSpinRight : adapter.state.settings.buttonSpinLeft;
				spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, function(bdiff) {
					desktop.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
					spin.rotate(diff, theme.high);
				});
			}
		}
		else {
			const settings = diff > 0 ? adapter.state.settings.spinRight : adapter.state.settings.spinLeft;
			spin.buffer(diff, settings.bufferKinetic, settings.bufferStatic, settings.momentumTimeout, function(bdiff) {
				desktop.keyPressMultiple(spin, Math.abs(bdiff), settings.key, settings.modifiers);
				spin.rotate(diff, theme.low);
			});
		}
	});
	
	adapter.pushedBoth = function() {
		adapter.state.bothPushed = true;
		adapter.state.didBothHold = false;
		console.log('PUSHED BOTH');
		
		if (adapter.state.didKnobHold) {
			clearInterval(adapter.knobRepeatTimeout);
			clearInterval(adapter.knobRepeatInterval);
		}
		if (adapter.state.didButtonHold) {
			clearInterval(adapter.buttonRepeatTimeout);
			clearInterval(adapter.buttonRepeatInterval);
		}
	};
	
	adapter.holdBoth = function(spin) {
		if (!adapter.state.didBothSpin) {
			console.log('BOTH HOLD');
			adapter.state.didBothHold = true;
			const settings = adapter.state.settings.bothHold;
			if (adapter.state.isBothRepeating) {
				console.log('ALREDY BOTH REPEATING');
			}
			if (settings.repeat && !adapter.state.isBothRepeating) {
				adapter.state.isBothRepeating = true;
				desktop.keyPress(settings.key, settings.modifiers);
				adapter.bothRepeatTimeout = setTimeout(function () {
					adapter.bothRepeatInterval = setInterval(function () {
						console.log('repeat both....');
						desktop.keyPress(settings.key, settings.modifiers);
						spin.flash(theme.tertiary);
					}, settings.repeatSpeed);
				}, settings.repeatDelay);
			}
		}
		else console.log('CANCEL BOTH HOLD');
	};
	
	adapter.cancelHoldBoth = function() {
		console.log('CANCEL BOTH HOLD');
		if (adapter.state.bothPushed) {
			adapter.state.didBothHold = true;
			adapter.state.isBothRepeating = false;
			clearTimeout(adapter.bothRepeatTimeout);
			console.log('clearTimeout(adapter.bothRepeatTimeout);');
			clearInterval(adapter.bothRepeatInterval);
			console.log('clearInterval(adapter.bothRepeatInterval);');
		}
		else console.log('CANCEL BOTH HOLD OOOPS??');
	};
	
	adapter.releasedBoth = function(spin) {
		if (adapter.state.bothPushed) {
			adapter.state.bothReleased = true;
			if (adapter.state.didBothHold) {
				adapter.cancelHoldBoth();
				adapter.state.bothPushed = false;
			}
			else {
				adapter.state.bothPushed = false;
				console.log('RELEASED BOTH');
				desktop.keyPress(adapter.state.settings.bothPress.key, adapter.state.settings.bothPress.modifiers);
				spin.flash(theme.tertiary);
			}
		}
	};
	
	spin.on('knob', function (pushed) {
		console.log('knob', pushed);
		if (pushed) {
			adapter.state.didKnobSpin = false;
			adapter.state.didKnobHold = false;
			adapter.state.didBothSpin = false;
			adapter.state.bothPushed = false;
			adapter.state.bothReleased = false;
			
			if (spin.state.buttonPushed) {
				adapter.pushedBoth(spin);
			}
		}
		else {
			// if (adapter.state.bothPushed && spin.state.buttonPushed) {
			if (adapter.state.bothPushed) {
				adapter.releasedBoth(spin);
			}
			
			if (adapter.state.didKnobHold) {
				clearTimeout(adapter.knobRepeatTimeout);
				clearInterval(adapter.knobRepeatInterval);
			}
			else {
				if (!adapter.state.didKnobSpin && !adapter.state.bothReleased) {
					if (adapter.state.settings.knobPress.key) {
						desktop.keyPress(adapter.state.settings.knobPress.key, adapter.state.settings.knobPress.modifiers);
						spin.flash(theme.primary);
					}
				}
			}
		}
	});
	
	spin.on('button', function (pushed) {
		console.log('button', pushed);
		if (pushed) {
			adapter.state.didButtonSpin = false;
			adapter.state.didButtonHold = false;
			adapter.state.didBothSpin = false;
			adapter.state.bothPushed = false;
			adapter.state.bothReleased = false;
			
			if (spin.state.knobPushed) {
				adapter.pushedBoth();
			}
		}
		else {
			// if (adapter.state.bothPushed && spin.state.knobPushed) {
			if (adapter.state.bothPushed) {
				adapter.releasedBoth(spin);
			}
			
			if (adapter.state.didButtonHold) {
				clearTimeout(adapter.buttonRepeatTimeout);
				clearInterval(adapter.buttonRepeatInterval);
			}
			else {
				if (!adapter.state.didButtonSpin && !adapter.state.bothReleased) {
					if (adapter.state.settings.buttonPress.key) {
						desktop.keyPress(adapter.state.settings.buttonPress.key, adapter.state.settings.buttonPress.modifiers);
						spin.flash(theme.secondary);
					}
				}
			}
		}
	});
	
	spin.on('knob-hold', function () {
		if (adapter.state.bothPushed) { // && !adapter.state.didBothHold
			adapter.holdBoth(spin);
			return;
		}
		
		if (!adapter.state.bothPushed && !adapter.state.bothReleased) {
			console.log('knob HOLD');
			adapter.state.didKnobHold = true;
			const settings = adapter.state.settings.knobHold;
			desktop.keyPress(settings.key, settings.modifiers);
			spin.flash(theme.primary);
			if (settings.repeat) {
				adapter.knobRepeatTimeout = setTimeout(function () {
					adapter.knobRepeatInterval = setInterval(function () {
						desktop.keyPress(settings.key, settings.modifiers);
						spin.flash(theme.primary);
					}, settings.repeatSpeed);
				}, settings.repeatDelay);
			}
		}
		else console.log('cancel knob HOLD');
	});
	
	spin.on('button-hold', function () {
		if (adapter.state.bothPushed) { // && !adapter.state.didBothHold
			adapter.holdBoth(spin);
			return;
		}
		
		if (!adapter.state.bothPushed && !adapter.state.bothReleased) {
			console.log('button HOLD');
			adapter.state.didButtonHold = true;
			const settings = adapter.state.settings.buttonHold;
			desktop.keyPress(settings.key, settings.modifiers);
			spin.flash(theme.secondary);
			if (settings.repeat) {
				adapter.buttonRepeatTimeout = setTimeout(function () {
					adapter.buttonRepeatInterval = setInterval(function () {
						desktop.keyPress(settings.key, settings.modifiers);
						spin.flash(theme.secondary);
					}, settings.repeatSpeed);
				}, settings.repeatDelay);
			}
		}
		else console.log('cancel button HOLD');
	});
	
}

module.exports = keyboardAdapter;
