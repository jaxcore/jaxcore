import React, {Component} from 'react';

const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();

function connectBrowser() {
    jaxcore.connectBrowserExtension(function (err, browserAdapter) {
        console.log('websocketClient connected', browserAdapter);
    });
}

const BasicAdapter = require('jaxcore/adapters/basic-adapter');

jaxcore.addAdapter('basic', BasicAdapter);

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            browserConnected: false,
            browserServiceId: null,
            spins: [],
            updates: []
        }
    }
    
    componentDidMount() {
        jaxcore.on('service-disconnected', (type, device) => {
            if (type === 'browserService') {
                this.setState({
                    browserConnected: false,
                    browserServiceId: null
                });
                console.log('browserService disconnected', type, device.id, 'reconnecting...');
                debugger;
                connectBrowser();
            }
        });
        
        jaxcore.on('service-connected', (type, device) => {
            debugger;
            if (type === 'browserService') {
                this.setState({
                    browserConnected: true,
                    browserServiceId: device.is
                });
                console.log('browserService connected', type, device.id);
                debugger;
            }
        });
        
        jaxcore.on('spin-connected', (spin) => {
            console.log('connected', spin);
            
            const {spins} = this.state;
            spins.push(spin.id);
            this.setState({
                spins
            });
            
            spin.on('spin', (diff, time) => {
                const {updates} = this.state;
                updates.unshift('spin ' + diff);
                if (updates.length > 50) updates.length = 50;
                this.setState({updates});
            });
            spin.on('knob', (pushed) => {
                const {updates} = this.state;
                updates.unshift('knob ' + pushed);
                if (updates.length > 50) updates.length = 50;
                this.setState({updates});
            });
            spin.on('button', (pushed) => {
                const {updates} = this.state;
                updates.unshift('button ' + pushed);
                if (updates.length > 50) updates.length = 50;
                this.setState({updates});
            });
            
            spin.on('disconnect', () => {
                spin.removeAllListeners();
                
                const {spins} = this.state;
                let i = spins.indexOf(spin.id);
                spins.splice(i, 1);
                this.setState({
                    spins
                });
            });
            
            jaxcore.createAdapter(spin, 'basic');
        });
    
        connectBrowser();
    }
    
    render() {
        return (
            <div>
                <h4>Browser Extension:</h4>
                {this.renderBrowserExtension()}
                <h4>Spins Connected:</h4>
                {this.renderSpins()}
                <h4>Spin Updates:</h4>
                {this.renderUpdates()}
            </div>
        );
    }
    
    renderBrowserExtension() {
        if (this.state.browserConnected) {
            return (<div>Connected {this.state.browserServiceId}</div>);
        }
        else {
            return (<div>Connecting...</div>);
        }
    }
    
    renderSpins() {
        return this.state.spins.map((id, i) => {
            return (<div key={i}>{id}</div>);
        });
    }
    
    renderUpdates() {
        return this.state.updates.map((id, i) => {
            return (<div key={i}>{id}</div>);
        });
    }
    
}

export default App;
