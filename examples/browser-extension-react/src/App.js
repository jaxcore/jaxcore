import React from 'react';
const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();
jaxcore.connectBrowserExtension();

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

function App() {
  return (
    <div className="App">
      hi
    </div>
  );
}

export default App;
