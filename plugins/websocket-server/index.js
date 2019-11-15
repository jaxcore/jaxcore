module.exports = {
	services: {
		websocket: {
			service: require('./websocket-service'),
			storeType: 'client'
		}
	},
	adapters: {
		websocket: require('./websocket-adapter')
	}
};