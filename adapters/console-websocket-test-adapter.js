const Adapter = require('jaxcore-plugin').Adapter;

class ConsoleTestAdapter extends Adapter {
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		
		console.log('tspin adapter');
		spin.flash([0,255,0]);
		
		
		// process.exit();
		// tspin.rotateRainbow(2);
		// tspin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				this.log('TRANSPORT spin', diff, spinTime);
				spin.rotate(diff, [0,0,255], [255,0,0]);
			},
			knob: function (pushed) {
				this.log('TRANSPORT nob', pushed);
				spin.flash([255,0,0]);
			},
			button: function (pushed) {
				this.log('TRANSPORT button', pushed);
				spin.flash([0,0,255]);
			}
		});
	}
}

module.exports = ConsoleTestAdapter;