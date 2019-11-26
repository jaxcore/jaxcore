import EventEmitter from 'events';

class Sound extends EventEmitter {
	constructor(url, options) {
		super();
		
		if (!options) options = {};
		
		if (options.context) this.context = options.context;
		
		if (options.source) {
			this.source = options.source;
		}
		
		this.connected = false;
		this.loaded = false;
		this.looping = false;
		
		if (options.autoplay) {
			this.connect();
			this.on('load', () => {
				if (options.loop) {
					this.loop();
				}
				else this.play(options.callback);
			})
		}
		
		if (typeof url==='string') {
			this.url = url;
			this.load();
		}
		else if (typeof url==='object') {
			this.loadArrayBuffer(url);
		}
		
	}
	
	connect() {
		if (!this.context) {
			this.createContext();
			// this.context = new AudioContext();
			// this.reset();
		}
		// if (!this.source) {
		// 	this.source = this.context.createBufferSource();
		// }
		
		if (!this.source.buffer) this.source.buffer = this.buffer;
		this.source.connect(this.context.destination);
		
		this.connected = true;
	}
	
	loadArrayBuffer(data) {
	
	}
	
	load() {
		var request = new XMLHttpRequest();
		request.open('GET', this.url, true);
		request.responseType = 'arraybuffer';
		request.onload = () => {
			this.response = request.response;
			
			if (this.context) {
				// debugger;
				this.loadData();
			}
			else {
				console.log('loaded no context',this.url);
			}
		};
		request.send();
	}
	
	loadData() {
		if (!this.response) {
			return;
		}
		if (this.context) {
			this.context.decodeAudioData(this.response, (response) => {
				this.buffer = response;
				if (this.source) {
					// debugger;
					this.source.buffer = this.buffer;
				}
				this.loaded = true;
				this.emit('load');
				
			}, function (e) {
				console.error('Sound: failed to load', this.url);
				// this.emit('error', e);
				
			});
		}
	}
	
	
	createContext() {
		let AudioContext = window.AudioContext || window.webkitAudioContext;
		this.context = new AudioContext();
		this.source = this.context.createBufferSource();
	}
	
	reset() {
		this.createContext();
		this.connect();
		// this.source.buffer = this.buffer;
		// this.source.connect(this.context.destination);
		
	}
	
	pause() {
		this.source.pause();
	}
	resume() {
		this.source.resume();
	}
	
	play(callback) {
		if (this.isPlaying) {
			console.log('isPlaying')
			return;
		}
		if (!this.loaded) {
			if (!this.context) {
				this.createContext();
			}
			
			this.once('load', () => {
				this.connect();
				this.source.loop = this.looping;
				this.source.onended = () => {
					this.stop();
					if (callback) callback();
				};
				this.isPlaying = true;
				if (this.source) {
					try {
						this.source.start(0);
					}
					catch(e) {
						console.log(e);
					}
				}
			});
			this.loadData();
		}
		else {
			if (!this.connected) {
				// debugger;
				this.connect();
			}
			this.source.onended = () => {
				// debugger;
				this.stop();
				if (callback) callback();
			};
			this.isPlaying = true;
			if (this.source) this.source.start(0);
		}
	}
	
	stop() {
		this.isPlaying = false;
		this.source.stop();
		this.source.disconnect();
		this.context.close();
		this.connected = false;
		this.looping = false;
		this.reset();
		
	}
	
	loop() {
		this.looping = true;
		this.play();
		// if (!this.loaded) {
		// 	this.once('load', () => {
		// 		this.connect();
		// 		this.source.loop = true;
		// 		this.source.start(0);
		// 	});
		// 	this.load();
		// }
		// else {
		// 	if (!this.connected) this.connect();
		// }
		// this.source.loop = true;
		// this.source.start(0);
	}
}

export default Sound;