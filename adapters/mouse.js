
function mouseAdapter(spin, desktop) {
	
	const theme = {
		right: [0,0,255], // right
		left: [255,0,0], // left
		middle: [255,255,255], // middle
		primary: [255,0,255], // primary
		secondary: [0,255,255], // secondary
		tertiary: [255,255,0], // tertiary
		black: [0,0,0],
		white: [255,255,255]
	};
	
	spin.rotateRainbow(1);
	spin.lightsOff();
	
	const adapter = {
		state: {
			settings: {
				isKnobHeld: false
			}
		}
	};
	
	spin.on('rotate', function (diff, spinTime) {
		var mouse = desktop.getMousePos();
		let size = desktop.getScreenSize();
		console.log('spin rotate', diff, mouse, size);
		
		let distance;
		let dir = diff > 0? 1:-1;
		if (spinTime < 65) distance = dir * Math.round(Math.pow(Math.abs(diff),1.8));
		else if (spinTime < 150) distance = dir * Math.round(Math.pow(Math.abs(diff),1.4));
		else distance = diff;
		
		// if (mouse.y === 0) {
		// 	console.log('mouse y ZERO');
		// 	return;
		// }
		// if (mouse.x === 0) {
		// 	console.log('mouse X ZERO');
		// 	return;
		// }
		
		if (spin.state.buttonPushed) {
			let x = mouse.x + distance;
			if (x < 1) x = 1;
			if (x > size.width) x = size.width;
			if (adapter.state.isKnobHeld) {
				console.log('drag mouse X', x);
				desktop.moveMouse(x, mouse.y);
				spin.rotate(dir, theme.secondary, theme.secondary);
			}
			else {
				console.log('move mouse X', x);
				desktop.moveMouse(x, mouse.y);
				spin.rotate(dir, theme.left, theme.black);
			}
		}
		else {
			let y = mouse.y + distance;
			if (y < 1) y = 1;
			if (y > size.height) y = size.height;
			if (adapter.state.isKnobHeld) {
				console.log('drag mouse Y', y);
				desktop.dragMouse(mouse.x, y);
				spin.rotate(dir, theme.primary, theme.primary);
			}
			else {
				console.log('move mouse Y', y);
				desktop.moveMouse(mouse.x, y);
				spin.rotate(dir, theme.right, theme.black);
			}
		}
	});
	
	spin.on('knob', function (pushed) {
		console.log('knob', pushed);
		if (pushed) {
			if (adapter.state.isKnobHeld) {
				desktop.mouseToggle('up','left');
				spin.flash(theme.right, 1);
				adapter.state.isKnobHeld = false;
			}
		}
		else {
			if (adapter.state.isKnobHeld) {
				// spin.quickFlash(theme.primary, 1);
				spin.flash(theme.primary, 1);
			}
			else {
				desktop.mouseClick('left');
				spin.flash(theme.white);
			}
		}
	});
	
	spin.on('button', function (pushed) {
		console.log('button', pushed);
	});
	
	spin.on('knob-hold', function () {
		console.log('knob hold');
		adapter.state.isKnobHeld = true;
		desktop.mouseToggle('down','left');
		spin.flash(theme.right, 3);
	});
}

module.exports = mouseAdapter;
