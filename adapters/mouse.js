
function mouseAdapter(theme, devices) {
	const {spin, desktop} = devices;
	spin.rotateRainbow(1);
	spin.lightsOff();
	
	// const adapter = {
	// 	state: {
	// 		settings: {
	// 			didKnobHold: false,
	// 			didBothHold: false,
	// 			didButtonSpin: false
	// 		}
	// 	}
	// };
	this.setState({
		didKnobHold: false,
		didBothHold: false,
		didButtonSpin: false
	});
	
	this.pushBoth = function(spin) {
		console.log('PUSH BOTH');
		this.state.didBothHold = true;
		console.log('CLICK MIDDLE');
		desktop.mouseClick('middle');
		spin.flash(theme.tertiary);
	};
	this.releaseBoth = function() {
		this.state.didBothHold = false;
		console.log('RELEASE BOTH');
	};
	
	this.setEvents({
		spin: {
			spin: function (diff, spinTime) {
				if (this.state.didBothHold) {
					return;
				}
				
				var mouse = desktop.getMousePos();
				let size = desktop.getScreenSize();
				console.log('spin rotate', diff, mouse, size);
				
				let distance;
				let dir = diff > 0? 1:-1;
				if (spinTime < 65) distance = dir * Math.round(Math.pow(Math.abs(diff),1.8));
				else if (spinTime < 150) distance = dir * Math.round(Math.pow(Math.abs(diff),1.4));
				else distance = diff;
				
				
				if (spin.state.buttonPushed) {
					this.state.didButtonSpin = true;
					
					let y = mouse.y + distance;
					if (y < 1) y = 1;
					if (y > size.height) y = size.height;
					if (this.state.didKnobHold) {
						console.log('drag mouse Y', y);
						desktop.dragMouse(mouse.x, y);
						spin.rotate(dir, theme.secondary, theme.secondary);
					}
					else {
						console.log('move mouse Y', y);
						desktop.moveMouse(mouse.x, y);
						spin.rotate(dir, theme.high);
					}
				}
				else {
					let x = mouse.x + distance;
					if (x < 1) x = 1;
					if (x > size.width) x = size.width;
					if (this.state.didKnobHold) {
						console.log('drag mouse X', x);
						desktop.moveMouse(x, mouse.y);
						spin.rotate(dir, theme.primary, theme.primary);
					}
					else {
						console.log('move mouse X', x);
						desktop.moveMouse(x, mouse.y);
						spin.rotate(dir, theme.low);
					}
				}
			},
			knob: function (pushed) {
				console.log('knob', pushed);
				if (pushed) {
					if (adapter.state.didKnobHold) {
						desktop.mouseToggle('up','left');
						spin.quickFlash(theme.low, 2);
						adapter.state.didKnobHold = false;
					}
					else {
						if (spin.state.buttonPushed) {
							adapter.pushBoth(spin);
						}
					}
				}
				else {
					
					if (adapter.state.didKnobHold) {
						// spin.quickFlash(theme.primary, 3);
						// spin.flash(theme.primary, 1);
					}
					else {
						if (adapter.state.didBothHold) {
							adapter.releaseBoth(spin);
						}
						else {
							console.log('CLICK LEFT');
							desktop.mouseClick('left');
							spin.flash(theme.primary);
						}
					}
				}
			},
			button: function (pushed) {
				console.log('button', pushed);
				if (pushed) {
					adapter.state.didButtonSpin = false;
				}
				if (!adapter.state.didKnobHold) {
					if (pushed) {
						if (spin.state.knobPushed) {
							adapter.pushBoth(spin);
						}
					} else {
						if (adapter.state.didBothHold) {
							adapter.releaseBoth();
						}
						else if (!adapter.state.didButtonSpin) {
							console.log('CLICK RIGHT');
							desktop.mouseClick('right');
							spin.flash(theme.secondary);
						}
					}
				}
			},
			knobHold: function () {
				console.log('KNOB HOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOLLLDD');
				if (!adapter.state.didBothHold) {
					console.log('knob hold');
					adapter.state.didKnobHold = true;
					desktop.mouseToggle('down', 'left');
					// spin.quickFlash(theme.low, 3);
					spin.quickFlash(theme.white, 5);
				}
			}
		},
		desktop: {
			volume: function(v) {
				console.log('ON VOLUME', v);
			}
		}
	});
	
	// spin.on('spin', function (diff, spinTime) {
	// 	if (adapter.state.didBothHold) {
	// 		return;
	// 	}
	//
	// 	var mouse = desktop.getMousePos();
	// 	let size = desktop.getScreenSize();
	// 	console.log('spin rotate', diff, mouse, size);
	//
	// 	let distance;
	// 	let dir = diff > 0? 1:-1;
	// 	if (spinTime < 65) distance = dir * Math.round(Math.pow(Math.abs(diff),1.8));
	// 	else if (spinTime < 150) distance = dir * Math.round(Math.pow(Math.abs(diff),1.4));
	// 	else distance = diff;
	//
	//
	// 	if (spin.state.buttonPushed) {
	// 		adapter.state.didButtonSpin = true;
	//
	// 		let y = mouse.y + distance;
	// 		if (y < 1) y = 1;
	// 		if (y > size.height) y = size.height;
	// 		if (adapter.state.didKnobHold) {
	// 			console.log('drag mouse Y', y);
	// 			desktop.dragMouse(mouse.x, y);
	// 			spin.rotate(dir, theme.secondary, theme.secondary);
	// 		}
	// 		else {
	// 			console.log('move mouse Y', y);
	// 			desktop.moveMouse(mouse.x, y);
	// 			spin.rotate(dir, theme.high);
	// 		}
	// 	}
	// 	else {
	// 		let x = mouse.x + distance;
	// 		if (x < 1) x = 1;
	// 		if (x > size.width) x = size.width;
	// 		if (adapter.state.didKnobHold) {
	// 			console.log('drag mouse X', x);
	// 			desktop.moveMouse(x, mouse.y);
	// 			spin.rotate(dir, theme.primary, theme.primary);
	// 		}
	// 		else {
	// 			console.log('move mouse X', x);
	// 			desktop.moveMouse(x, mouse.y);
	// 			spin.rotate(dir, theme.low);
	//
	// 		}
	// 	}
	// });
	//
	// spin.on('knob', function (pushed) {
	// 	console.log('knob', pushed);
	// 	if (pushed) {
	// 		if (adapter.state.didKnobHold) {
	// 			desktop.mouseToggle('up','left');
	// 			spin.quickFlash(theme.low, 2);
	// 			adapter.state.didKnobHold = false;
	// 		}
	// 		else {
	// 			if (spin.state.buttonPushed) {
	// 				adapter.pushBoth(spin);
	// 			}
	// 		}
	// 	}
	// 	else {
	//
	// 		if (adapter.state.didKnobHold) {
	// 			// spin.quickFlash(theme.primary, 3);
	// 			// spin.flash(theme.primary, 1);
	// 		}
	// 		else {
	// 			if (adapter.state.didBothHold) {
	// 				adapter.releaseBoth(spin);
	// 			}
	// 			else {
	// 				console.log('CLICK LEFT');
	// 				desktop.mouseClick('left');
	// 				spin.flash(theme.primary);
	// 			}
	// 		}
	// 	}
	// });
	//
	// adapter.pushBoth = function(spin) {
	// 	console.log('PUSH BOTH');
	// 	adapter.state.didBothHold = true;
	// 	console.log('CLICK MIDDLE');
	// 	desktop.mouseClick('middle');
	// 	spin.flash(theme.tertiary);
	// };
	// adapter.releaseBoth = function() {
	// 	adapter.state.didBothHold = false;
	// 	console.log('RELEASE BOTH');
	// };
	//
	// spin.on('button', function (pushed) {
	// 	console.log('button', pushed);
	// 	if (pushed) {
	// 		adapter.state.didButtonSpin = false;
	// 	}
	// 	if (!adapter.state.didKnobHold) {
	// 		if (pushed) {
	// 			if (spin.state.knobPushed) {
	// 				adapter.pushBoth(spin);
	// 			}
	// 		} else {
	// 			if (adapter.state.didBothHold) {
	// 				adapter.releaseBoth();
	// 			}
	// 			else if (!adapter.state.didButtonSpin) {
	// 				console.log('CLICK RIGHT');
	// 				desktop.mouseClick('right');
	// 				spin.flash(theme.secondary);
	// 			}
	// 		}
	// 	}
	// });
	//
	// spin.on('knob-hold', function () {
	// 	console.log('KNOB HOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOLLLDD');
	// 	if (!adapter.state.didBothHold) {
	// 		console.log('knob hold');
	// 		adapter.state.didKnobHold = true;
	// 		desktop.mouseToggle('down', 'left');
	// 		// spin.quickFlash(theme.low, 3);
	// 		spin.quickFlash(theme.white, 5);
	// 	}
	// });
}

module.exports = mouseAdapter;
