module.exports = {
	services: {
		volume: require('./volume-service')
	},
	adapters: {
		'spin-volume': require('./volume-adapter')
	}
}