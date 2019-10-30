var MomentumScroll = require('../scrolltest/lib/src/momentumscroll/momentumscroll.js').default;

function startInterval(fn,t) {
	fn();
	return setInterval(fn,t);
}

function momentumScrollAdapter(theme, devices) {
	const {spin, desktop} = devices;
	spin.rotateRainbow(1);
	spin.lightsOff();
	
	let adapter = {};
	
	adapter.momentumScroll = new MomentumScroll({
		intervalTime: 1
	});
	
	adapter.state = {
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
	
	let balanceInterval;
	
	adapter.momentumScroll.on('scroll', (scrollX, scrollY) => {
		// console.log('scroll', 'X', scrollX, 'Y', scrollY);
		if (scrollX !== 0) desktop.scrollHorizontal(scrollX);
		if (scrollY !== 0) desktop.scrollVertical(scrollY);
	});
	
	spin.on('spin', (diff, spinTime) => {
		console.log('rotate', 'diff=' + diff, 'time=' + spinTime, 'button=' + spin.state.buttonPushed, 'knob=' + spin.state.knobPushed);
		let dir = diff > 0 ? 1 : -1;
		
		let scrollForce, scrollFriction;
		if (spinTime > 170) {
			scrollForce = diff * adapter.state.scrollForce;
			// let d = diff > 0? 1 : -1;
			// scrollForce = d * Math.pow(Math.abs(diff), 1.1) * adapter.state.scrollForce;
			scrollFriction = adapter.state.scrollFriction;
		} else if (spinTime > 70) {
			// let d = diff > 0? 1 : -1;
			// scrollForce = diff * adapter.state.scrollForce * 2;
			scrollForce = dir * Math.pow(Math.abs(diff * 1), 1.2) * adapter.state.scrollForce;
			// let d = diff > 0? 1 : -1;
			// scrollForce = d * Math.pow(Math.abs(diff), 1.1) * adapter.state.scrollForce;
			scrollFriction = adapter.state.scrollFriction;
		} else {
			// let d = diff > 0? 1 : -1;
			scrollForce = dir * Math.pow(Math.abs(diff * 1.1), 1.5) * adapter.state.scrollForce;
			scrollFriction = adapter.state.scrollFriction;
		}
		
		if (spin.state.knobPushed) adapter.state.didKnobSpin = true;
		if (spin.state.buttonPushed) adapter.state.didButtonSpin = true;
		if (spin.state.buttonPushed && spin.state.knobPushed) adapter.state.didBothSpin = true;
		
		if (spin.state.buttonPushed && spin.state.knobPushed) {
			// let shuttleDiff = spin.state.spinPosition - adapter.state.shuttlePositionH;
			// if (shuttleDiff === 0) {
			// 	adapter.momentumScroll.stopShuttleHorizontal();
			// } else {
			// 	let shuttleForce = shuttleDiff * adapter.state.shuttleForce;
			// 	adapter.momentumScroll.startShuttleHorizontal(shuttleDiff, shuttleForce, adapter.state.shuttleFriction, adapter.state.shuttleIntervalTime);
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
			
			adapter.momentumScroll.scrollHorizontal(diff, scrollForce, scrollFriction);
			
			if (dir === 1) spin.rotate(dir, theme.high);
			else spin.rotate(dir, theme.low);
			
		} else if (spin.state.knobPushed) {
			let shuttleDiff = spin.state.spinPosition - adapter.state.shuttlePositionV;
			if (shuttleDiff === 0) {
				adapter.momentumScroll.stopShuttleVertical();
				spin.balance(0, theme.low, theme.high, theme.middle);
			} else {
				let d = shuttleDiff > 0 ? 1 : -1;
				let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), 1.5) * adapter.state.shuttleForce;
				adapter.momentumScroll.startShuttleVertical(shuttleDiff, shuttleForce, adapter.state.shuttleFriction, adapter.state.shuttleIntervalTime);
				
				let balance = d * Math.min(Math.abs(shuttleDiff), 24) / 24;
				console.log('shuttleDiff', shuttleDiff, 'balance', balance);
				
				spin.balance(balance, theme.low, theme.high, theme.middle);
				
				// balanceInterval = startInterval(function() {
				// 	spin.balance(balance, theme.low, theme.high, theme.middle);
				// },500);
			}
		} else {
			adapter.momentumScroll.scrollVertical(diff, scrollForce, scrollFriction);
			if (dir === 1) spin.rotate(dir, theme.high);
			else spin.rotate(dir, theme.low);
		}
		
	});
	spin.on('button', (pushed) => {
		console.log('button', pushed, 'knob=' + spin.state.knobPushed);
		if (pushed) {
			adapter.state.didButtonSpin = false;
			
			if (spin.state.knobPushed) {
				// adapter.state.didKnobButtonPush = true;
				// adapter.state.shuttlePositionH = spin.state.spinPosition;
			}
		} else {
			
			if (!adapter.state.didButtonSpin) {
				desktop.keyPress('home');
			}
			
			// adapter.momentumScroll.stopShuttleHorizontal();
			
			if (adapter.state.didBothSpin) {
				adapter.state.didBothSpin = false;
				// console.log('hi 1 ============');
				// desktop.scrollVertical(100);
			}
			
			if (spin.state.knobPushed) {
				// console.log('hi 1');
				// desktop.scrollVertical(100);
				// desktop.keyToggle('command', 'up');
			}
		}
		
	});
	spin.on('knob', (pushed) => {
		console.log('knob', pushed, 'button=' + spin.state.buttonPushed);
		if (pushed) {
			adapter.state.shuttlePositionV = spin.state.spinPosition;
			adapter.state.didKnobSpin = false;
			
			if (spin.state.buttonPushed) {
				// adapter.state.shuttlePositionH = spin.state.spinPosition;
			}
		} else {
			if (!adapter.state.didKnobSpin) {
				desktop.keyPress('end');
			}
			
			adapter.momentumScroll.stopShuttleVertical();
			
			if (spin.state.buttonPushed) {
				// desktop.keyToggle('command', 'up');
			}
			
			// adapter.momentumScroll.stopShuttleHorizontal();
		}
	});
	
}

module.exports = momentumScrollAdapter;