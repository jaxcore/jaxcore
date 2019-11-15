module.exports = {
	devices: {
		websocketSpin: {
			device: require('./websocket-spin'),
			storeType: 'client'
		}
	},
	services: {
		websocketClient: {
			service: require('./websocket-client-service'),
			storeType: 'client'
		}
	}
};
