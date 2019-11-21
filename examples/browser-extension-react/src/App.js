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
            extensionReady: false,
            extensionConnected: false,
            websocketConnected: false,
            browserServiceId: null,
            portConnected: false,
            tabActive: false,
            spins: [],
            updates: []
        }
    }
    
    componentDidMount() {
        jaxcore.on('service-disconnected', (type, device) => {
            if (type === 'browserService') {
                // debugger;
                this.setState({
                    extensionReady: false,
                    extensionConnected: false,
                    browserServiceId: null
                });
                console.log('browserService disconnected', type, device.id, 'reconnecting...');
                
                connectBrowser();
            }
        });
        
        jaxcore.on('service-connected', (type, device) => {
            if (type === 'browserService') {
                
                const browserService = device;
                
                browserService.on('extension-connected', (msg) => {
                    console.log('extension-connected !!!!', msg);
                    // debugger;
                    this.setState({
                        extensionConnected: msg.extensionConnected,
                        tabActive: msg.tabActive,
                        grantedPrivileges: msg.grantedPrivileges,
                        websocketConnected: msg.websocketConnected
                    });
                });
                // browserService.on('port-connected', (msg) => {
                //     debugger;
                //     console.log('port-connected', msg);
                //     this.setState({
                //         // portConnected: msg.portConnected,
                //         extensionConnected: msg.portConnected,
                //         tabActive: msg.portActive,
                //     });
                // });
    
                browserService.on('websocket-connected', (websocketConnected) => {
                    console.log('App browserService on websocketConnected', websocketConnected);
                    // debugger;
                    this.setState({
                        websocketConnected
                    });
                });
                
                
                browserService.on('port-active', (portActive) => {
                    // debugger;
                    this.setState({
                        tabActive: portActive
                    });
                });
                
                // debugger;
                this.setState({
                    extensionReady: true,
                    extensionConnected: false,
                    tabActive: false,
                    browserServiceId: device.id
                });
                console.log('browserService connected', type, device.id);
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
        // if (this.state.extensionConnected) {
        return (<div>
                <div>Extension: {this.state.extensionConnected? this.state.browserServiceId+' Connected': 'Disconnected'}</div>
                <div>WebSocket: {this.state.websocketConnected? 'Connected':'Disconnected'}</div>
                <div>Tab: {this.state.tabActive? 'Active':'Inactive'}</div>
            </div>);
        // }
        // else if (this.state.extensionReady) {
        //     return (<div>Extension Connecting...</div>);
        // }
        // else {
        //     return (<div>Extension Disconnected</div>);
        // }
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
