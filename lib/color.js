function isColor(c) {
	return c instanceof Color;
}

var colors = require('./colors');

var Color = function () {
	if (arguments.length===1 && typeof arguments[0]==='number' && arguments[0]>=0 && arguments[0]<=255) {
		return this.value = colors.rgb(arguments[0],arguments[0],arguments[0]);
	}
	if (isColor(arguments[0])) this.value = arguments[0].value;
	else this.value = (arguments.length > 0) ? colors.rgb.apply(null, Array.from(arguments)) : '#000';
};

Color.prototype = {
	toString: function () {
		return this.value;
	},
	
	// setters
	
	/**
	 * Sets the transparency of a color
	 *
	 * @method alpha
	 * @memberof Color
	 * @param {Number} alpha transparency level between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#f00').alpha(0.5);  // returns {value:"rgba(255,0,0,0.5)"}
	 *
	 */
	alpha: function (v) {
		return new Color(colors.alpha(this.value, v));
	},
	
	/**
	 * Increases the "lightness" of a color value
	 *
	 * @method lighten
	 * @memberof Color
	 * @param {Number} lightenBy amount to lighten between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#f00').lighten(0.5); // returns {value:"#FF8080"}
	 *
	 */
	lighten: function (v) {
		return new Color(colors.lighten(this.value, v));
	},
	
	/**
	 * Decreases the "lightness" of a color value
	 *
	 * @method darken
	 * @memberof Color
	 * @param {Number} darkenBy amount to darken between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#f00').darken(0.5); // returns {value:"#800000"}
	 *
	 */
	darken: function (v) {
		return new Color(colors.darken(this.value, v));
	},
	
	/**
	 * Increases the "saturation" of a color value
	 *
	 * @method saturate
	 * @memberof Color
	 * @param {Number} saturateBy amount to saturate between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('rgb(125,0,0)').saturate(0.2); // returns {value:"#7D0000"}
	 *
	 */
	saturate: function (v) {
		return new Color(colors.saturate(this.value, v));
	},
	
	/**
	 * Decreases the "saturation" of a color value
	 *
	 * @method desaturate
	 * @memberof Color
	 * @param {Number} desaturateBy amount to desaturate between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color(125,0,0).desaturate(0.2); // returns {value:"#710C0C"}
	 *
	 */
	desaturate: function (v) {
		return new Color(colors.desaturate(this.value, v));
	},
	
	/**
	 * Modify the hue, lightness, and saturation of a color
	 *
	 * @method shiftHSL
	 * @memberof Color
	 * @param {Number} hue amount to change the hue by, between 0 and 1
	 * @param {Number} saturation amount to change the hue by, between 0 and 1
	 * @param {Number} lightness amount to change the hue by, between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color(255,255,0).shiftHSL(0.1,0.2,0.3); // returns {value:"#94FF4D"}
	 *
	 */
	shiftHSL: function (h, s, l, a) {
		var c = new Color(colors.shiftHSL(this.value, h, s, l));
		if (a) c = c.alpha(a);
		return c;
	},
	
	/**
	 * Shifts the "hue" of a color value by a given percentage
	 *
	 * @method shiftHue
	 * @memberof Color
	 * @param {Number} hueShift amount to modify the hue by between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color(255,255,0).shiftHue(0.25); // returns {value:"#00FF7F"}
	 *
	 */
	shiftHue: function (v) {
		return new Color(colors.shiftHue(this.value, v));
	},
	
	/**
	 * Shifts the hue of a color closer to another color by a given percentage
	 *
	 * @method combine
	 * @memberof Color
	 * @param {Object} targetColor color string, array, or object
	 * @param {Number} [amount=0.5] how close to the target color between 0 and 1 (0.5 is half-way between)
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color(0).combine('#fff'); // returns {value:"#808080"}
	 * new Color(255,0,0).combine('#00f',0.7); // returns {value:"#4D00B3"}
	 *
	 */
	combine: function (t, v) {
		if (isColor(t)) t = t.value;
		var c = colors.combine(this.value, t, v);
		return new Color(c);
	},
	
	/**
	 * Shifts the "hue" of a color closer to another color by a given percentage
	 *
	 * @method tint
	 * @memberof Color
	 * @param {String} targetColor color string or array
	 * @param {Number} amount amount to shift the hue toward the target color between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('rgb(255,0,0)').tint('#00f',0.5); // returns {value:"#F0F"}
	 * new Color('rgb(0,0,100)').tint('rgb(100,0,0)',0.1); // returns {value:"#140064"}
	 *
	 */
	tint: function (t, v) {
		if (isColor(t)) t = t.value;
		return new Color(colors.tint(this.value, t, v));
	},
	
	/**
	 * Set the "hue" of a color
	 *
	 * @method hue
	 * @memberof Color
	 * @param {Number} hue hue value between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#f00').hue(2/3); // returns {value:"#00F"}
	 * new Color('#0f0').hue(1); // returns {value:"#F00"}
	 * new Color('#00f').hue(1/3); // returns {value:"#0F0"}
	 *
	 */
	hue: function (v) {
		return new Color(colors.hue(this.value, v));
	},
	
	/**
	 * Set the "saturation" of a color
	 *
	 * @method saturation
	 * @memberof Color
	 * @param {Number} saturation saturation value between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('rgb(100,50,50)').saturation(0); // returns {value:"#4B4B4B")
	 * new Color('rgb(50,0,0)').saturation(0.5);  // returns {value:"#260C0C")
	 * new Color('rgb(50,50,100)').saturation(1); // returns {value:"#000096")
	 *
	 */
	saturation: function (v) {
		return new Color(colors.saturation(this.value, v));
	},
	
	/**
	 * Set the lightness of a color, how close to white or black the color will be
	 *
	 * @method lightness
	 * @memberof Color
	 * @param {Number} lightness lightness value between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('rgb(255,0,0)').lightness(0); // returns {value:"#000"}
	 * new Color('rgb(255,0,0)').lightness(0.5); // returns {value:"#F00"}
	 * new Color('rgb(255,0,0)').lightness(1); // returns {value:"#FFF"}
	 *
	 */
	lightness: function (v) {
		return new Color(colors.lightness(this.value, v));
	},
	
	/**
	 * Inverts the color
	 *
	 * @method invert
	 * @memberof Color
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#f00').invert(1); // returns {value:"#0FF"}  // cyan
	 * new Color('#fff').invert();  // returns {value:"#000"}   // black
	 *
	 */
	invert: function () {
		return new Color(colors.invert(this.value));
	},
	
	/**
	 * Modify the red, green, or blue component of a color
	 *
	 * @method rgb
	 * @memberof Color
	 * @param {Number} red red component (0-255)
	 * @param {Number} green green component (0-255)
	 * @param {Number} blue blue component (0-255)
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#f00').rgb(null,null,255); // returns {value:"#F0F"}
	 * new Color('#0f0').rgb(null,255,null); // returns {value:"#0F0"}
	 * new Color('#ff0').rgb(null,null,255); // returns {value:"#FFF"}
	 * new Color('#fff').rgb(100);           // returns {value:"#64FFFF"}
	 *
	 */
	rgb: function () {
		var a = Array.from(arguments);
		a.unshift(this.value);
		return new Color(colors.setRGB.apply(null, a));
	},
	
	/**
	 * Set the hue, saturation, or lightness of a color and return the new color
	 *
	 * @method hsl
	 * @memberof Color
	 * @param {Number} hue hue value between 0 and 1
	 * @param {Number} saturation saturation value between 0 and 1
	 * @param {Number} lightness lightness value between 0 and 1
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#f00').hsl(null,0.5,0.5); // returns {value:"#BF4040"}
	 *
	 */
	hsl: function () {
		var a = Array.from(arguments);
		a.unshift(this.value);
		return new Color(colors.setHSL.apply(null, a));
	},
	
	/**
	 * Set the red component of a color
	 *
	 * @method red
	 * @memberof Color
	 * @param {Number} red red component 0-255
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('rgb(0,0,255)').red(255);  // returns {value:"#F0F"}
	 *
	 */
	red: function (r) {
		return this.rgb(r);
	},
	
	/**
	 * Set the green component of a color
	 *
	 * @method green
	 * @memberof Color
	 * @param {Number} green green component 0-255
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('rgb(255,0,0)').green(255);  // returns {value:"#FF0"}
	 *
	 */
	green: function (g) {
		return this.rgb(null, g);
	},
	
	/**
	 * Set the blue component of a color
	 *
	 * @method blue
	 * @memberof Color
	 * @param {Number} blue blue component 0-255
	 * @return {Color} new Color() instance
	 * @instance
	 *
	 * @example
	 * new Color('#FF0').blue(255);  // returns {value:"#FFF"}
	 *
	 */
	blue: function (b) {
		return this.rgb(null, null, b);
	},
	
	// getters
	
	/**
	 * Returns the transparency of a color
	 *
	 * @method getAlpha
	 * @memberof Color
	 * @return {Number} alpha transparency level between 0 and 1
	 * @instance
	 *
	 * @example
	 * new Color('#F00').getAlpha(); // returns 0
	 * new Color('rgba(255,0,0,0.5)').getAlpha(); // returns 0.5
	 *
	 */
	getAlpha: function () {
		return colors.getAlpha(this.value);
	},
	
	/**
	 * Returns the computed red, green, blue, and alpha values as an array
	 *
	 * @method getRGB
	 * @memberof Color
	 * @return {Number[]} rgb array
	 * @instance
	 *
	 * @example
	 * new Color('#F00').getRGB(); // returns [255,0,0]
	 * new Color('rgba(255,0,0,0.5)').getRGB()(); // returns [255,0,0,0.5]
	 *
	 */
	getRGB: function () {
		return colors.getRGB(this.value);
	},
	
	/**
	 * Returns the hexidecimal value of the color
	 *
	 * @method getHex
	 * @memberof Color
	 * @param {Boolean} full return the full 6 character hexidecimal value (eg. do not shorten #FFFFFF to #FFF)
	 * @return {String} hex color value
	 * @instance
	 *
	 * @example
	 * new Color('rgba(255,0,0,0.5)').getHex(); // returns "#F0F"
	 * new Color('rgba(255,0,0,0.5)').getHex(true); // returns "#FF0000"
	 *
	 */
	getHex: function(full) {
		return colors.getHex(this.value, full);
	},
	
	/**
	 * Returns the red component of a color string
	 *
	 * @method getRed
	 * @memberof Color
	 * @return {Number} red component 0-255
	 * @instance
	 *
	 * @example
	 * new Color('#fff').getRed(); // returns 255
	 *
	 */
	getRed: function () {
		return this.getRGB()[0];
	},
	
	/**
	 * Returns the green component of a color string
	 *
	 * @method getGreen
	 * @memberof Color
	 * @return {Number} green component 0-255
	 * @instance
	 *
	 * @example
	 * new Color('#fff').getGreen(); // returns 255
	 *
	 */
	getGreen: function () {
		return this.getRGB()[1];
	},
	
	/**
	 * Returns the blue component of a color string
	 *
	 * @method getBlue
	 * @memberof Color
	 * @return {Number} blue component 0-255
	 * @instance
	 *
	 * @example
	 * new Color('#fff').getBlue(); // returns 255
	 *
	 */
	getBlue: function () {
		return this.getRGB()[2];
	},
	
	/**
	 * Returns an [h,s,l] array from color string
	 *
	 * @method getHSL
	 * @memberof Color
	 * @return {Number[]} hsl array of [hue,saturation,lightness]
	 * @instance
	 *
	 * @example
	 * new Color('#f00').getHSL(); // returns [0,1,0.5]
	 *
	 */
	getHSL: function () {
		return colors.getHSL(this.value);
	},
	
	/**
	 * Return the "hue" of a color
	 *
	 * @method getHue
	 * @memberof Color
	 * @return {Number} hue hue value between 0 and 1
	 * @instance
	 *
	 * @example
	 * new Color('#a1b2c1').getHue(); // returns {value:"0.578125"}
	 * new Color('#f00').getHue(); // returns 0
	 * new Color('#0f0').getHue(); // returns 0.3333333333333333
	 * new Color('#00f').getHue(); // returns 0.6666666666666666
	 *
	 */
	getHue: function () {
		return this.getHSL()[0];
	},
	
	/**
	 * Return the "saturation" of a color
	 *
	 * @method getSaturation
	 * @memberof Color
	 * @return {Number} saturation saturation value between 0 and 1
	 * @instance
	 *
	 * @example
	 * new Color('rgb(100,100,100)').getSaturation(); // returns 0
	 * new Color('rgb(100,50,100)').getSaturation();  // returns 0.8333333333333334
	 * new Color('rgb(100,0,100)').getSaturation();   // returns 1
	 *
	 */
	getSaturation: function () {
		return this.getHSL()[1];
	},
	
	/**
	 * Return the lightness of a color (how close to white or black the color is)
	 *
	 * @method getLightness
	 * @memberof Color
	 * @return {Number} lightness lightness value between 0 and 1
	 * @instance
	 *
	 * @example
	 * new Color('rgb(0,0,0)').getLightness();       // returns 0
	 * new Color('rgb(100,50,100)').getLightness();  // returns 0.29411764705882354
	 * new Color('rgb(255,255,255)').getLightness(); // returns 1
	 *
	 */
	getLightness: function () {
		return this.getHSL()[2];
	}
};

Color.prototype.rgba = Color.prototype.rgb;
Color.prototype.hsla = Color.prototype.hsl;

module.exports = Color;