const Jaxcore = require('./jaxcore'); // require('jaxcore');
const cyber = require('./themes/cyber'); // require('jaxcore/themes/cyber');
const {createClientStore,createServiceStore} = require('jaxcore-plugin'); // require('jaxcore-plugin');
const jaxcore = new Jaxcore();
jaxcore.addTheme('cyber', cyber);
jaxcore.setDefaultTheme('cyber');

// DEVICES

const Spin = require('jaxcore-spin');
const spinStore = createServiceStore('JAXCORE Spin Store');
jaxcore.addDevice('spin', Spin, spinStore);

// SERVICES

const KeyboardService = require('./services/keyboard-service');
jaxcore.addService('keyboard', KeyboardService);
const keyboardStore = createServiceStore('JAXCORE Keyboard Store');
jaxcore.setServiceStore('keyboard', keyboardStore);

const VolumeService = require('./services/volume-service');
jaxcore.addService('volume', VolumeService);
const volumeStore = createServiceStore('JAXCORE Volume Store');
jaxcore.setServiceStore('volume', volumeStore);

const MouseService = require('./services/mouse-service');
jaxcore.addService('mouse', MouseService);
const mouseStore = createServiceStore('JAXCORE Mouse Store');
jaxcore.setServiceStore('mouse', mouseStore);

const ScrollService = require('./services/scroll-service');
jaxcore.addService('scroll', ScrollService);
const scrollStore = createServiceStore('JAXCORE Scroll Store');
jaxcore.setServiceStore('scroll', scrollStore);

// ADAPTERS

const keyboardAdapter = require('./adapters/keyboard');
jaxcore.addAdapter('keyboard', keyboardAdapter);
const scrollAdapter = require('./adapters/scroll');
jaxcore.addAdapter('scroll', scrollAdapter);
const mouseAdapter = require('./adapters/mouse');
jaxcore.addAdapter('mouse', mouseAdapter);
const mediaAdapter = require('./adapters/media');
jaxcore.addAdapter('media', mediaAdapter);

// PLUGINS

const chromecastPlugin = require('jaxcore-chromecast-plugin');
jaxcore.addPlugin(chromecastPlugin);
const castStore = createClientStore('JAXCORE Chromecast Store');
jaxcore.setServiceStore('chromecast', castStore);

const kodiPlugin = require('jaxcore-kodi-plugin');
jaxcore.addPlugin(kodiPlugin);
const kodiStore = createClientStore('JAXCORE Kodi Store');
jaxcore.setServiceStore('kodi', kodiStore);

const sonosPlugin = require('jaxcore-sonos-plugin');
jaxcore.addPlugin(sonosPlugin);
const sonosStore = createClientStore('JAXCORE Sonos Store');
jaxcore.setServiceStore('sonos', sonosStore);

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}


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

jaxcore.on('device-connected', function(type, device) {
	if (type === 'spin') {
		const spin = device;
		console.log('connected', spin.id);
		const adapterConfig = jaxcore.findSpinAdapter(spin);
		if (adapterConfig) {
			console.log('found adapter', adapterConfig);
			jaxcore.relaunchAdapter(adapterConfig, spin);
			// jaxcore.emit('device-connected', 'spin', spin, adapterConfig);
		}
		else {
			console.log('DID NOT FIND ADAPTER FOR:', spin.id);
			// jaxcore.emit('device-connected', 'spin', spin, null);
			
			if (defaultAdapter === 'keyboard') jaxcore.createAdapter(spin, 'keyboard');
			if (defaultAdapter === 'media') jaxcore.createAdapter(spin, 'media');
			if (defaultAdapter === 'mouse') jaxcore.createAdapter(spin, 'mouse');
			if (defaultAdapter === 'scroll') jaxcore.createAdapter(spin, 'scroll');
			
			if (defaultAdapter === 'kodi') {
				jaxcore.createAdapter(spin, 'kodi', {
					services: {
						kodi: {
							host: '192.168.0.33',
							// host: 'localhost',
							port: 9090
						}
					}
				}, function(err, config, adapter) {
					if (err) {
						console.log('kodi error', err);
						// process.exit();
					}
					else {
						console.log('launched adapter', config, adapter);
					}
				});
			}
			
			if (defaultAdapter === 'chromecast') {
				jaxcore.createAdapter(spin, 'chromecast', {
					services: {
						chromecast: {
							name: 'Family room TV'
						}
					}
				}, function(err, config, adapter) {
					if (err) {
						console.log('chromecast error', err);
						// process.exit();
					}
					else {
						console.log('launched chromecast', config, adapter);
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
				
				jaxcore.createAdapter(spin, 'sonos', {
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
				}, function(err, config, adapter) {
					if (err) {
						console.log('sonos error', err);
						// process.exit();
					}
					else {
						console.log('launched sonos', config, adapter);
					}
				});
				
			}
		}
	}
});

jaxcore.startDevice('spin');
