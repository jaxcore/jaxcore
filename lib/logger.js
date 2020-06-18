var chalk = require('chalk');

var _quiet = (process.env.NODE_ENV !== 'dev' && process.env.NODE_ENV !== 'development');
_quiet = false;
// var _quiet = true; //(process.env.NODE_ENV !== 'dev');

var logger = {
	quiet: function (q) {
		_quiet = q;
	},
	log: function () {
		if (_quiet) return;
		
		var args = Array.prototype.slice.call(arguments);
		args = args.map(function (arg, index) {
			if (index === 0 && typeof arg === 'object' && arg.loggerName) {
				return chalk.green(arg.loggerName);
			}
			if (typeof arg === 'string') {
				if (index >= 2 && typeof args[0] === 'object' && args[0].loggerName && typeof args[1] === 'string') return arg;
				return chalk.cyan(arg);
			}
			if (typeof arg === 'number') return chalk.magenta(arg);
			if (arg === null) return chalk.yellow('null');
			if (typeof arg === 'undefined') return chalk.yellow('undefined');
			return arg;
		});
		console.log.apply(null, args);
	},
	createLogger: function(name, colors) {
		return (function(n) {
			return function log() {
				var args = Array.prototype.slice.call(arguments);
				args.unshift({loggerName:n});
				logger.log.apply(logger, args);
			}
		}(name));
	}
};

module.exports = logger;