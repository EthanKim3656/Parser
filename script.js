
import Parser from "./parser.js";

const test = new Parser;

// https://people.math.sc.edu/Burkardt/data/data.html

// Fix code tomorrow- Tga parser is awful

// sample_640×426.tga - true-color test
// football_seal.tga  - colorMap test

const tga = await test.parseTga("sample_640×426.tga");

var canvas, ctx;

canvas  = document.createElement('canvas');
ctx     = canvas.getContext('2d');

const {

	data,
	width,
	height
} = tga;

canvas.width  = width;
canvas.height = height;

ctx.putImageData(new ImageData(data, width, height), 0, 0);

document.body.appendChild(canvas);