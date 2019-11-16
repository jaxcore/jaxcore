const Jaxcore = require('../../jaxcore');
const jaxcore = new Jaxcore();

// SERVICES
jaxcore.addService('volume', require('../../services/volume-service'), 'service');
// TODO: jaxcore.addPlugin(require('jaxcore-volume-macosx-plugin'));

// PLUGINS
jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));
jaxcore.addPlugin(require('../../plugins/mouse'));
jaxcore.addPlugin(require('../../plugins/scroll'));
jaxcore.addPlugin(require('../../plugins/websocket-server'));
jaxcore.addPlugin(require('../../plugins/websocket-client'));
jaxcore.addPlugin(require('jaxcore-chromecast-plugin'));
jaxcore.addPlugin(require('jaxcore-kodi-plugin'));
jaxcore.addPlugin(require('jaxcore-sonos-plugin'));

// ADAPTERS
jaxcore.addAdapter('media', require('../../adapters/media-adapter'));
jaxcore.addAdapter('basic', require('../../adapters/basic-adapter'));

// if (process.env.NODE_ENV === 'prod') {
// 	console.log = function () {
// 	};
// 	process.on('uncaughtException', function (err) {
// 	});
// }

// let spinIds = [
// 	'4a2cee65c67f4fdd9784da6af2bf57cf',
// 	'025e6331f4b34bd2bf50d0e9f11f808e'
// ];
// jaxcore.beginSpinService(spinIds);
// setTimeout(function() {
// 	var first = true;
// 	for (let id in Spin.spinIds) {
// 		let spin = Spin.spinIds[id];
// 		if (first) {
// 			first = false;
// 			createVerticalMouse(spin);
// 		}
// 		else {
// 			createHorizontalMouse(spin);
// 		}
// 	}
// },6000);

let defaultAdapter = process.argv[2];

jaxcore.on('spin-connected', function(spin) {
// jaxcore.on('device-connected', function(type, device) {
// 	if (type === 'spin') {
// 		const spin = device;
		console.log('connected', spin.id);
		
		// const adapterConfig = jaxcore.findSpinAdapter(spin);
		// if (adapterConfig) {
		// 	console.log('found adapter', adapterConfig);
		// 	jaxcore.relaunchAdapter(adapterConfig, spin);
		// 	// jaxcore.emit('device-connected', 'spin', spin, adapterConfig);
		// }
		// else {
		// 	console.log('DID NOT FIND ADAPTER FOR:', spin.id);
			// jaxcore.emit('device-connected', 'spin', spin, null);
			
			if (defaultAdapter === 'keyboard') jaxcore.launchAdapter(spin, 'keyboard');
			if (defaultAdapter === 'media') jaxcore.launchAdapter(spin, 'media');
			if (defaultAdapter === 'mouse') jaxcore.launchAdapter(spin, 'mouse');
			if (defaultAdapter === 'scroll') jaxcore.launchAdapter(spin, 'scroll');
			
			if (defaultAdapter === 'kodi') {
				jaxcore.launchAdapter(spin, 'kodi', {
					services: {
						kodi: {
							host: '192.168.0.33',
							// host: 'localhost',
							port: 9090
						}
					}
				});
			}
			
			if (defaultAdapter === 'chromecast') {
				jaxcore.launchAdapter(spin, 'chromecast', {
					services: {
						chromecast: {
							name: 'Family room TV'
						}
					}
				});
			}
			
			if (defaultAdapter === 'sonos') {
				// const Sonos = jaxcore.serviceClasses.sonos;
				// const sonos = Sonos.startService();
				// sonos.on('device', function(device) {
				// 	console.log('found sonos', device);
				// });
				// sonos.scan();
				
				jaxcore.launchAdapter(spin, 'sonos', {
					services: {
						sonos: {
							host: '192.168.1.231',
							port: 1400,
							minVolume: 0,
							maxVolume: 80
						}
						
						// sonos: {
						// 	host: '192.168.0.19',
						// 	port: 1400,
						// 	minVolume: 0,
						// 	maxVolume: 100
						// }
					}
				});
				
			}
			
			if (defaultAdapter === 'websocket') {
				// jaxcore.createAdapter(spin, 'websocket', {
				// 	services: {
				// 		websocket: {
				// 			port: 37524
				// 		}
				// 	}
				// }, function(err, config, adapter) {
				// 	if (err) {
				// 		console.log('websocket error', err);
				// 		process.exit();
				// 	}
				// 	else {
				// 		console.log('launched websocket adapter', config, adapter);
				// 		// process.exit();
				// 	}
				// });
				
				jaxcore.launchAdapter(spin, 'websocket', {
					services: {
						websocket: {
							port: 37524
						}
					}
				});
			}
			
			if (defaultAdapter === 'console-test') {
				jaxcore.launchAdapter(spin, 'console-test');
			}
		// }
	// }
});

jaxcore.startDevice('spin');
