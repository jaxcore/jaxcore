function getDefaultState() {
	return {
		didKnobHold: false,
		didBothPush: false,
		didBothHold: false,
		didButtonSpin: false,
		didKnobSpin: false,
		scrollFast: 40,
		scrollSlow: 20
	};
}

// function startInterval(fn,t) {
// 	fn();
// 	return setInterval(fn,t);
// }

function mouseAdapter() {
	const {spin} = this.devices;
	const {mouse} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	// this.momentumScroll = new MomentumScroll({
	// 	intervalTime: 1
	// });
	//
	// this.momentumScroll.on('scroll', (scrollX, scrollY) => {
	// 	this.log('momentumScroll', 'X', scrollX, 'Y', scrollY);
	// 	if (scrollX !== 0) mouse.scrollHorizontal(scrollX);
	// 	if (scrollY !== 0) mouse.scrollVertical(scrollY);
	// });
	
	this.pushBoth = function(spin) {
		this.log('PUSH BOTH');
		this.state.didBothPush = true;
		this.state.didBothHold = true;
		this.log('CLICK MIDDLE');
		// mouse.mouseToggle('down', 'middle');
		mouse.mouseClick('middle');
		spin.flash(theme.tertiary);
	};
	this.releaseBoth = function() {
		this.state.didBothHold = false;
		this.log('RELEASE BOTH');
	};
	
	this.setEvents({
		spin: {
			spin: function (diff, time) {
				if (this.state.didBothHold) {
					return;
				}
				
				var mousePos = mouse.getMousePos();
				let size = mouse.getScreenSize();
				this.log('spin', diff, time);
				
				let distance;
				let dir = diff > 0 ? 1 : -1;
				if (time < 65) distance = dir * Math.round(Math.pow(Math.abs(diff), 1.8));
				else if (time < 150) distance = dir * Math.round(Math.pow(Math.abs(diff), 1.4));
				else distance = diff;
				
				if (spin.state.knobPushed) {
					this.state.didKnobSpin = true;
					
					// momentum scroll:
					// clearInterval(this.balanceInterval);
					// let shuttleDiff = spin.state.spinPosition - this.state.shuttlePositionV;
					// if (shuttleDiff === 0) {
					// 	this.momentumScroll.stopShuttleVertical();
					// 	spin.balance(0, theme.low, theme.high, theme.middle);
					// } else {
					// 	let d = shuttleDiff > 0 ? 1 : -1;
					// 	let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), 1.5) * this.state.shuttleForce;
					// 	this.momentumScroll.startShuttleVertical(shuttleDiff, shuttleForce, this.state.shuttleFriction, this.state.shuttleIntervalTime);
					//
					// 	let balance = d * Math.min(Math.abs(shuttleDiff), 24) / 24;
					// 	console.log('shuttleDiff', shuttleDiff, 'balance', balance);
					//
					// 	spin.balance(balance, theme.low, theme.high, theme.middle);
					//
					// 	this.balanceInterval = startInterval(function() {
					// 		spin.balance(balance, theme.low, theme.high, theme.middle);
					// 	},500);
					// }
					
					// precision scroll
					let scroll = 0;
					if (time < 65) {
						scroll = diff * (Math.abs(diff) > 1 ? this.state.scrollFast : this.state.scrollSlow);
					} else if (time < 100) {
						scroll = diff * (Math.abs(diff) > 1 ? this.state.scrollFast : this.state.scrollSlow);
					} else {
						scroll = this.state.scrollSlow * diff;
					}
					mouse.scroll(0, scroll);
					spin.rotate(dir, theme.middle, theme.middle);
					
					// vertical mouse position:
					// if (time < 65) distance = dir * 10 * Math.round(Math.pow(Math.abs(diff),1.5));
					// else distance = diff * 7;
					// let y = mousePos.y + distance;
					// if (y < 1) y = 1;
					// if (y > size.height) y = size.height;
					// this.log('move mouse Y', y);
					// mouse.moveMouse(mousePos.x, y);
					// spin.rotate(dir, theme.high, theme.high);
				} else if (spin.state.buttonPushed) {
					this.state.didButtonSpin = true;
					
					let y = mousePos.y + distance;
					if (y < 1) y = 1;
					if (y > size.height) y = size.height;
					if (this.state.didKnobHold) {
						this.log('drag mouse Y', y);
						mouse.dragMouse(mousePos.x, y);
						spin.rotate(dir, theme.secondary, theme.secondary);
					} else {
						this.log('move mouse Y', y);
						mouse.moveMouse(mousePos.x, y);
						spin.rotate(dir, theme.high);
					}
				} else {
					let x = mousePos.x + distance;
					if (x < 1) x = 1;
					if (x > size.width) x = size.width;
					if (this.state.didKnobHold) {
						this.log('drag mouse X', x);
						mouse.moveMouse(x, mousePos.y);
						spin.rotate(dir, theme.primary, theme.primary);
					} else {
						this.log('move mouse X', x);
						mouse.moveMouse(x, mousePos.y);
						spin.rotate(dir, theme.low);
					}
				}
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) {
					// this.state.shuttlePositionV = spin.state.spinPosition;
					
					if (this.state.didKnobHold) {
						mouse.mouseToggle('up', 'left');
						spin.quickFlash(theme.low, 2);
						this.state.didKnobHold = false;
					} else {
						if (spin.state.buttonPushed) {
							this.pushBoth(spin);
						}
					}
				} else {
					// clearInterval(this.balanceInterval);
					// this.momentumScroll.stopShuttleVertical();
					
					if (this.state.didBothHold) {
						if (!spin.state.buttonPushed) {
							this.releaseBoth(spin);
						}
						return;
					}
					
					if (this.state.didKnobSpin) {
						this.state.didKnobSpin = false;
					} else if (this.state.didKnobHold) {
					
					} else {
						if (this.state.didBothHold) {
							// this.releaseBoth(spin);
							// if (!this.state.buttonPushed) this.state.didBothHold = false;
						} else {
							// if (this.state.didBothPush) {
							// 	this.state.didBothPush = false;
							// 	// this.log('CLICK MIDDLE');
							// 	// mouse.mouseToggle('up', 'middle');
							// 	// spin.flash(theme.tertiary);
							// }
							// else {
							this.log('CLICK LEFT');
							mouse.mouseClick('left');
							spin.flash(theme.primary);
							// }
						}
					}
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
				
				if (pushed) {
					this.state.didButtonSpin = false;
					
					if (this.state.didKnobHold) {
					} else if (spin.state.knobPushed) {
						this.pushBoth(spin);
					}
				} else {
					if (this.state.didBothHold) {
						if (!spin.state.knobPushed) {
							this.releaseBoth(spin);
						}
						return;
					}
					
					if (this.state.didKnobHold) {
					} else if (!this.state.didButtonSpin) {
						this.log('CLICK RIGHT');
						mouse.mouseClick('right');
						spin.flash(theme.secondary);
					}
				}
			},
			knobHold: function () {
				if (this.state.didBothHold) {
					this.log('didBothHold, ignore knob hold');
				} else {
					this.log('knob hold');
					this.state.didKnobHold = true;
					mouse.mouseToggle('down', 'left');
					spin.quickFlash(theme.white, 3);
				}
			}
		}
	});
}

mouseAdapter.getServicesConfig = function(adapterConfig) {
	console.log('mouseAdapter getServicesConfig', adapterConfig);
	
	let servicesConfig = {
		mouse: {
			scroll: 'precision'
			// scroll: 'momentum'
		}
	};
	
	return servicesConfig;
};

mouseAdapter.getDefaultState = getDefaultState;
module.exports = mouseAdapter;
