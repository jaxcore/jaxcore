module.exports = {
	services: {
		keyboard: require('./keyboard-service')
	},
	adapters: {
		'spin-keyboard': require('./keyboard-adapter')
	}
}