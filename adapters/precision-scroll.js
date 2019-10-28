function precisionScrollAdapter(spin, desktopService) {
	var adapter = {
		state: {
			distanceSlow: 20,
			distanceFast: 40,
			didKnobSpin: false,
			didButtonbSpin: false
		}
	};
	spin.on('rotate', function (diff, time) {
		console.log('precisionScroll rotate', diff, time);
		
		let distance = 0;
		// if (time > 200) {
		// 	distance = adapter.state.distanceSlow * diff;
		// }
		if (time > 80) {
			distance = adapter.state.distanceSlow * diff;
		}
		else {
			distance = diff * (Math.abs(diff)>1? adapter.state.distanceFast : adapter.state.distanceSlow);
		}
		
		if (spin.state.knobPushed) {
			adapter.state.didKnobSpin = true;
			desktopService.precisionScrollX(distance);
			if (diff > 0) {
				spin.rotate(1, [255, 0, 0], [255,0,0]);
			}
			else {
				spin.rotate(-1, [0,0,255], [0,0,255]);
			}
		}
		else if (spin.state.buttonPushed) {
			adapter.state.didButtonbSpin = true;
			if (diff > 0) {
				for (let i=0;i<diff;i++) {
					desktopService.keyPress('pagedown');
				}
			}
			else {
				for (let i=0;i>diff;i--) {
					desktopService.keyPress('pageup');
				}
			}
		}
		else {
			desktopService.precisionScrollY(distance);
			if (diff > 0) {
				spin.rotate(1, [255, 0, 0], [255,0,0]);
			}
			else {
				spin.rotate(-1, [0,0,255], [0,0,255]);
			}
		}
	});
	
	spin.on('knob', function (pushed) {
		console.log('knob !!', pushed);
		if (pushed) {
			adapter.state.didKnobSpin = false;
		}
		else {
			if (!adapter.state.didKnobSpin) {
				desktopService.keyPress('end');
			}
		}
	});
	
	spin.on('button', function (pushed) {
		console.log('button !!', pushed);
		if (pushed) {
			adapter.state.didButtonbSpin = false;
		}
		else {
			if (!adapter.state.didButtonbSpin) {
				desktopService.keyPress('home');
			}
		}
	});
}

module.exports = precisionScrollAdapter;