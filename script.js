
import Parser from "./parser.js";

const test = new Parser;

// https://people.math.sc.edu/Burkardt/data/data.html

// Fix code tomorrow- Tga parser is awful

// sample_640×426.tga - True-color test
// football_seal.tga  - ColorMap test
// shuttle.tga        - RLE test

const tga = await test.parseTga("shuttle.tga");

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