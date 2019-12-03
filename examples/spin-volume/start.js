const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));
jaxcore.addPlugin(require('../../plugins/volume'));

jaxcore.defineAdapter('volume-default', {
	adapterType: 'volume',
	deviceType: 'spin',
	services: {
		volume: 'volume'
	}
});

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);

	jaxcore.connectAdapter(spin, 'volume-default');
});

jaxcore.startDevice('spin');
