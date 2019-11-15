import React, {Component} from 'react';
import './App.css';

const Jaxcore = require('jaxcore');
const BasicAdapter = require('jaxcore/adapters/basic-adapter');

class App extends Component {
	constructor(props) {
		super(props);
		
		const jaxcore = Jaxcore.connectWebsocket('localhost', 37524);
		
		jaxcore.addAdapter('basic', BasicAdapter);
		
		jaxcore.on('device-connected', function (type, device) {
			if (type === 'websocket-spin') {
				const spin = device;
				console.log('connected', spin);
				jaxcore.createAdapter(spin, 'basic');
			}
			else {
				console.log('device-connected', type);
				process.exit();
			}
		});
	}
	
	render() {
		return (
			<div className="App">
				hi
			</div>
		);
	}
}

export default App;
