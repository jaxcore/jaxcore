const Adapter = require('../../lib/adapter');

class BasicSpinAdapter extends Adapter {
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		spin.rainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				this.log('spin', diff, spinTime);
				spin.rotate(diff, theme.low, theme.high);
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) {
					spin.flash(theme.primary);
				}
			},
			button: function (pushed) {
				this.log('button', pushed);
				if (pushed) {
					spin.flash(theme.secondary);
				}
			}
		});
	}
}

module.exports = BasicSpinAdapter;