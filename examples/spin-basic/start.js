const Jaxcore = require('../../index');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));

jaxcore.addAdapter('basic', require('./spin-basic-adapter'));

jaxcore.on('spin-connected', function(spin) {
	jaxcore.launchAdapter(spin, 'basic');
});

jaxcore.startDevice('spin');
