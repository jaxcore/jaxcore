function getDefaultState() {
	return {
		distanceSlow: 20,
		distanceFast: 40,
		didKnobSpin: false,
		didButtonbSpin: false
	};
}

function precisionScrollAdapter() {
	const {spin} = this.devices;
	const {desktop} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	console.log('precisionScrollAdapter');
	
	this.setEvents({
		spin: {
			spin: function (diff, time) {
				console.log('precisionScroll rotate', diff, time);
				
				let distance = 0;
				if (time > 80) {
					distance = this.state.distanceSlow * diff;
				} else {
					distance = diff * (Math.abs(diff) > 1 ? this.state.distanceFast : this.state.distanceSlow);
				}
				
				if (spin.state.knobPushed) {
					this.state.didKnobSpin = true;
					if (diff > 0) {
						for (let i = 0; i < diff; i++) {
							desktop.keyPress('pagedown');
						}
					} else {
						for (let i = 0; i > diff; i--) {
							desktop.keyPress('pageup');
						}
					}
				} else if (spin.state.buttonPushed) {
					this.state.didButtonbSpin = true;
					desktop.precisionScrollX(distance);
					if (diff > 0) {
						spin.rotate(1, theme.high, theme.high);
					} else {
						spin.rotate(-1, theme.low, theme.low);
					}
				} else {
					desktop.precisionScrollY(distance);
					if (diff > 0) {
						spin.rotate(1, theme.high, theme.high);
					} else {
						spin.rotate(-1, theme.low, theme.low);
					}
				}
			},
			knob: function (pushed) {
				console.log('knob', pushed);
				if (pushed) {
					this.state.didKnobSpin = false;
				} else {
					if (!this.state.didKnobSpin) {
						desktop.keyPress('end');
					}
				}
			},
			button: function (pushed) {
				console.log('button', pushed);
				if (pushed) {
					this.state.didButtonbSpin = false;
				} else {
					if (!this.state.didButtonbSpin) {
						desktop.keyPress('home');
					}
				}
			}
		}
	});
}

precisionScrollAdapter.getDefaultState = getDefaultState;
module.exports = precisionScrollAdapter;