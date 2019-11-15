module.exports = {
	services: {
		websocketServer: {
			service: require('./websocket-service'),
			storeType: 'client'
		}
	},
	adapters: {
		websocketServer: require('./websocket-adapter')
	}
};