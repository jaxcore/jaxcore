const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));
jaxcore.addPlugin(require('../../plugins/volume'));

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);

	// volume plugin adds the 'volume' adapter
	jaxcore.launchAdapter(spin, 'volume');
});

try {
	jaxcore.startDevice('spin');
}
catch(e) {
		console.log('err', e);
		process.exit();
}

