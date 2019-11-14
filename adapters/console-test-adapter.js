const Adapter = require('jaxcore-plugin').Adapter;

class ConsoleTestAdapter extends Adapter {
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		spin.rotateRainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				this.log('spin', diff, spinTime);
			},
			knob: function (pushed) {
				this.log('knob', pushed);
			},
			button: function (pushed) {
				this.log('button', pushed);
			}
		});
	}
}

module.exports = ConsoleTestAdapter;