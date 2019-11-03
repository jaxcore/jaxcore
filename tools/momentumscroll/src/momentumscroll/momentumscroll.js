
import {Engine, Render, Runner, World, Bodies, Body} from 'matter-js';
// let matterjs = require('matter-js');
// const {Engine, Render, World, Bodies, Body} = matterjs;
// import {Engine, Render, World, Bodies, Body} from 'matter-js';

import EventEmitter from 'events';
// const EventEmitter = require('events');

// global.Body = Body;

class MomentumScroll extends EventEmitter {
	
	constructor(config) {
		super();
		
		global.momentum = this;
		
		this.intervalTime = config.intervalTime || 50;
		
		this.scrollerSize = 50;
		
		this.w = 700;
		this.h = 700;
		
		this.midpoint = this.w/2 - this.scrollerSize/2;
		
		this.engine = Engine.create();
		this.engine.world.gravity.y = 0;
		
		if (config.domNode) {
			this.render = Render.create({
				element: config.domNode,
				engine: this.engine,
				options: {
					width: this.w,
					height: this.h,
					wireframes: false,
					background: "#000"
				}
			});
		}
		
		if (config.domNode) {
			var canvas = config.domNode.childNodes[0];
			this.canvas = canvas;
		}
		
		// Engine.run(this.engine);
		//Matter.Render.stop(this.debugRender);
		
		this.runner = Runner.create();
		
		if (this.render) Render.run(this.render);
		
		var size = this.scrollerSize;
		
		this.scroller = Bodies.rectangle(size / 2, size / 2, size, size, {
			frictionAir: config.friction || 0,
			friction: 0,
			restitution: 0,
			background: "#F00"
		});
		
		Body.setPosition(this.scroller, {x: this.midpoint, y: this.midpoint});
		World.add(this.engine.world, [this.scroller]);
		
		this.isScrolling = false;
		
		this.deltaTotalX = 0;
		this.deltaTotalY = 0;
		this.lastPosX = 0;
		this.lastPosY = 0;
		this.directionX = 0;
		this.directionY = 0;
		
		this._tick = this.tick.bind(this);
		
		this.interval = 1; //1000/100;
	}
	
	start() {
		if (!this.active) {
			console.log('ENGINE START');
			this.active = true;
			this._tick();
		}
	}
	stop() {
		this.active = false;
		console.log('ENGINE stopping...');
	}
	tick() {
		if (!this.active) {
			console.log('ENGINE STOPPED');
			return;
		}
		Runner.tick(this.runner, this.engine, this.interval);
		if (typeof window==='object' && window.requestAnimationFrame) {
			requestAnimationFrame(this._tick);
		}
		else {
			// console.log('ENGINE tick this.active='+this.active);
			setTimeout(this._tick, this.interval);
		}
	}
	
	stopVertical() {
		Body.setVelocity(this.scroller, {x: this.scroller.velocity.x, y: 0});
		Body.setPosition(this.scroller, {x: this.scroller.position.x, y: this.midpoint});
		this.lastPosY = 0;
		this.deltaTotalY = 0;
	}
	
	scrollVertical(diff, force, friction) {
		this.scroller.frictionAir = friction;
		
		let newPosDirection = diff > 0? 1 : -1;
		if (this.directionY !== newPosDirection) {
			this.directionY = newPosDirection;
			this.stopVertical();
			this.lastPosY = 0;
			this.deltaTotalY = 0;
		}
		
		this.start();
		this.applyForce(0, force);
	}
	
	stopHorizontal() {
		Body.setVelocity(this.scroller, {x: 0, y:this.scroller.velocity.y});
		Body.setPosition(this.scroller, {x: this.midpoint, y: this.scroller.position.y});
		this.lastPosX = 0;
		this.deltaTotalX = 0;
	}
	
	scrollHorizontal(diff, force, friction) {
		this.scroller.frictionAir = friction;
		
		let newPosDirection = diff > 0? 1 : -1;
		if (this.directionX !== newPosDirection) {
			this.directionX = newPosDirection;
			this.stopHorizontal();
			this.lastPosX = 0;
			this.deltaTotalX = 0;
		}
		
		this.start();
		this.applyForce(force, 0);
	}
	
	startShuttleVertical(shuttleDiff, force, friction, interval) {
		clearInterval(this.shuttleIntervalV);
		this.scrollVertical(shuttleDiff, force, friction);
		this.shuttleIntervalV = setInterval(() => {
			this.scrollVertical(shuttleDiff, force, friction);
		}, interval);
	}
	stopShuttleVertical() {
		this.stopVertical();
		clearInterval(this.shuttleIntervalV);
	}
	
	startShuttleHorizontal(shuttleDiff, force, friction, interval) {
		clearInterval(this.shuttleIntervalH);
		this.scrollHorizontal(shuttleDiff, force, friction);
		this.shuttleIntervalH = setInterval(() => {
			this.scrollHorizontal(shuttleDiff, force, friction);
		}, interval);
	}
	stopShuttleHorizontal() {
		clearInterval(this.shuttleIntervalH);
		this.stopHorizontal();
	}
	
	applyForce(forceX, forceY) {
		if (!this.isScrolling) {
			this.isScrolling = true;
			this.interval = setInterval(this.update.bind(this), this.intervalTime);
		}
		Body.applyForce(this.scroller, {
			x: this.scroller.position.x,
			y: this.scroller.position.y
		}, {
			x: forceX,
			y: forceY
		});
	}
	
	update() {
		this.updateVertical();
		this.updateHorizontal();
	}
	
	updateVertical() {
		let pos = this.scroller.position.y - this.midpoint;
		let roundedPos = Math.round(pos * 1000) / 1000;
		if (roundedPos !== this.lastPosY) {
			let newPos = roundedPos;
			let dy;
			let deltaTotalInt;
			
			dy = newPos - this.lastPosY;
			// console.log('newPos', newPos, this.lastPosY);
			let deltaTotal = this.deltaTotalY + dy;
			deltaTotalInt = Math.round(deltaTotal);
			this.deltaTotalY = this.deltaTotalY + dy - deltaTotalInt;
		
			if (deltaTotalInt !== 0) {
				this.emit('scroll', 0, deltaTotalInt);
			}
			
			clearTimeout(this.timeout);
			this.timeout = setTimeout(() => {
				this.isScrolling = false;
				clearInterval(this.interval);
				this.stop();
				console.log('vertical timed out =====================');
			}, 1000);
			
			this.lastPosY = roundedPos;
		}
	}
	
	updateHorizontal() {
		let pos = this.scroller.position.x - this.midpoint;
		let roundedPos = Math.round(pos * 1000) / 1000;
		if (roundedPos !== this.lastPosX) {
			let newPos = roundedPos;
			let dy;
			let deltaTotalInt;
			
			dy = newPos - this.lastPosX;
			// console.log('newPos', newPos, this.lastPosX);
			let deltaTotal = this.deltaTotalX + dy;
			deltaTotalInt = Math.round(deltaTotal);
			this.deltaTotalX = this.deltaTotalX + dy - deltaTotalInt;
			
			if (deltaTotalInt !== 0) {
				this.emit('scroll', deltaTotalInt, 0);
			}
			
			clearTimeout(this.timeout);
			this.timeout = setTimeout(() => {
				this.isScrolling = false;
				clearInterval(this.interval);
				this.stop();
				console.log('horizontal timed out =====================');
				Body.setVelocity(this.scroller, {x: 0, y:0});
			}, 1000);
			
			this.lastPosX = roundedPos;
		}
	}
}

export default MomentumScroll;