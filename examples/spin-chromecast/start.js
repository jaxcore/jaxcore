const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-chromecast-plugin'));

jaxcore.defineAdapter('chromecast-family-room', {
	adapterType: 'chromecast',
	deviceType: 'spin',
	services: {
		chromecast: {
			name: 'Family room TV'
		}
	}
});

jaxcore.on('spin-connected', function (spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'chromecast-family-room');
});

jaxcore.startDevice('spin');
