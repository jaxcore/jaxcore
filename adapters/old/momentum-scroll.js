var MomentumScroll = require('../scrolltest/lib/src/momentumscroll/momentumscroll.js').default;

function getDefaultState() {
	return {
		scrollForce: 0.01,
		scrollFriction: 0.05,
		shuttleForce: 0.001,
		shuttleFriction: 0.05,
		shuttleIntervalTime: 30,
		shuttlePositionH: 0,
		shuttlePositionV: 0,
		didBothSpin: false,
		didKnobSpin: false,
		didButtonSpin: false
	};
}

function startInterval(fn,t) {
	fn();
	return setInterval(fn,t);
}

function momentumScrollAdapter() {
	const {spin} = this.devices;
	const {desktop} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	this.momentumScroll = new MomentumScroll({
		intervalTime: 1
	});
	
	this.momentumScroll.on('scroll', (scrollX, scrollY) => {
		this.log('momentumScroll', 'X', scrollX, 'Y', scrollY);
		if (scrollX !== 0) desktop.scrollHorizontal(scrollX);
		if (scrollY !== 0) desktop.scrollVertical(scrollY);
	});
	
	this.setEvents({
		spin: {
			spin: function(diff, spinTime) {
				console.log('rotate', 'diff=' + diff, 'time=' + spinTime, 'button=' + spin.state.buttonPushed, 'knob=' + spin.state.knobPushed);
				let dir = diff > 0 ? 1 : -1;
				
				let scrollForce, scrollFriction;
				if (spinTime > 170) {
					scrollForce = diff * this.state.scrollForce;
					// let d = diff > 0? 1 : -1;
					// scrollForce = d * Math.pow(Math.abs(diff), 1.1) * this.state.scrollForce;
					scrollFriction = this.state.scrollFriction;
				} else if (spinTime > 70) {
					// let d = diff > 0? 1 : -1;
					// scrollForce = diff * this.state.scrollForce * 2;
					scrollForce = dir * Math.pow(Math.abs(diff * 1), 1.2) * this.state.scrollForce;
					// let d = diff > 0? 1 : -1;
					// scrollForce = d * Math.pow(Math.abs(diff), 1.1) * this.state.scrollForce;
					scrollFriction = this.state.scrollFriction;
				} else {
					// let d = diff > 0? 1 : -1;
					scrollForce = dir * Math.pow(Math.abs(diff * 1.1), 1.5) * this.state.scrollForce;
					scrollFriction = this.state.scrollFriction;
				}
				
				if (spin.state.knobPushed) this.state.didKnobSpin = true;
				if (spin.state.buttonPushed) this.state.didButtonSpin = true;
				if (spin.state.buttonPushed && spin.state.knobPushed) this.state.didBothSpin = true;
				
				if (spin.state.buttonPushed && spin.state.knobPushed) {
					// let shuttleDiff = spin.state.spinPosition - this.state.shuttlePositionH;
					// if (shuttleDiff === 0) {
					// 	this.momentumScroll.stopShuttleHorizontal();
					// } else {
					// 	let shuttleForce = shuttleDiff * this.state.shuttleForce;
					// 	this.momentumScroll.startShuttleHorizontal(shuttleDiff, shuttleForce, this.state.shuttleFriction, this.state.shuttleIntervalTime);
					// }
					
					if (diff > 0) {
						desktop.keyPress('+', ['command']);
						// desktop.keyToggle('a', 'down');
						// desktop.keyPress('+');
						// desktop.keyToggle('command', 'up');
					} else {
						desktop.keyPress('-', ['command']);
						// desktop.keyToggle('a', 'up');
						// desktop.keyPress('-');
						// desktop.keyToggle('command', 'up');
					}
				} else if (spin.state.buttonPushed) {
					
					this.momentumScroll.scrollHorizontal(diff, scrollForce, scrollFriction);
					
					if (dir === 1) spin.rotate(dir, theme.high);
					else spin.rotate(dir, theme.low);
					
				} else if (spin.state.knobPushed) {
					clearInterval(this.balanceInterval);
					let shuttleDiff = spin.state.spinPosition - this.state.shuttlePositionV;
					if (shuttleDiff === 0) {
						this.momentumScroll.stopShuttleVertical();
						spin.balance(0, theme.low, theme.high, theme.middle);
					} else {
						let d = shuttleDiff > 0 ? 1 : -1;
						let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), 1.5) * this.state.shuttleForce;
						this.momentumScroll.startShuttleVertical(shuttleDiff, shuttleForce, this.state.shuttleFriction, this.state.shuttleIntervalTime);
						
						let balance = d * Math.min(Math.abs(shuttleDiff), 24) / 24;
						console.log('shuttleDiff', shuttleDiff, 'balance', balance);
						
						spin.balance(balance, theme.low, theme.high, theme.middle);
						
						this.balanceInterval = startInterval(function() {
							spin.balance(balance, theme.low, theme.high, theme.middle);
						},500);
					}
				} else {
					this.momentumScroll.scrollVertical(diff, scrollForce, scrollFriction);
					if (dir === 1) spin.rotate(dir, theme.high);
					else spin.rotate(dir, theme.low);
				}
				
			},
			button: function(pushed) {
				console.log('button', pushed, 'knob=' + spin.state.knobPushed);
				if (pushed) {
					this.state.didButtonSpin = false;
					
					if (spin.state.knobPushed) {
						// this.state.didKnobButtonPush = true;
						// this.state.shuttlePositionH = spin.state.spinPosition;
					}
				} else {
					
					if (!this.state.didButtonSpin) {
						desktop.keyPress('home');
					}
					
					// this.momentumScroll.stopShuttleHorizontal();
					
					if (this.state.didBothSpin) {
						this.state.didBothSpin = false;
						// console.log('hi 1 ============');
						// desktop.scrollVertical(100);
					}
					
					if (spin.state.knobPushed) {
						// console.log('hi 1');
						// desktop.scrollVertical(100);
						// desktop.keyToggle('command', 'up');
					}
				}
			},
			knob: function(pushed) {
				console.log('knob', pushed, 'button=' + spin.state.buttonPushed);
				if (pushed) {
					this.state.shuttlePositionV = spin.state.spinPosition;
					this.state.didKnobSpin = false;
					
					if (spin.state.buttonPushed) {
						// this.state.shuttlePositionH = spin.state.spinPosition;
					}
				} else {
					if (!this.state.didKnobSpin) {
						desktop.keyPress('end');
					}
					
					clearInterval(this.balanceInterval);
					this.momentumScroll.stopShuttleVertical();
					
					if (spin.state.buttonPushed) {
						// desktop.keyToggle('command', 'up');
					}
					
					// this.momentumScroll.stopShuttleHorizontal();
				}
			}
		}
	});
	
	this.on('teardown', () => {
		this.momentumScroll.stop();
		this.momentumScroll.removeAllListeners();
	});
}

momentumScrollAdapter.getDefaultState = getDefaultState;
module.exports = momentumScrollAdapter;