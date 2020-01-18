const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-kodi-plugin'));

const KODI_HOST = process.env.KODI_HOST || 'localhost';

// TODO: FINISH OFF DEFINESEVICE



jaxcore.defineService('kodi', 'My Kodi', {
	host: KODI_HOST,
	// host: 'localhost',
	port: 9090
});

jaxcore.defineAdapter('spin:My Kodi', {
	adapterType: 'kodi',
	deviceType: 'spin',
	serviceProfiles: {
		kodi: 'My Kodi'
	},
	services: {
		kodi: {
			host: KODI_HOST,
			// host: 'localhost',
			port: 9090
		}
	}
});

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'spin:My Kodi');
});

jaxcore.startDevice('spin');
