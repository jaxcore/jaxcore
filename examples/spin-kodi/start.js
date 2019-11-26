const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-kodi-plugin'));

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	// kodi plugin adds the 'kodi' adapter
	jaxcore.launchAdapter(spin, 'kodi', {
		services: {
			kodi: {
				host: '192.168.0.33',
				// host: 'localhost',
				port: 9090
			}
		}
	});
});

jaxcore.startDevice('spin');
