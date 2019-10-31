import React, {Component} from 'react';
import './App.css';
import MomentumScroll from './momentumscroll/momentumscroll';
import {Spin} from 'jaxcore-client';

class App extends Component {
	
	constructor(props) {
		super(props);
		this.scrollRef = React.createRef();
		
		this.state = {
			pos: '',
			deltas: '',
			deltaXInts: '',
			deltaYInts: '',
			deltaTotal: 0,
			lastPos: 0,
			direction: 0,
		};
		
		this.shuttlePositionH = 0;
		this.shuttlePositionV = 0;
		
		this.scrollForce = 0.004;
		this.scrollFriction = 0.05;
		
		this.shuttleForce = 0.001;
		this.shuttleFriction = 0.05;
		this.shuttleIntervalTime = 30;
	}
	
	componentDidMount() {
		global.app = this;
		
		
		this.momentumScroll = new MomentumScroll({
			domNode: this.scrollRef.current,
			intervalTime: 50
		});
		
		this.momentumScroll.on('scroll', (scrollX, scrollY) => {
			let deltaXInts = this.state.deltaXInts;
			if (scrollX !== 0) {
				deltaXInts = scrollX + '\n' + this.state.deltaXInts;
				if (deltaXInts.length > 1000) deltaXInts = deltaXInts.substring(0, 1000);
			}
			
			let deltaYInts = this.state.deltaYInts;
			if (scrollY !== 0) {
				deltaYInts = scrollY + '\n' + this.state.deltaYInts;
				if (deltaYInts.length > 1000) deltaYInts = deltaYInts.substring(0, 1000);
			}
			
			this.setState({
				deltaXInts,
				deltaYInts,
			});
			
		});
		
		const spins = {};
		
		Spin.connectAll(spin => {
			spins[spin.id] = spin;
			console.log('spin connected', spin);
			global.spin = spin;
			
			spin.on('spin', (direction) => {
				console.log('spin', direction);
				
				if (spin.state.buttonPushed && spin.state.knobPushed) {
					let shuttleDiff = spin.state.spinPosition - this.shuttlePositionH;
					if (shuttleDiff === 0) {
						this.momentumScroll.stopShuttleHorizontal();
					} else {
						this.momentumScroll.startShuttleHorizontal(shuttleDiff, shuttleDiff * this.shuttleForce, this.shuttleFriction, this.shuttleIntervalTime);
					}
				} else if (spin.state.buttonPushed) {
					this.momentumScroll.scrollHorizontal(direction, direction * this.scrollForce, this.scrollFriction);
				} else if (spin.state.knobPushed) {
					let shuttleDiff = spin.state.spinPosition - this.shuttlePositionV;
					if (shuttleDiff === 0) {
						this.momentumScroll.stopShuttleVertical();
					} else {
						this.momentumScroll.startShuttleVertical(shuttleDiff, shuttleDiff * this.shuttleForce, this.shuttleFriction, this.shuttleIntervalTime);
					}
				} else {
					this.momentumScroll.scrollVertical(direction, direction * this.scrollForce, this.scrollFriction);
				}
				
			});
			spin.on('button', (pushed) => {
				console.log('button', pushed);
				
				if (pushed) {
					if (spin.state.knobPushed) {
						this.shuttlePositionH = spin.state.spinPosition;
					}
				}
				else {
					this.momentumScroll.stopShuttleHorizontal();
				}
				
			});
			spin.on('knob', (pushed) => {
				if (pushed) {
					this.shuttlePositionV = spin.state.spinPosition;
					console.log('knob', pushed, spin.state.spinPosition);
					
					if (spin.state.buttonPushed) {
						this.shuttlePositionH = spin.state.spinPosition;
					}
				} else {
					this.momentumScroll.stopShuttleVertical();
					
					this.momentumScroll.stopShuttleHorizontal();
				}
			});
			
		});
	}
	
	render() {
		return (
			<div className="App">
				<div id="scroller" ref={this.scrollRef}/>
				<div id="deltaXInts">
					<b>X:</b>
					<pre>{this.state.deltaXInts}</pre>
				</div>
				<div id="deltaYInts">
					<b>Y:</b>
					<pre>{this.state.deltaYInts}</pre>
				</div>
			</div>
		);
	}
}

export default App;
