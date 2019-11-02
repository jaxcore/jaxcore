
function getDefaultState() {
	return {
		didBothSpin: false,
		didBothPush: false,
		didKnobSpin: false,
		didButtonSpin: false
	};
}

function startInterval(fn,t) {
	fn();
	return setInterval(fn,t);
}

function scrollAdapter() {
	const {spin} = this.devices;
	const {scroll} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	this.setEvents({
		spin: {
			spin: function(diff, time) {
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
					this.balanceInterval = startInterval(function() {
						spin.balance(balance, theme.primary, theme.secondary, theme.tertiary);
					},500);
					
				} else if (spin.state.buttonPushed) {
					scroll.scrollHorizontal(diff, time);
					if (diff > 0) spin.rotate(dir, theme.primary);
					else spin.rotate(dir, theme.secondary);
					
				} else if (spin.state.knobPushed) {
					clearInterval(this.balanceInterval);
					let shuttleDiff = scroll.shuttleVertical(spin.state.spinPosition);
					let balance = 0;
					if (shuttleDiff !== 0) {
						let d = shuttleDiff > 0 ? 1 : -1;
						balance = d * Math.min(Math.abs(shuttleDiff), 24) / 24;
					}
					this.balanceInterval = startInterval(function() {
						spin.balance(balance, theme.low, theme.high, theme.middle);
					},500);
				} else {
					scroll.scrollVertical(diff, time);
					if (dir === 1) spin.rotate(dir, theme.high);
					else spin.rotate(dir, theme.low);
				}
			},
			button: function(pushed) {
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
				} else {
					if (this.state.didBothPush) {
						this.state.didBothPush = false;
						clearInterval(this.balanceInterval);
						scroll.stopShuttleHorizontal();
					}
					
					if (this.state.didBothSpin) {
						this.state.didBothSpin = false;
					}
				}
			},
			knob: function(pushed) {
				console.log('knob', pushed, 'button=' + spin.state.buttonPushed);
				if (pushed) {
					if (spin.state.buttonPushed) {
						scroll.startShuttleHorizontal(spin.state.spinPosition);
						this.state.didBothSpin = false;
						this.state.didBothPush = true;
					}
					else {
						scroll.startShuttleVertical(spin.state.spinPosition);
						this.state.didKnobSpin = false;
					}
				} else {
					if (this.state.didBothPush) {
						this.state.didBothPush = false;
						clearInterval(this.balanceInterval);
						scroll.stopShuttleHorizontal();
					}
					else {
						clearInterval(this.balanceInterval);
						scroll.stopShuttleVertical();
						
					}
				}
			}
		},
		scroll: {
			scroll: function(scrollX, scrollY) {
				this.log('scroll', scrollX, scrollY);
			}
		}
	});
	
	this.on('teardown', () => {
		scroll.stop();
	});
}

scrollAdapter.getServicesConfig = function(adapterConfig) {
	console.log('scrollAdapter getServicesConfig', adapterConfig);
	let servicesConfig = {
		scroll: {
			type: 'momentum'
		}
	};
	return servicesConfig;
};

scrollAdapter.getDefaultState = getDefaultState;
module.exports = scrollAdapter;