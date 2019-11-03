'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _matterJs = require('matter-js');

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
// let matterjs = require('matter-js');
// const {Engine, Render, World, Bodies, Body} = matterjs;
// import {Engine, Render, World, Bodies, Body} from 'matter-js';

// const EventEmitter = require('events');

// global.Body = Body;

var MomentumScroll = function (_EventEmitter) {
	_inherits(MomentumScroll, _EventEmitter);

	function MomentumScroll(config) {
		_classCallCheck(this, MomentumScroll);

		var _this = _possibleConstructorReturn(this, (MomentumScroll.__proto__ || Object.getPrototypeOf(MomentumScroll)).call(this));

		global.momentum = _this;

		_this.intervalTime = config.intervalTime || 50;

		_this.scrollerSize = 50;

		_this.w = 700;
		_this.h = 700;

		_this.midpoint = _this.w / 2 - _this.scrollerSize / 2;

		_this.engine = _matterJs.Engine.create();
		_this.engine.world.gravity.y = 0;

		if (config.domNode) {
			_this.render = _matterJs.Render.create({
				element: config.domNode,
				engine: _this.engine,
				options: {
					width: _this.w,
					height: _this.h,
					wireframes: false,
					background: "#000"
				}
			});
		}

		if (config.domNode) {
			var canvas = config.domNode.childNodes[0];
			_this.canvas = canvas;
		}

		// Engine.run(this.engine);
		//Matter.Render.stop(this.debugRender);

		_this.runner = _matterJs.Runner.create();

		if (_this.render) _matterJs.Render.run(_this.render);

		var size = _this.scrollerSize;

		_this.scroller = _matterJs.Bodies.rectangle(size / 2, size / 2, size, size, {
			frictionAir: config.friction || 0,
			friction: 0,
			restitution: 0,
			background: "#F00"
		});

		_matterJs.Body.setPosition(_this.scroller, { x: _this.midpoint, y: _this.midpoint });
		_matterJs.World.add(_this.engine.world, [_this.scroller]);

		_this.isScrolling = false;

		_this.deltaTotalX = 0;
		_this.deltaTotalY = 0;
		_this.lastPosX = 0;
		_this.lastPosY = 0;
		_this.directionX = 0;
		_this.directionY = 0;

		_this._tick = _this.tick.bind(_this);

		_this.interval = 1; //1000/100;
		return _this;
	}

	_createClass(MomentumScroll, [{
		key: 'start',
		value: function start() {
			if (!this.active) {
				console.log('ENGINE START');
				this.active = true;
				this._tick();
			}
		}
	}, {
		key: 'stop',
		value: function stop() {
			this.active = false;
			console.log('ENGINE stopping...');
		}
	}, {
		key: 'tick',
		value: function tick() {
			if (!this.active) {
				console.log('ENGINE STOPPED');
				return;
			}
			_matterJs.Runner.tick(this.runner, this.engine, this.interval);
			if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.requestAnimationFrame) {
				requestAnimationFrame(this._tick);
			} else {
				// console.log('ENGINE tick this.active='+this.active);
				setTimeout(this._tick, this.interval);
			}
		}
	}, {
		key: 'stopVertical',
		value: function stopVertical() {
			_matterJs.Body.setVelocity(this.scroller, { x: this.scroller.velocity.x, y: 0 });
			_matterJs.Body.setPosition(this.scroller, { x: this.scroller.position.x, y: this.midpoint });
			this.lastPosY = 0;
			this.deltaTotalY = 0;
		}
	}, {
		key: 'scrollVertical',
		value: function scrollVertical(diff, force, friction) {
			this.scroller.frictionAir = friction;

			var newPosDirection = diff > 0 ? 1 : -1;
			if (this.directionY !== newPosDirection) {
				this.directionY = newPosDirection;
				this.stopVertical();
				this.lastPosY = 0;
				this.deltaTotalY = 0;
			}

			this.start();
			this.applyForce(0, force);
		}
	}, {
		key: 'stopHorizontal',
		value: function stopHorizontal() {
			_matterJs.Body.setVelocity(this.scroller, { x: 0, y: this.scroller.velocity.y });
			_matterJs.Body.setPosition(this.scroller, { x: this.midpoint, y: this.scroller.position.y });
			this.lastPosX = 0;
			this.deltaTotalX = 0;
		}
	}, {
		key: 'scrollHorizontal',
		value: function scrollHorizontal(diff, force, friction) {
			this.scroller.frictionAir = friction;

			var newPosDirection = diff > 0 ? 1 : -1;
			if (this.directionX !== newPosDirection) {
				this.directionX = newPosDirection;
				this.stopHorizontal();
				this.lastPosX = 0;
				this.deltaTotalX = 0;
			}

			this.start();
			this.applyForce(force, 0);
		}
	}, {
		key: 'startShuttleVertical',
		value: function startShuttleVertical(shuttleDiff, force, friction, interval) {
			var _this2 = this;

			clearInterval(this.shuttleIntervalV);
			this.scrollVertical(shuttleDiff, force, friction);
			this.shuttleIntervalV = setInterval(function () {
				_this2.scrollVertical(shuttleDiff, force, friction);
			}, interval);
		}
	}, {
		key: 'stopShuttleVertical',
		value: function stopShuttleVertical() {
			this.stopVertical();
			clearInterval(this.shuttleIntervalV);
		}
	}, {
		key: 'startShuttleHorizontal',
		value: function startShuttleHorizontal(shuttleDiff, force, friction, interval) {
			var _this3 = this;

			clearInterval(this.shuttleIntervalH);
			this.scrollHorizontal(shuttleDiff, force, friction);
			this.shuttleIntervalH = setInterval(function () {
				_this3.scrollHorizontal(shuttleDiff, force, friction);
			}, interval);
		}
	}, {
		key: 'stopShuttleHorizontal',
		value: function stopShuttleHorizontal() {
			clearInterval(this.shuttleIntervalH);
			this.stopHorizontal();
		}
	}, {
		key: 'applyForce',
		value: function applyForce(forceX, forceY) {
			if (!this.isScrolling) {
				this.isScrolling = true;
				this.interval = setInterval(this.update.bind(this), this.intervalTime);
			}
			_matterJs.Body.applyForce(this.scroller, {
				x: this.scroller.position.x,
				y: this.scroller.position.y
			}, {
				x: forceX,
				y: forceY
			});
		}
	}, {
		key: 'update',
		value: function update() {
			this.updateVertical();
			this.updateHorizontal();
		}
	}, {
		key: 'updateVertical',
		value: function updateVertical() {
			var _this4 = this;

			var pos = this.scroller.position.y - this.midpoint;
			var roundedPos = Math.round(pos * 1000) / 1000;
			if (roundedPos !== this.lastPosY) {
				var newPos = roundedPos;
				var dy = void 0;
				var deltaTotalInt = void 0;

				dy = newPos - this.lastPosY;
				// console.log('newPos', newPos, this.lastPosY);
				var deltaTotal = this.deltaTotalY + dy;
				deltaTotalInt = Math.round(deltaTotal);
				this.deltaTotalY = this.deltaTotalY + dy - deltaTotalInt;

				if (deltaTotalInt !== 0) {
					this.emit('scroll', 0, deltaTotalInt);
				}

				clearTimeout(this.timeout);
				this.timeout = setTimeout(function () {
					_this4.isScrolling = false;
					clearInterval(_this4.interval);
					_this4.stop();
					console.log('vertical timed out =====================');
				}, 1000);

				this.lastPosY = roundedPos;
			}
		}
	}, {
		key: 'updateHorizontal',
		value: function updateHorizontal() {
			var _this5 = this;

			var pos = this.scroller.position.x - this.midpoint;
			var roundedPos = Math.round(pos * 1000) / 1000;
			if (roundedPos !== this.lastPosX) {
				var newPos = roundedPos;
				var dy = void 0;
				var deltaTotalInt = void 0;

				dy = newPos - this.lastPosX;
				// console.log('newPos', newPos, this.lastPosX);
				var deltaTotal = this.deltaTotalX + dy;
				deltaTotalInt = Math.round(deltaTotal);
				this.deltaTotalX = this.deltaTotalX + dy - deltaTotalInt;

				if (deltaTotalInt !== 0) {
					this.emit('scroll', deltaTotalInt, 0);
				}

				clearTimeout(this.timeout);
				this.timeout = setTimeout(function () {
					_this5.isScrolling = false;
					clearInterval(_this5.interval);
					_this5.stop();
					console.log('horizontal timed out =====================');
					_matterJs.Body.setVelocity(_this5.scroller, { x: 0, y: 0 });
				}, 1000);

				this.lastPosX = roundedPos;
			}
		}
	}]);

	return MomentumScroll;
}(_events2.default);

exports.default = MomentumScroll;