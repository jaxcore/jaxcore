var isArray = function (o) {
	return typeof o === 'object' && Object.prototype.toString.apply(o) === '[object Array]';
};

var isString = function (o) {
	return typeof o === 'string' || o instanceof String;
};

function alpha(color, a) {
	if (typeof a === 'number' && a >= 0 && a <= 1) {
		var c = getRGB(color);
		return rgb(c[0], c[1], c[2], a);
	}
	return color;
}

function lighten(c, l) {
	if (c.value) c = c.value;
	else if (typeof l === 'undefined') return c;
	return rgb(shiftHSL(c, 0, 0, l));
}

function darken(c, l) {
	return lighten(c, -l);
}

function saturate(c, s) {
	if (c.value) c = c.value;
	else if (typeof s === 'undefined') return c;
	return rgb(shiftHSL(c, 0, s, 0));
}

function desaturate(c, s) {
	return saturate(c, -s);
}

function hslval(x, y, r) {
	if (r < 0) r += 1;
	if (r > 1) r -= 1;
	var c;
	if (6 * r < 1) c = x + (y - x) * 6 * r;
	else if (2 * r < 1) c = y;
	else if (3 * r < 2) c = x + (y - x) * ((2 / 3) - r) * 6;
	else c = x;
	return c * 255;
}

function hsl2rgb(hsl) {
	var h = hsl[0], s = hsl[1], l = hsl[2], r, g, b;
	if (s === 0) {
		r = g = b = l * 255;
	} else {
		var x, y;
		if (l < 0.5) y = l * (1 + s);
		else y = l + s - l * s;
		x = 2 * l - y;
		r = hslval(x, y, h + 1 / 3);
		g = hslval(x, y, h);
		b = hslval(x, y, h - 1 / 3);
	}
	r = Math.round(r);
	g = Math.round(g);
	b = Math.round(b);
	if (hsl.length === 4) return [r, g, b, hsl[3]];
	else return [r, g, b];
}

function hsl(h, s, l, a) {
	var x = [h / 360, s / 100, l / 100];
	var r = hsl2rgb(x).map(Math.round);
	if (arguments.length === 4) r[3] = a;
	return rgb(r);
}

function shiftHSL(c, h, s, l) {
	if (typeof h === 'undefined') h = 0;
	if (typeof s === 'undefined') s = 0;
	if (typeof l === 'undefined') l = 0;
	var o = getRGB(c);
	var x = getHSL(o);
	x[0] += h;
	if (x[0] < 0) x[0] += 1;
	if (x[0] > 1) x[0] -= 1;
	x[1] *= 1 + s;
	if (x[1] < 0) x[1] = 0;
	if (x[1] > 1) x[1] = 1;
	x[2] *= 1 + l;
	if (x[2] < 0) x[2] = 0;
	if (x[2] > 1) x[2] = 1;
	var n = hsl2rgb(x);
	if (o.length === 4) n[3] = o[3];
	return n;
}

function shiftHue(c, h) {
	if (typeof h === 'undefined') return c;
	return rgb(shiftHSL(c, h, 0, 0));
}

function combine(sourceColor, targetColor, amount) {
	amount = amount || 0.5;
	var al = getAlpha(sourceColor);
	var s = getRGB(sourceColor);
	var t = getRGB(targetColor);
	var r = Math.round((t[0] - s[0]) * amount);
	var g = Math.round((t[1] - s[1]) * amount);
	var b = Math.round((t[2] - s[2]) * amount);
	return rgb(s[0] + r, s[1] + g, s[2] + b, al);
}

function tint(sourceColor, targetColor, amount) {
	var sH = getHue(sourceColor);
	var tH = getHue(targetColor);
	var diff = tH - sH;
	if (diff > 0 && diff > 0.5) diff -= 1;
	else if (diff < 0 && diff < -0.5) diff += 1;
	var dH = diff * amount;
	return rgb(shiftHSL(sourceColor, dH, null, null));
}

function hue(c, h) {
	return setHSL(c, h);
}

function saturation(c, s) {
	return setHSL(c, null, s);
}

function lightness(c, l) {
	return setHSL(c, null, null, l);
}

function setHSL(c, h, s, l) {
	var x = getHSL(c);
	if (typeof h === 'undefined' || h === null) h = x[0];
	if (typeof s === 'undefined' || s === null) s = x[1];
	if (typeof l === 'undefined' || l === null) l = x[2];
	if (x.length === 4) return rgb(hsl2rgb([h, s, l, x[3]]));
	else return rgb(hsl2rgb([h, s, l]));
}

