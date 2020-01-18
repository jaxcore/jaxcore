const Jaxcore = require('../../lib/jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('../../plugins/keyboard'));

// jaxcore.defineService('keyboard', 'Keyboard', {});

jaxcore.defineAdapter('spin:Keyboard', {
	adapterType: 'keyboard',
	// adapterType: 'spin-keyboard',
	deviceType: 'spin',
	// serviceProfiles: {
	// 	keyboard: 'Keyboard'
	// },
	
	services: {
		keyboard: 'keyboard'
	}
	// settings: {
	// 	knobPress: {
	// 		key: 'x',
	// 		modifiers: ['shift']
	// 	},
	// }
});

jaxcore.defineAdapter('spin:Keyboard Custom', {
	adapterType: 'keyboard',
	deviceType: 'spin',
	services: {
		keyboard: 'keyboard'
	},
	settings: {
		buttonPress: {
			key: 'a',
			modifiers: []
		},
		knobPress: {
			key: 'a',
			modifiers: []
		},
	}
});

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	// keyboard plugin adds the 'keyboard' adapter
	// jaxcore.launchAdapter(spin, 'keyboard');
	
	jaxcore.connectAdapter(spin, 'spin:Keyboard', function(err, adapterInstance, adapterConfig) {
		if (err) console.log('keyboard-1 error', err);
		else {
			console.log('keyboard-1 connected', adapterConfig);
		}
	});
});

jaxcore.startDevice('spin');
