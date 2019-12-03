const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-sonos-plugin'));

jaxcore.defineAdapter('sonos-192.168.1.231', {
	adapterType: 'sonos',
	deviceType: 'spin',
	services: {
		sonos: {
			host: '192.168.1.231',
			port: 1400,
			minVolume: 0,
			maxVolume: 100
		}
	}
});

jaxcore.on('spin-connected', function (spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'sonos-192.168.1.231');
});

jaxcore.startDevice('spin');