function rgb() {
	if (arguments.length === 1) {
		var a = arguments[0];
		if (typeof a === 'string') {
			var r = getRGB(a);
			if (isArray(r)) return rgb(r);
			else return getHex(r);
		}
		if (isArray(a) && a.length === 3) {
			return getHex(a);
		}
		if (isArray(a) && a.length === 4) {
			return 'rgba(' + Math.round(a[0]) + ',' + Math.round(a[1]) + ',' + Math.round(a[2]) + ',' + a[3] + ')';
		}
	} else if (arguments.length === 3) {
		return getHex(Array.from(arguments));
	} else if (arguments.length === 4) {
		if (typeof arguments[3] === 'number' && arguments[3] > 0 && arguments[3] <= 1) {
			return 'rgba(' + Math.round(arguments[0]) + ',' + Math.round(arguments[1]) + ',' + Math.round(arguments[2]) + ',' + arguments[3] + ')';
		} else return getHex(Array.from(arguments));
	}
}

function setRGB(c, r, g, b, a) {
	c = getRGB(c);
	if (typeof r === 'number') c[0] = r;
	if (typeof g === 'number') c[1] = g;
	if (typeof b === 'number') c[2] = b;
	if (typeof a === 'number') c[3] = a;
	return rgb(c);
}

function getAlpha(color) {
	var x = getRGB(color);
	if (x.length === 4) return x[3];
	return 0;
}

function getRGB() {
	if (isArray(arguments[0])) return arguments[0];
	if (typeof arguments[0] === 'string') {
		var c = arguments[0];
		if (/^#/.test(c)) {
			var h = c.substring(1);
			if (/^[0-9a-f]{6}$/i.test(h)) return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
			if (/^[0-9a-f]{3}$/i.test(h)) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
			return [0, 0, 0];
		}
		var m;
		if (m = c.match(/rgb\((\d+.?\d*), ?(\d+.?\d*), ?(\d+.?\d*)\)/)) {
			return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3])];
		}
		if (m = c.match(/rgba\((\d+.?\d*), ?(\d+.?\d*), ?(\d+.?\d*), ?(\d+.?\d*)\)/)) {
			return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
		} else {
		}
	}
	
}

function getRed(c) {
	return getRGB(c)[0];
}

function getGreen(c) {
	return getRGB(c)[1];
}

function getBlue(c) {
	return getRGB(c)[2];
}

function getHex(color, full) {
	if (color) {
		var c = getRGB(color);
		if (c) {
			var r = int2hex(Math.round(c[0]));
			var g = int2hex(Math.round(c[1]));
			var b = int2hex(Math.round(c[2]));
			if (!full && r[0] === r[1] && g[0] === g[1] && b[0] === b[1]) return ('#' + r[0] + g[0] + b[0]).toUpperCase();
			return ('#' + r + g + b).toUpperCase();
		}
	}
	return '#000';
}

function int2hex(i) {
	var v = i.toString(16);
	return v.length === 1 ? '0' + v : v;
}

function getHSL(color) {
	var rgb;
	if (isArray(color)) rgb = color;
	else if (isString(color)) rgb = getRGB(color);
	else {
		console.log('no rgb for ', color);
		return [0, 0, 0];
	}
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var x = Math.max(r, g, b);
	var n = Math.min(r, g, b);
	var l = (x + n) / 2;
	var s = 0, h = 0;
	if (x === n) {
		s = 0;
		h = 0;
	} else {
		var d = x - n;
		if (l > 0.5) s = d / (2 - x - n);
		else s = d / (x + n);
		if (x === r) h = (g - b) / d + (g < b ? 6 : 0);
		if (x === g) h = 2 + (b - r) / d;
		if (x === b) h = 4 + (r - g) / d;
		h /= 6;
		if (h < 0) h += 1;
	}
	if (rgb.length === 4) return [h, s, l, rgb[3]];
	else return [h, s, l];
}

function getHue(c) {
	return getHSL(c)[0];
}

function getSaturation(c) {
	return getHSL(c)[1];
}

function getLightness(c) {
	return getHSL(c)[2];
}

function invert(color) {
	var rgba = getRGB(color);
	for (var i = 0; i < 3; i++) {
		rgba[i] = 255 - rgba[i];
	}
	return rgb(rgba);
}

module.exports = {
	hsl2rgb: hsl2rgb,
	hslval: hslval,
	int2hex: int2hex,
	alpha: alpha,
	lighten: lighten,
	darken: darken,
	saturate: saturate,
	desaturate: desaturate,
	shiftHSL: shiftHSL,
	shiftHue: shiftHue,
	combine: combine,
	tint: tint,
	hue: hue,
	saturation: saturation,
	lightness: lightness,
	hsl: hsl,
	hsla: hsl,
	setHSL: setHSL,
	rgb: rgb,
	rgba: rgb,
	setRGB: setRGB,
	getAlpha: getAlpha,
	getRGB: getRGB,
	getRed: getRed,
	getGreen: getGreen,
	getBlue: getBlue,
	getHex: getHex,
	getHSL: getHSL,
	getHue: getHue,
	getSaturation: getSaturation,
	getLightness: getLightness,
	invert: invert
};
	