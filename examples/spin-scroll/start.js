const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));
jaxcore.addPlugin(require('../../plugins/scroll'));

jaxcore.defineAdapter('scroll-default', {
	adapterType: 'scroll',
	deviceType: 'spin',
	services: {
		scroll: 'scroll'
	}
});

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'scroll');
});

jaxcore.startDevice('spin');
