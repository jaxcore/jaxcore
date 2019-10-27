const Spin = require('jaxcore-spin');
const DesktopService = require('./desktop-service-macosx');
const MomentumScroll = DesktopService.MomentumScroll;
global.window = {};

function startSpinService() {
	Spin.connectBLE(function (spin) {
		console.log('connected BLE', spin.id);
		spin.setBrightness(2);
		startDesktopService(spin);
		// startScrollService(spin);
	});
}

function startScrollService(spin) {
	
	
	// var c = 0;
	// setInterval(function() {
	// 	console.log(c++, momentumScroll.scroller.position.y);
	// },100);
	//
	// momentumScroll.scroller.frictionAir = 0.05;
	// setTimeout(function() {
	// 	momentumScroll.applyForce(0, 0.005);
	// },5000);
	
	// let adapter = this;
	//
	// adapter.state = {
	// 	scrollSettings: {
	// 		scrollForce: 0.004,
	// 		scrollFriction: 0.05,
	// 		shuttleFriction: 0.05,
	// 		shuttleForce: 0.001,
	// 		shuttleIntervalTime: 30,
	// 		shuttlePositionH: 0,
	// 		shuttlePositionV: 0
	// 	}
	// };
	// momentumScroll.on('scroll', (scrollX, scrollY) => {
	// 	console.log('scrollY', scrollY);
	// });
	
	// momentumScroll.scrollVertical(1, 1 * adapter.state.scrollForce, adapter.state.scrollFriction);
	
	// spinScrollAdapter(spin, momentumScroll);
}

function spinScrollAdapter(spin, momentumScroll) {
	spin.flash([0, 255, 0]);
	
	
}

// var desktopService = new DesktopService({
// 	minVolume: 0,
// 	maxVolume: 100
// });

function startDesktopService(spin) {
	var desktopService = new DesktopService({
		minVolume: 0,
		maxVolume: 100
	});
	
	desktopService.on('connect', function () {
		console.log('volume connected ', this.state.maxVolume);
		
		spinDesktopAdapter(spin, desktopService);
	});
	
	desktopService.connect();
}

