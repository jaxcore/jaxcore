function getDefaultState() {
	return {
		didKnobHold: false,
		didBothHold: false,
		didButtonSpin: false
	};
}

function testAdapter() {
	const {spin, desktop} = this.devices;
	spin.rotateRainbow(1);
	spin.lightsOff();
	desktop.setVolume(30);
	
	this.setEvents({
		spin: {
			spin: function (diff, spinTime) {
				this.log('SPIN', diff, spinTime, spin.state.spinPosition);
			},
			knob: function (pushed) {
				this.log('KNOB', pushed);
				if (pushed) {
					spin.flash([255,0,0]);
					desktop.setVolume(50);
				}
			},
			button: function (pushed) {
				this.log('BUTTON', pushed);
				if (pushed) {
					desktop.setVolume(10);
				}
			},
			knobHold: function () {
				this.log('KNOB-HOLD');
			}
		},
		desktop: {
			volume: function(v) {
				this.log('ON VOLUME', v);
			}
		}
	});
}

testAdapter.getDefaultState = getDefaultState;

module.exports = testAdapter;
