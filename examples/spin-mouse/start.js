const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/mouse'));
jaxcore.addPlugin(require('../../plugins/scroll'));

jaxcore.defineAdapter('mouse-default', {
	adapterType: 'mouse',
	deviceType: 'spin',
	services: {
		mouse: 'mouse'
	}
});

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'mouse-default');
});

jaxcore.startDevice('spin');
