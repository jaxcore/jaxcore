const Adapter = require('jaxcore-plugin').Adapter;

class MouseAdapter extends Adapter {
	static getDefaultState () {
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
	
	constructor (config, theme, devices, services) {
		super(config, theme, devices, services);
		const {spin} = devices;
		const {mouse} = services;
		spin.rotateRainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
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
					
					let scroll = 0;
					if (time < 65) {
						scroll = diff * (Math.abs(diff) > 1 ? this.state.scrollFast : this.state.scrollSlow);
					}
					else if (time < 100) {
						scroll = diff * (Math.abs(diff) > 1 ? this.state.scrollFast : this.state.scrollSlow);
					}
					else {
						scroll = this.state.scrollSlow * diff;
					}
					mouse.scroll(0, scroll);
					spin.rotate(dir, theme.middle, theme.middle);
				}
				else if (spin.state.buttonPushed) {
					this.state.didButtonSpin = true;
					
					let y = mousePos.y + distance;
					if (y < 1) y = 1;
					if (y > size.height) y = size.height;
					if (this.state.didKnobHold) {
						this.log('drag mouse Y', y);
						mouse.dragMouse(mousePos.x, y);
						spin.rotate(dir, theme.secondary, theme.secondary);
					}
					else {
						this.log('move mouse Y', y);
						mouse.moveMouse(mousePos.x, y);
						spin.rotate(dir, theme.high);
					}
				}
				else {
					let x = mousePos.x + distance;
					if (x < 1) x = 1;
					if (x > size.width) x = size.width;
					if (this.state.didKnobHold) {
						this.log('drag mouse X', x);
						mouse.moveMouse(x, mousePos.y);
						spin.rotate(dir, theme.primary, theme.primary);
					}
					else {
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
					}
					else {
						if (spin.state.buttonPushed) {
							this.pushBoth(spin);
						}
					}
				}
				else {
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
					}
					else if (this.state.didKnobHold) {
					
					}
					else {
						if (this.state.didBothHold) {
						}
						else {
							this.log('CLICK LEFT');
							mouse.mouseClick('left');
							spin.flash(theme.primary);
						}
					}
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
				
				if (pushed) {
					this.state.didButtonSpin = false;
					
					if (this.state.didKnobHold) {
					}
					else if (spin.state.knobPushed) {
						this.pushBoth(spin);
					}
				}
				else {
					if (this.state.didBothHold) {
						if (!spin.state.knobPushed) {
							this.releaseBoth(spin);
						}
						return;
					}
					
					if (this.state.didKnobHold) {
					}
					else if (!this.state.didButtonSpin) {
						this.log('CLICK RIGHT');
						mouse.mouseClick('right');
						spin.flash(theme.secondary);
					}
				}
			},
			knobHold: function () {
				if (this.state.didBothHold) {
					this.log('didBothHold, ignore knob hold');
				}
				else {
					this.log('knob hold');
					this.state.didKnobHold = true;
					mouse.mouseToggle('down', 'left');
					spin.quickFlash(theme.white, 3);
				}
			}
		});
	}
	
	pushBoth () {
		this.log('PUSH BOTH');
		this.state.didBothPush = true;
		this.state.didBothHold = true;
		this.log('CLICK MIDDLE');
		this.services.mouse.mouseClick('middle');
		this.devices.spin.flash(theme.tertiary);
	}
	
	releaseBoth () {
		this.state.didBothHold = false;
		this.log('RELEASE BOTH');
	}
	
	static getServicesConfig (adapterConfig) {
		return {
			mouse: true
		};
	}
}

module.exports = MouseAdapter;