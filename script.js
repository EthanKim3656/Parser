
import Parser from "./Modules/parser.js";
const parser = new Parser;

// import Renderer from "./Modules/renderer.js";
// const renderer = new Renderer;

// const gl = renderer.gl;

// gl.clearColor( 0, 0, 0, 1 );
// gl.enable(gl.DEPTH_TEST);
// gl.depthFunc(gl.LEQUAL);
// gl.enable(gl.CULL_FACE);

// gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

// const program = renderer.createProgram(

// 	await fetch("./Shaders/vsh.glsl").then(i => i.text()),
// 	await fetch("./Shaders/fsh.glsl").then(i => i.text())
// );

// gl.useProgram(program);

// const l_cam = gl.getUniformLocation(program, "u_cam");
// const l_all = gl.getUniformLocation(program, "u_all");

// let rx = 0;
// let ry = -0.3;
// let cam = [0, -2, -3];

// let down = 0;

// const aspect = renderer.aspect;
// const matrix = renderer.allMatrix(Math.PI * 0.5, aspect, 0.01, 45);
// let all = matrix(rx, ry);

// renderer.canvas.addEventListener("mousemove", n => {

//     if(down) {

//         rx += n.movementX / 100;
//         ry -= n.movementY / 100;
		
//         all = matrix(rx, ry);
//     }
// });

// renderer.canvas.addEventListener("mousedown", () => down = 1);
// renderer.canvas.addEventListener("mouseup", () => down = 0);
// renderer.canvas.addEventListener("mouseout", () => down = 0);

// const draw = [];

// const obj = await parser.parseObj("lamp.obj");

// const {

// 	groups,
// 	libraries
// } = obj;

// groups.forEach( group => {

// 	group.geometry.forEach( object => {

// 		const vao = renderer.createVAO( program, object.positions, object.normals );

// 		draw.push( vao );
// 	});
// });

// const scene = () => {

// 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//     gl.uniformMatrix4fv(l_all, false, all);
//     gl.uniform3fv(l_cam, cam);

// 	draw.forEach( i => i() );

// 	window.requestAnimationFrame(scene);
// };

// scene();

const hdr = parser.parseHdr( "dani_cathedral_oBBC.hdr" );