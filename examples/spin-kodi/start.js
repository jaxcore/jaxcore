const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-kodi-plugin'));

const KODI_HOST = process.env.KODI_HOST || 'localhost';

jaxcore.defineAdapter('my kodi', {
	adapterType: 'kodi',
	deviceType: 'spin',
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
	
	jaxcore.connectAdapter(spin, 'my kodi');
});

jaxcore.startDevice('spin');
