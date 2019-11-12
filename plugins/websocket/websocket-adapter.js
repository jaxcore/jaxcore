const Adapter = require('jaxcore-plugin').Adapter;

class WebsocketAdapter extends Adapter {
	static getDefaultState() {
		return {
		};
	}
	
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		const {websocket} = services;
		spin.rotateRainbow(2);
		spin.lightsOff();
		
		// spin.state.on('update', function(changes) {
		// 	console.log('update', spin.id, changes);
		// });
		
		this.addEvents(spin, {
			spin: function (diff, spinTime) {
				this.log('spin rotate', diff, spinTime);
			},
			knob: function (pushed) {
				this.log('knob', pushed);
			},
			button: function (pushed) {
				this.log('button', pushed);
			},
			knobHold: function () {
				this.log('knob HOLD');
			},
			buttonHold: function () {
				this.log('button HOLD');
			}
		});
	}
	
	
	static getServicesConfig(adapterConfig) {
		return {
			websocket: true
		};
	}
}

module.exports = WebsocketAdapter;
