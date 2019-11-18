module.exports = {
	devices: {
		websocketSpin: {
			device: require('./websocket-spin'),
			storeType: 'client'
		}
	},
	services: {
		websocketClient: {
			service: require('./websocket-client'),
			storeType: 'client'
		}
	}
};
