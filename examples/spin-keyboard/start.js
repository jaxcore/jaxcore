const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	// keyboard plugin adds the 'keyboard' adapter
	jaxcore.launchAdapter(spin, 'keyboard');
});

jaxcore.startDevice('spin');
