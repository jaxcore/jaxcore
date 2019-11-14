const Adapter = require('jaxcore-plugin').Adapter;

class ConsoleTestAdapter extends Adapter {
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		
		// console.log('tspin', spin);
		// process.exit();
		// tspin.rotateRainbow(2);
		// tspin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				this.log('TRANSPORT spin', diff, spinTime);
			},
			knob: function (pushed) {
				this.log('TRANSPORT nob', pushed);
			},
			button: function (pushed) {
				this.log('TRANSPORT button', pushed);
			}
		});
	}
}

module.exports = ConsoleTestAdapter;