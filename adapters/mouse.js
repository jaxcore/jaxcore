function getDefaultState() {
	return {
		didKnobHold: false,
		didBothHold: false,
		didButtonSpin: false,
		didKnobSpin: false
	};
}

function mouseAdapter() {
	const {spin, desktop} = this.devices;
	const theme = this.theme;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	this.pushBoth = function(spin) {
		this.log('PUSH BOTH');
		this.state.didBothHold = true;
		this.log('CLICK MIDDLE');
		desktop.mouseClick('middle');
		spin.flash(theme.tertiary);
	};
	this.releaseBoth = function() {
		this.state.didBothHold = false;
		this.log('RELEASE BOTH');
	};
	
	this.setEvents({
		spin: {
			spin: function (diff, spinTime) {
				if (this.state.didBothHold) {
					return;
				}
				
				var mouse = desktop.getMousePos();
				let size = desktop.getScreenSize();
				this.log('spin rotate', diff, mouse, size);
				
				let distance;
				let dir = diff > 0? 1:-1;
				if (spinTime < 65) distance = dir * Math.round(Math.pow(Math.abs(diff),1.8));
				else if (spinTime < 150) distance = dir * Math.round(Math.pow(Math.abs(diff),1.4));
				else distance = diff;
				
				if (spin.state.knobPushed) {
					this.state.didKnobSpin = true;
					if (spinTime < 65) distance = dir * 10 * Math.round(Math.pow(Math.abs(diff),1.5));
					else distance = diff * 7;
					let y = mouse.y + distance;
					if (y < 1) y = 1;
					if (y > size.height) y = size.height;
					this.log('move mouse Y', y);
					desktop.moveMouse(mouse.x, y);
					spin.rotate(dir, theme.high, theme.high);
				}
				else if (spin.state.buttonPushed) {
					this.state.didButtonSpin = true;
					
					let y = mouse.y + distance;
					if (y < 1) y = 1;
					if (y > size.height) y = size.height;
					if (this.state.didKnobHold) {
						this.log('drag mouse Y', y);
						desktop.dragMouse(mouse.x, y);
						spin.rotate(dir, theme.secondary, theme.secondary);
					}
					else {
						this.log('move mouse Y', y);
						desktop.moveMouse(mouse.x, y);
						spin.rotate(dir, theme.high);
					}
				}
				else {
					let x = mouse.x + distance;
					if (x < 1) x = 1;
					if (x > size.width) x = size.width;
					if (this.state.didKnobHold) {
						this.log('drag mouse X', x);
						desktop.moveMouse(x, mouse.y);
						spin.rotate(dir, theme.primary, theme.primary);
					}
					else {
						this.log('move mouse X', x);
						desktop.moveMouse(x, mouse.y);
						spin.rotate(dir, theme.low);
					}
				}
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) {
					if (this.state.didKnobHold) {
						desktop.mouseToggle('up','left');
						spin.quickFlash(theme.low, 2);
						this.state.didKnobHold = false;
					}
					else {
						if (spin.state.buttonPushed) {
							this.pushBoth(spin);
						}
					}
				}
				else {
					if (this.state.didKnobSpin) {
						this.state.didKnobSpin = false;
					}
					else if (this.state.didKnobHold) {
					
					}
					else {
						if (this.state.didBothHold) {
							this.releaseBoth(spin);
						}
						else {
							this.log('CLICK LEFT');
							desktop.mouseClick('left');
							spin.flash(theme.primary);
						}
					}
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
				if (pushed) {
					this.state.didButtonSpin = false;
				}
				if (!this.state.didKnobHold) {
					if (pushed) {
						if (spin.state.knobPushed) {
							this.pushBoth(spin);
						}
					} else {
						if (this.state.didBothHold) {
							this.releaseBoth();
						}
						else if (!this.state.didButtonSpin) {
							this.log('CLICK RIGHT');
							desktop.mouseClick('right');
							spin.flash(theme.secondary);
						}
					}
				}
			},
			knobHold: function () {
				this.log('knob hold');
				if (!this.state.didBothHold) {
					this.log('knob hold');
					this.state.didKnobHold = true;
					desktop.mouseToggle('down', 'left');
					spin.quickFlash(theme.white, 5);
				}
			}
		},
		desktop: {
			volume: function(v) {
				this.log('ON VOLUME', v);
			}
		}
	});
}

mouseAdapter.getDefaultState = getDefaultState;
module.exports = mouseAdapter;
