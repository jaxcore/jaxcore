const Jaxcore = require('../../index');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/mouse'));

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	// mouse plugin adds the 'mouse' adapter
	jaxcore.launchAdapter(spin, 'mouse');
});

jaxcore.startDevice('spin');
