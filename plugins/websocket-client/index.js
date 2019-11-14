module.exports = {
	devices: {
		'transport-spin': {
			device: require('./transport-spin'),
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
