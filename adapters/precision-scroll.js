function precisionScrollAdapter(theme, devices) {
	const {spin, desktop} = devices;
	spin.rotateRainbow(1);
	spin.lightsOff();
	
	var adapter = {
		state: {
			distanceSlow: 20,
			distanceFast: 40,
			didKnobSpin: false,
			didButtonbSpin: false
		}
	};
	spin.on('spin', function (diff, time) {
		console.log('precisionScroll rotate', diff, time);
		
		let distance = 0;
		if (time > 80) {
			distance = adapter.state.distanceSlow * diff;
		}
		else {
			distance = diff * (Math.abs(diff)>1? adapter.state.distanceFast : adapter.state.distanceSlow);
		}
		
		if (spin.state.knobPushed) {
			adapter.state.didKnobSpin = true;
			if (diff > 0) {
				for (let i=0;i<diff;i++) {
					desktop.keyPress('pagedown');
				}
			}
			else {
				for (let i=0;i>diff;i--) {
					desktop.keyPress('pageup');
				}
			}
		}
		else if (spin.state.buttonPushed) {
			adapter.state.didButtonbSpin = true;
			desktop.precisionScrollX(distance);
			if (diff > 0) {
				spin.rotate(1, theme.high, theme.high);
			}
			else {
				spin.rotate(-1, theme.low, theme.low);
			}
		}
		else {
			desktop.precisionScrollY(distance);
			if (diff > 0) {
				spin.rotate(1, theme.high, theme.high);
			}
			else {
				spin.rotate(-1, theme.low, theme.low);
			}
		}
	});
	
	spin.on('knob', function (pushed) {
		console.log('knob', pushed);
		if (pushed) {
			adapter.state.didKnobSpin = false;
		}
		else {
			if (!adapter.state.didKnobSpin) {
				desktop.keyPress('end');
			}
		}
	});
	
	spin.on('button', function (pushed) {
		console.log('button', pushed);
		if (pushed) {
			adapter.state.didButtonbSpin = false;
		}
		else {
			if (!adapter.state.didButtonbSpin) {
				desktop.keyPress('home');
			}
		}
	});
}

module.exports = precisionScrollAdapter;