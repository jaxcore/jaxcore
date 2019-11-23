const Jaxcore = require('../../index');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/mouse'));
jaxcore.addPlugin(require('../../plugins/scroll'));

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	// mouse plugin adds the 'mouse' adapter
	jaxcore.launchAdapter(spin, 'mouse');
});

jaxcore.startDevice('spin');
