const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-kodi-plugin'));

jaxcore.defineAdapter('kodi-192.168.0.33', {
	adapterType: 'kodi',
	deviceType: 'spin',
	services: {
		kodi: {
			host: '192.168.0.33',
			// host: 'localhost',
			port: 9090
		}
	}
});

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'kodi-192.168.0.33');
});

jaxcore.startDevice('spin');
