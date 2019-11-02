const Jaxcore = require('./jaxcore');
const jaxcore = new Jaxcore();

const Spin = require('jaxcore-spin');
jaxcore.addDevice('spin', Spin);

// const DesktopService = require('./desktop-service-macosx');
// jaxcore.addService('desktop', DesktopService);

const KeyboardService = require('./keyboard-service');
jaxcore.addService('keyboard', KeyboardService);
const VolumeService = require('./volume-service');
jaxcore.addService('volume', VolumeService);
const MouseService = require('./mouse-service');
jaxcore.addService('mouse', MouseService);
const ScrollService = require('./scroll-service');
jaxcore.addService('scroll', ScrollService);

const volumeAdapter = require('./adapters/volume');
jaxcore.addAdapter('volume', volumeAdapter);

const mouseAdapter = require('./adapters/mouse');
jaxcore.addAdapter('mouse', mouseAdapter);

const keyboardAdapter = require('./adapters/keyboard');
jaxcore.addAdapter('keyboard', keyboardAdapter);

const scrollAdapter = require('./adapters/scroll');
jaxcore.addAdapter('scroll', scrollAdapter);

// const mediaAdapter = require('./adapters/media-volume');
// jaxcore.addAdapter('media', mediaAdapter);

// const momentumScrollAdapter = require('./adapters/momentum-scroll');
// jaxcore.addAdapter('momentum', momentumScrollAdapter);
//
// const precisionScrollAdapter = require('./adapters/precision-scroll');
// jaxcore.addAdapter('precision', precisionScrollAdapter);

// const testAdapter = require('./adapters/test');
// const Adapter = require('./adapter');

if (process.env.NODE_ENV === 'prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}

let spinIds = [
	'4a2cee65c67f4fdd9784da6af2bf57cf',
	'025e6331f4b34bd2bf50d0e9f11f808e'
];
jaxcore.beginSpinService(spinIds);


function createScroll(spin) {
	jaxcore.createAdapter(spin, 'scroll', {}, function(adapterConfig) {
		console.log('created scroll adapter', adapterConfig);
	});
}
function createVolume(spin) {
	jaxcore.createAdapter(spin, 'volume', {}, function(adapterConfig) {
		console.log('created volume adapter', adapterConfig);
	});
}
function createMouse(spin) {
	jaxcore.createAdapter(spin, 'mouse', {}, function(adapterConfig) {
		console.log('created mouse adapter', adapterConfig);
		// setTimeout(function() {
		// 	// console.log('destroying adapter');
		// 	// destroyAdapter(adapterConfig);
		// 	// console.log('creating media in 5');
		// 	// setTimeout(function() {
		// 	// 	createMedia(spin)
		// 	// },5000);
		//
		// 	console.log('stop service');
		// 	destroyService('desktop', 'desktop');
		//
		// },10000);
	});
}
function createKeyboard(spin) {
	jaxcore.createAdapter(spin, 'keyboard', {}, function(adapterConfig) {
		console.log('created keyboard adapter', adapterConfig);
		// setTimeout(function() {
		// 	console.log('destroying');
		// 	jaxcore.destroyAdapter(adapterConfig);
		// 	setTimeout(function() {
		// 		createMomentum(spin)
		// 	},5000);
		// },5000);
	});
}

// COMBO ADAPTERS

function createMedia(spin) {
	jaxcore.createAdapter(spin, 'media', {}, function(adapterConfig) {
		console.log('created media adapter', adapterConfig);
		setTimeout(function() {
			console.log('destroying');
			// jaxcore.destroyAdapter(adapterConfig);
			// setTimeout(function() {
			// 	createKeyboard(spin);
			// },5000);
		},5000);
	});
}
function createMomentum(spin) {
	jaxcore.createAdapter(spin, 'momentum', {}, function(adapterConfig) {
		console.log('created momentum adapter', adapterConfig);
		setTimeout(function() {
			console.log('destroying');
			jaxcore.destroyAdapter(adapterConfig);
			setTimeout(function() {
				createPrecision(spin);
			},5000);
		},5000);
	});
}

// function createPrecision(spin) {
// 	jaxcore.createAdapter(spin, 'precision', {}, function(adapterConfig) {
// 		console.log('created precision adapter', adapterConfig);
// 		// setTimeout(function() {
// 		// 	console.log('destroying');
// 		// 	jaxcore.destroyAdapter(adapterConfig);
// 		// 	setTimeout(function() {
// 		//
// 		// 	},5000);
// 		// },5000);
// 	});
// }

setTimeout(function() {
	for (let id in Spin.spinIds) {
		let spin = Spin.spinIds[id];
		// console.log(spin);
		// createMedia(spin);
		// createVolume(spin);
		// createKeyboard(spin);
		// createMouse(spin);
		createScroll(spin);
	}
},15000);

// createMouse(spin);
