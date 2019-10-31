"use strict";

function replaceAll(target, search, replacement) {
  return target.replace(new RegExp(search, 'g'), replacement);
}

/**
 * Clones an object.
 * @param  {Object} obj The object to clone.
 * @return {Object}     The cloned object.
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

//flip row x column to column x row
function transpose(array) {
  return array[0].map((col, i) =>
    array.map((row) => row[i]
    )
  );
}

function loadJSON(file, callback) {
  const xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', file, true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}


// SVG drawing
const SVG = {};
// https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
SVG.lineCommand = point => `L ${point[0]} ${point[1]}`;
SVG.path = (points, command = SVG.lineCommand, color = '#000') => {
  // build the d attributes by looping over the points
  const d = points.reduce((acc, point, i, a) => i === 0
    // if first point
    ? `M ${point[0]},${point[1]}`
    // else
    : `${acc} ${command(point, i, a)}`
    , '');
  return `<path d="${d}" fill="none" stroke="${color}" />`;
}
// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes
SVG.circle = (x, y, radius, strokeWidth, color = '#000', fillColor = 'transparent') =>
  `<circle cx="${x}" cy="${y}" r="${radius}" stroke="${color}" fill="${fillColor}" stroke-width="${strokeWidth}"/>`;
SVG.dot = (x, y, radius, color = '#000') => circle(x, y, radius, 1, color, color);
SVG.polygone = (points, color = '#000') => {
  const coordinates = points.reduce((acc, p) => { acc = `${acc} ${p.x},${p.y}`}, '');
  return `<path d="${coordinates}" fill="none" stroke="${color}" />`;
}

// Points
const Point = {};
Point.distance2D = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
Point.distance3D = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z));
