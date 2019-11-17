let spinIds = [
	'4a2cee65c67f4fdd9784da6af2bf57cf',
	'025e6331f4b34bd2bf50d0e9f11f808e'
];
jaxcore.beginSpinService(spinIds);
setTimeout(function() {
	var first = true;
	for (let id in Spin.spinIds) {
		let spin = Spin.spinIds[id];
		if (first) {
			first = false;
			createVerticalMouse(spin);
		}
		else {
			createHorizontalMouse(spin);
		}
	}
},6000);