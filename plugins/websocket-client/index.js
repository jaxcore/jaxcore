module.exports = {
	devices: {
		'websocket-spin': {
			device: require('./websocket-spin'),
			storeType: 'client'
		}
	},
	services: {
		'websocket-client': {
			service: require('./websocket-client-service'),
			storeType: 'client'
		}
	}
};
