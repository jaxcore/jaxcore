const Jaxcore = require('../../index');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-sonos-plugin'));

jaxcore.on('spin-connected', function (spin) {
	console.log('connected', spin.id);
	
	// sonos plugin adds the 'sonos' adapter
	jaxcore.launchAdapter(spin, 'sonos', {
		services: {
			sonos: {
				host: '192.168.1.231',
				port: 1400,
				minVolume: 0,
				maxVolume: 100
			}
		}
	});
});

jaxcore.startDevice('spin');
