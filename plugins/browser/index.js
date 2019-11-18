module.exports = {
	devices: {
		// websocketSpin: {
		// 	device: require('./websocket-spin'),
		// 	storeType: 'client'
		// }
	},
	services: {
		browserService: {
			service: require('./browser-service'),
			storeType: 'service'
		}
	}
};
