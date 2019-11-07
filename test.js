const Jaxcore = require('./jaxcore');
const jaxcore = new Jaxcore();
const cyber = require('./themes/cyber');
jaxcore.addTheme('cyber', cyber);
jaxcore.setDefaultTheme('cyber');

// DEVICES

const Spin = require('jaxcore-spin');
jaxcore.addDevice('spin', Spin);

// SERVICES

const KeyboardService = require('./services/keyboard-service');
jaxcore.addService('keyboard', KeyboardService);
const VolumeService = require('./services/volume-service');
jaxcore.addService('volume', VolumeService);
const MouseService = require('./services/mouse-service');
jaxcore.addService('mouse', MouseService);
const ScrollService = require('./services/scroll-service');
jaxcore.addService('scroll', ScrollService);

// ADAPTERS

const volumeAdapter = require('./adapters/volume');
jaxcore.addAdapter('volume', volumeAdapter);
const mouseAdapter = require('./adapters/mouse');
jaxcore.addAdapter('mouse', mouseAdapter);
const horizontalMouseAdapter = require('./adapters/mouse-horizontal');
jaxcore.addAdapter('hmouse', horizontalMouseAdapter);
const verticalMouseAdapter = require('./adapters/mouse-vertical');
jaxcore.addAdapter('vmouse', verticalMouseAdapter);
const keyboardAdapter = require('./adapters/keyboard');
jaxcore.addAdapter('keyboard', keyboardAdapter);
const scrollAdapter = require('./adapters/scroll');
jaxcore.addAdapter('scroll', scrollAdapter);

// COMBO ADAPTERS

const mouseScrollAdapter = require('./adapters/mouse-scroll');
jaxcore.addAdapter('mouseScroll', mouseScrollAdapter);
const mediaAdapter = require('./adapters/media-volume');
jaxcore.addAdapter('media', mediaAdapter);

// PLUGINS

const chromecastPlugin = require('jaxcore-chromecast-plugin');
jaxcore.addPlugin(chromecastPlugin);

const kodiPlugin = require('jaxcore-kodi-plugin');
jaxcore.addPlugin(kodiPlugin);

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
			
			if (defaultAdapter === 'scroll') jaxcore.createAdapter(spin, 'scroll');
			if (defaultAdapter === 'keyboard') jaxcore.createAdapter(spin, 'keyboard');
			if (defaultAdapter === 'volume') jaxcore.createAdapter(spin, 'volume');
			if (defaultAdapter === 'media') jaxcore.createAdapter(spin, 'media');
			if (defaultAdapter === 'mouse') jaxcore.createAdapter(spin, 'mouse');
			if (defaultAdapter === 'mouseScroll') jaxcore.createAdapter(spin, 'mouseScroll');
			if (defaultAdapter === 'kodi') {
				jaxcore.createAdapter(spin, 'kodi', {
					services: {
						kodi: {
							// host: '192.168.0.33',
							host: 'localhost',
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
			if (defaultAdapter === 'chromecast') jaxcore.createAdapter(spin, 'chromecast');
		}
	}
});

jaxcore.startDevice('spin');
