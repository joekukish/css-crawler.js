/*!
 * css-crawler.js
 * version 0.0.1
 * author: Oscar Bolaños
 * https://github.com/joekukish/css-crawler.js
 */
(function() {
  'use strict';

  var Font = function(el) {
    this['font-family'] =  el.css('font-family');
    this['font-size'] = el.css('font-size');
    this['leading'] = el.css('line-height');
    this['font-style'] = el.css('font-style');
    this['font-weight'] = el.css('font-weight');
  };

  Font.prototype.toString = function() {
    return this['font-family'] + ', ' + this['font-size'] + ', ' + this['font-weight'] + ', ' + this['font-style'];
  };

  // taken from http://www.runtime-era.com/2011/11/grouping-html-hex-colors-by-hue-in.html
  function sortColors(colors) {
    for (var c = 0; c < colors.length; c++) {
      // gets the hex value without the hash symbol
      var hex = colors[c].hex.substring(1);

      // gets the RGB values that are stored in the object
      var r = colors[c].r;
      var g = colors[c].g;
      var b = colors[c].b;

      // gets the min and max values for chroma
      var max = Math.max.apply(Math, [r, g, b]);
      var min = Math.min.apply(Math, [r, g, b]);

      var chr = max - min;
      var hue = 0;
      var val = max;
      var sat = 0;

      if (val > 0) {
        // calculates the saturation only if Value isn't 0.
        sat = chr/val;
        if (sat > 0) {
          if (r === max) {
            hue = 60*(((g - min) - (b - min)) / chr);
            if (hue < 0) {
              hue += 360;
            }
          } else if (g === max) {
            hue = 120 + 60 * (((b - min) - (r - min)) / chr);
          } else if (b === max) {
            hue = 240 + 60 * (((r - min) - (g - min)) / chr);
          }
        }
      }

      // adds the calculated HSV values
      colors[c].hue = hue;
      colors[c].sat = sat;
      colors[c].val = val;
    }

    // sors the colors using the hue
    return colors.sort(function(a, b){ return a.hue - b.hue; });
  }

  // analyze the styles
  function crawlStyles(element) {
    // define methods needed for parsing
    var hexRegEx = new RegExp(/^#[0-9a-f]{3,6}$/i);
    var rgb2hex = function(rgb) {
      if (!rgb || rgb.indexOf('rgb') !== 0) {
        return rgb || '-';
      }
      var rgbArr = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

      if (!rgbArr) {
        rgbArr = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)$/);
      }

      function hex(x) {
        return ('0' + parseInt(x).toString(16)).slice(-2);
      }

      if (rgbArr)
        return {
          hex:'#' + hex(rgbArr[1]) + hex(rgbArr[2]) + hex(rgbArr[3]),
          r: rgbArr[1],
          g: rgbArr[2],
          b: rgbArr[3],
          a: rgbArr[4] !== undefined ? rgbArr[4] : 1
        };
      } else {
        return null;
      }
    };

    // root element where the css is extracted
    var baseSelector = $(element);
    var colorsBackgroundReturn = [], colorsTextReturn = [], colorsBorderReturn = [];
    var colorAttributes = {}, textAttributes = {};
    var textOcurrences = {};

    // iterates through every element
    var color;
    baseSelector.find('*').each(function(i, el) {
      color = null;
      el = $(el);
      ['color', 'background-color', 'border-color'].forEach(function(prop, j) {
        // if we can't find this property or it's null, continue
        if (!el.css(prop)) {
          return true;
        }
        // create RGBColor object
        color = rgb2hex(el.css(prop));

        if (colorAttributes[color.hex]) {
          colorAttributes[color.hex][prop] = (colorAttributes[color.hex][prop] || 0) + 1;
          colorAttributes[color.hex].count = colorAttributes[color.hex].count + 1;
        } else if (hexRegEx.test(color)) {
          colorAttributes[color.hex] = {count: 1};
          colorAttributes[color.hex][prop] = 1;
        }
      });

      // builds the Font object from the element
      var typo = new Font(el);
      // uses the toString() as a key in the object
      var typoKey = typo.toString();
      // checks if the text style was already used
      if (!textAttributes[typoKey]) {
        textAttributes[typoKey] = typo;
        textOcurrences[typoKey] = 1;
      // if so we just increase the count
      } else {
        textOcurrences[typoKey]++;
      }
    });

    // separates all the found colors into color, background-color and border-color
    for(var hex in colorAttributes) {
      var attr = colorAttributes[hex];
      if (attr['color'] || 0 > 0) {
        colorsTextReturn.push([hex, attr['color']]);
      }
      if (attr['background-color'] || 0 > 0) {
        colorsBackgroundReturn.push([hex, attr['background-color']]);
      }
      if (attr['border-color'] || 0 > 0) {
        colorsBorderReturn.push([hex, attr['border-color']]);
      }
    }

    // converts the object into an array
    var textArray = [];
    for (var key in textAttributes) {
      textArray.push(textAttributes[key]);
    }

    // returns the extracted colors and typography
    return {
      'colorsText' : sortColors(colorsTextReturn),
      'colorsBackground' : sortColors(colorsBackgroundReturn),
      'colorsBorder' : sortColors(colorsBorderReturn),
      'typography' : textArray.sort()
    };
  };

  // exports the API
  window.crawlStyles = crawlStyles;
}());
