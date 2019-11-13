module.exports = {
	services: {
		websocket: require('./websocket-service')
	},
	stores: {
		websocket: 'client'
	},
	adapters: {
		websocket: require('./websocket-adapter')
	}
}