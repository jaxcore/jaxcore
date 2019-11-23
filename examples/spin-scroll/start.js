const Jaxcore = require('../../index');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));
jaxcore.addPlugin(require('../../plugins/scroll'));

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	// scroll plugin adds the 'scroll' adapter
	jaxcore.launchAdapter(spin, 'scroll');
});

jaxcore.startDevice('spin');