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
		// spin.rotateRainbow(2);
		spin.quickFlash([255,255,255], 3);
		// spin.lightsOff();
		
		websocket.connectSpin(spin);
		
		// spin.state.on('update', function(changes) {
		// 	console.log('update', spin.id, changes);
		// });
		
		this.addEvents(spin, {
			update: function(changes) {
				this.log('spin change', changes);
				if (changes) websocket.spinUpdate(spin, changes);
				else console.log('no changes??');
			},
			spin: function (diff, spinTime) {
				// this.log('spin rotate', diff, spinTime);
				// this.log('spin rotate', spin.setState);
			},
			knob: function (pushed) {
				// this.log('knob', pushed);
			},
			button: function (pushed) {
				// this.log('button', pushed);
			},
			knobHold: function () {
				// this.log('knob HOLD');
			},
			buttonHold: function () {
				// this.log('button HOLD');
			}
		});
	}
	
	
	static getServicesConfig(adapterConfig) {
		return {
			websocket: adapterConfig.settings.services.websocket
		};
	}
}

module.exports = WebsocketAdapter;
