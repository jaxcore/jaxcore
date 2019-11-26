const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-chromecast-plugin'));

jaxcore.on('spin-connected', function (spin) {
	console.log('connected', spin.id);
	
	// chromecast plugin adds the 'chromecast' adapter
	jaxcore.launchAdapter(spin, 'chromecast', {
		services: {
			chromecast: {
				name: 'Family room TV'
			}
		}
	});
});

jaxcore.startDevice('spin');