function spinDesktopAdapter(spin, desktopService) {
	
	spin.flash([0, 255, 0]);
	
	let adapter = {};
	
	adapter.momentumScroll = new MomentumScroll({
		intervalTime: 10
	});
	
	adapter.state = {
		scrollForce: 0.008,
		scrollFriction: 0.05,
		shuttleFriction: 0.05,
		shuttleForce: 0.001,
		shuttleIntervalTime: 30,
		shuttlePositionH: 0,
		shuttlePositionV: 0,
		
		didKnobButtonPush: false
	};
	
	adapter.momentumScroll.on('scroll', (scrollX, scrollY) => {
		// console.log('scroll', 'X', scrollX, 'Y', scrollY);
		if (scrollX !== 0) desktopService.scrollHorizontal(scrollX);
		if (scrollY !== 0) desktopService.scrollVertical(scrollY);
	});
	
	spin.on('rotate', (diff, spinTime) => {
		console.log('rotate', 'diff='+diff, 'time='+spinTime, 'button='+spin.state.buttonPushed, 'knob='+spin.state.knobPushed);
		
		let scrollForce, scrollFriction;
		if (spinTime > 80) {
			// scrollForce = diff * adapter.state.scrollForce;
			let d = diff > 0? 1 : -1;
			scrollForce = d * Math.pow(Math.abs(diff), 1.1) * adapter.state.scrollForce;
			scrollFriction = adapter.state.scrollFriction;
		}
		else {
			let d = diff > 0? 1 : -1;
			scrollForce = d * Math.pow(Math.abs(diff * 1.3), 1.3) * adapter.state.scrollForce;
			scrollFriction = adapter.state.scrollFriction * 2;
		}
		
		if (spin.state.buttonPushed && spin.state.knobPushed) {
			// let shuttleDiff = spin.state.spinPosition - adapter.state.shuttlePositionH;
			// if (shuttleDiff === 0) {
			// 	adapter.momentumScroll.stopShuttleHorizontal();
			// } else {
			// 	let shuttleForce = shuttleDiff * adapter.state.shuttleForce;
			// 	adapter.momentumScroll.startShuttleHorizontal(shuttleDiff, shuttleForce, adapter.state.shuttleFriction, adapter.state.shuttleIntervalTime);
			// }
			
			if (diff > 0) {
				desktopService.keyPress('+', ['command']);
				// desktopService.keyToggle('a', 'down');
				// desktopService.keyPress('+');
				// desktopService.keyToggle('command', 'up');
			}
			else {
				desktopService.keyPress('-', ['command']);
				// desktopService.keyToggle('a', 'up');
				// desktopService.keyPress('-');
				// desktopService.keyToggle('command', 'up');
			}
			
		} else if (spin.state.buttonPushed) {
			adapter.momentumScroll.scrollHorizontal(diff, scrollForce, scrollFriction);
		} else if (spin.state.knobPushed) {
			let shuttleDiff = spin.state.spinPosition - adapter.state.shuttlePositionV;
			if (shuttleDiff === 0) {
				adapter.momentumScroll.stopShuttleVertical();
			} else {
				let d = shuttleDiff > 0? 1 : -1;
				let shuttleForce = d * Math.pow(Math.abs(shuttleDiff), 1.5) * adapter.state.shuttleForce;
				adapter.momentumScroll.startShuttleVertical(shuttleDiff, shuttleForce, adapter.state.shuttleFriction, adapter.state.shuttleIntervalTime);
			}
		} else {
			adapter.momentumScroll.scrollVertical(diff, scrollForce, scrollFriction);
		}
		
	});
	spin.on('button', (pushed) => {
		console.log('button', pushed, 'knob='+spin.state.knobPushed);
		if (pushed) {
			
			if (spin.state.knobPushed) {
				adapter.state.didKnobButtonPush = true;
				// adapter.state.shuttlePositionH = spin.state.spinPosition;
			}
		}
		else {
			// adapter.momentumScroll.stopShuttleHorizontal();
			
			if (adapter.state.didKnobButtonPush) {
				adapter.state.didKnobButtonPush = false;
				// console.log('hi 1 ============');
				// desktopService.scrollVertical(100);
			}
			
			if (spin.state.knobPushed) {
				// console.log('hi 1');
				// desktopService.scrollVertical(100);
				// desktopService.keyToggle('command', 'up');
			}
		}
		
	});
	spin.on('knob', (pushed) => {
		console.log('knob', pushed, 'button='+spin.state.buttonPushed);
		if (pushed) {
			adapter.state.shuttlePositionV = spin.state.spinPosition;
			
			
			
			if (spin.state.buttonPushed) {
				adapter.state.didKnobButtonPush = true;
				
				// adapter.state.shuttlePositionH = spin.state.spinPosition;
			}
		} else {
			console.log('stopShuttleVertical =======');
			adapter.momentumScroll.stopShuttleVertical();
			
			if (adapter.state.didKnobButtonPush) {
				adapter.state.didKnobButtonPush = false;
				// console.log('hi 2 ============');
				// desktopService.scrollVertical(100);
			}
			
			if (spin.state.buttonPushed) {
				
				// desktopService.keyToggle('command', 'up');
			}
			
			// adapter.momentumScroll.stopShuttleHorizontal();
		}
	});
	
	desktopService.on('volume', function (volumePercent, volume) {
		console.log('desktopService ON volume', volumePercent, volume);
		spin.scale(volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
	});
	
	desktopService.on('muted', function (muted) {
		console.log('muted', muted);
		if (muted) {
			// spin.flash([255,255,0]);
			spin.scale(desktopService.state.volumePercent, [100, 100, 0], [255, 255, 0], [255, 255, 255]);
		} else {
			spin.scale(desktopService.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
		}
	});
	
	// spin.on('rotate', function (diff, spinTime) {
	// 	console.log('spin rotate', diff);
	//
	// 	if (spin.state.knobPushed) {
	//
	// 	}
	// 	else if (spin.state.buttonPushed) {
	// 		if (desktopService.state.muted) {
	// 			// spin.dial(desktopService.state.volumePercent, [100, 100, 0], [255, 255, 0], [255, 255, 0]);
	// 			spin.scale(desktopService.state.volumePercent, [100, 100, 0], [100, 100, 0], [255, 255, 255]);
	// 		} else {
	// 			desktopService.changeVolume(diff, spinTime);
	// 		}
	// 	}
	// 	else {
	// 		desktopService.scroll(diff, spinTime);
	//
	// 		if (diff > 0) {
	// 			spin.rotate(1, [255, 0, 0], [255,0,0]);
	// 		}
	// 		else {
	// 			spin.rotate(-1, [0,0,255], [0,0,255]);
	// 		}
	// 	}
	// });
	//
	// spin.on('knob', function (pushed) {
	// 	console.log('knob !!', pushed);
	// 	if (pushed) {
	// 		desktopService.toggleMuted();
	// 	}
	// });
	//
	// spin.on('button', function (pushed) {
	// 	console.log('button !!', pushed);
	// });
}

startSpinService();

// desktopService.keyToggle('up', 'down');
// setTimeout(function() {
// 	desktopService.keyToggle('up', 'up');
// }, 1000);

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}