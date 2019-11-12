const Adapter = require('jaxcore-plugin').Adapter;

function startInterval(fn, t) {
	fn();
	return setInterval(fn, t);
}

class ScrollAdapter extends Adapter {
	static getDefaultState() {
		return {
			didBothSpin: false,
			didBothPush: false,
			didKnobSpin: false,
			didButtonSpin: false
		};
	}
	
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		const {scroll, keyboard} = services;
		spin.rotateRainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, time) {
				console.log('rotate', 'diff=' + diff, 'time=' + time, 'button=' + spin.state.buttonPushed, 'knob=' + spin.state.knobPushed);
				let dir = diff > 0 ? 1 : -1;
				
				if (spin.state.knobPushed) this.state.didKnobSpin = true;
				if (spin.state.buttonPushed) this.state.didButtonSpin = true;
				if (spin.state.buttonPushed && spin.state.knobPushed) this.state.didBothSpin = true;
				
				if (spin.state.buttonPushed && spin.state.knobPushed) {
					this.state.didBothSpin = true;
					clearInterval(this.balanceInterval);
					let shuttleDiff = scroll.shuttleHorizontal(spin.state.spinPosition);
					let balance = 0;
					if (shuttleDiff !== 0) {
						let d = shuttleDiff > 0 ? 1 : -1;
						balance = d * Math.min(Math.abs(shuttleDiff), 24) / 24;
					}
					this.balanceInterval = startInterval(function () {
						spin.balance(balance, theme.primary, theme.secondary, theme.tertiary);
					}, 500);
					
				}
				else if (spin.state.buttonPushed) {
					this.state.didButtonSpin = true;
					
					scroll.scrollHorizontal(diff, time);
					if (diff > 0) spin.rotate(dir, theme.primary);
					else spin.rotate(dir, theme.secondary);
					
				}
				else if (spin.state.knobPushed) {
					this.state.didKnobSpin = true;
					
					clearInterval(this.balanceInterval);
					let shuttleDiff = scroll.shuttleVertical(spin.state.spinPosition);
					let balance = 0;
					if (shuttleDiff !== 0) {
						let d = shuttleDiff > 0 ? 1 : -1;
						balance = d * Math.min(Math.abs(shuttleDiff), 24) / 24;
					}
					this.balanceInterval = startInterval(function () {
						spin.balance(balance, theme.low, theme.high, theme.middle);
					}, 500);
				}
				else {
					scroll.scrollVertical(diff, time);
					if (dir === 1) spin.rotate(dir, theme.high);
					else spin.rotate(dir, theme.low);
				}
			},
			button: function (pushed) {
				console.log('button', pushed, 'knob=' + spin.state.knobPushed);
				if (pushed) {
					this.state.didButtonSpin = false;
					if (spin.state.knobPushed) {
						clearInterval(this.balanceInterval);
						scroll.stopShuttleVertical();
						
						scroll.startShuttleHorizontal(spin.state.spinPosition);
						this.state.didBothSpin = false;
						this.state.didBothPush = true;
					}
				}
				else {
					if (this.state.didBothPush) {
						this.state.didBothPush = false;
						clearInterval(this.balanceInterval);
						scroll.stopShuttleHorizontal();
					}
					else {
						if (!this.state.didButtonSpin) {
							keyboard.keyPress('home');
						}
					}
				}
			},
			knob: function (pushed) {
				console.log('knob', pushed, 'button=' + spin.state.buttonPushed);
				if (pushed) {
					this.state.didKnobSpin = false;
					
					if (spin.state.buttonPushed) {
						scroll.startShuttleHorizontal(spin.state.spinPosition);
						this.state.didBothSpin = false;
						this.state.didBothPush = true;
					}
					else {
						scroll.startShuttleVertical(spin.state.spinPosition);
						this.state.didKnobSpin = false;
					}
				}
				else {
					
					
					if (this.state.didBothPush) {
						this.state.didBothPush = false;
						clearInterval(this.balanceInterval);
						scroll.stopShuttleHorizontal();
					}
					else {
						if (!this.state.didKnobSpin) {
							keyboard.keyPress('end');
						}
						clearInterval(this.balanceInterval);
						scroll.stopShuttleVertical();
						
					}
				}
			}
		});
		
		this.addEvents(scroll, {
			scroll: function (scrollX, scrollY) {
				this.log('scroll', scrollX, scrollY);
			}
		});
		
		this.on('teardown', () => {
			scroll.stop();
		});
		
	}
	
	static getServicesConfig(adapterConfig) {
		return {
			scroll: true,
			keyboard: true
		};
	}
}

module.exports = ScrollAdapter;