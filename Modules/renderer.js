
/* 
renderer.js 

Ethan Kim

Demo only
*/

/**
 * @Class
 * Renderer class
 */
export default class Renderer {

	/**
	 * Create canvas element
	 * @param {Object} args - WebGL2 context arguments
	 */
	constructor(args) {

		this.width = window.innerWidth
		this.height = window.innerHeight
		this.aspect = this.width / this.height

		args ??= {antialias : false}

		this.canvas = document.createElement("canvas")

		this.canvas.width = this.width
		this.canvas.height = this.height

		this.canvas.style.position = "absolute"
		this.canvas.style.left = "0px"
		this.canvas.style.top = "0px"

		document.body.append(this.canvas)

		this.gl = this.canvas.getContext("webgl2", args)

		this.gl.clearColor(0, 0, 0, 1)
	}

	/**
	 * Create WebGL shader, used in "createProgram"
	 * @param {GL Shader Type} type - Shader type
	 * @param {String} code - Shader code
	 */
	createShader(type, code) {

		const shader = this.gl.createShader(type)
      
        this.gl.shaderSource(shader, code)
        this.gl.compileShader(shader)
      
        return shader
	}

	/**
	 * Creates WebGL program
	 * @param {String} vcode - Vertex shader code
	 * @param {String} fcode - Fragment shader code
	 */
	createProgram(vcode, fcode) {

		const vshader = this.createShader(
			this.gl.VERTEX_SHADER, vcode)
		const fshader = this.createShader(
			this.gl.FRAGMENT_SHADER, fcode)
	
		const program = this.gl.createProgram()
	
		this.gl.attachShader(program, vshader)
		this.gl.attachShader(program, fshader)
	
		this.gl.linkProgram(program)
	
		this.gl.detachShader(program, vshader)
		this.gl.deleteShader(vshader)
	
		this.gl.detachShader(program, fshader)
		this.gl.deleteShader(fshader)

		this.program = program
		this.gl.useProgram(program)
	
		return program
	}

	/**
	 * Generate pre-multiplied projection & rotation 
	 * matrix
	 * @param {Float} fov - Field of view of viewport
	 * @param {Float} aspect - Aspect ratio of viewport
	 * @param {Float} near - Near plane of viewport
	 * @param {Float} far - Far plane of viewport
	 */
	allMatrix(fov, aspect, near, far) {
	
		const ir = 1 / (near - far)
		const f1 = 1 / Math.tan(fov * 0.5)
		const f2 = f1 / aspect
		const nf = (near + far) * ir
		const nf2 = 2 * near * far * ir
		
		return (rx, ry) => {
	
			const cx = Math.cos(ry)
			const sx = Math.sin(ry)
	
			const cy = Math.cos(rx)
			const sy = Math.sin(rx)
	
			return [
	
				cy * f2, -sy * sx * f1, -sy * cx * nf,  sy * cx,
				0,        cx * f1,      -sx * nf,       sx,
				sy * f2,  sx * cy * f1,  cx * cy * nf, -cx * cy,
				0,        0,             nf2,           0,
			]
		}
	}

	/**
	 * Sets an attribute on a given program
	 * @param {GL Program} program - Program
	 * @param {String} name - Name of attribute in shader
	 * @param {Typed Array} array - Buffer
	 * @param {Int} count - Quantity of components (Optional)
	 * @param {GL Buffer type} - Type of buffer (Optional)
	 * @param {GL Data type} - Data type (Optional)
	 */
	setAttrib(program, name, array, count, btype, dtype) {
	
		const buffer = this.gl.createBuffer()
	
		btype ??= this.gl.ARRAY_BUFFER
		dtype ??= this.gl.FLOAT
		count ??= 3
	
		program = [].concat(program)
	
		this.gl.bindBuffer(btype, buffer)
		this.gl.bufferData(btype, array, this.gl.STATIC_DRAW)
	
		program.forEach(i => {
	
			const loc = this.gl.getAttribLocation(i, name)
	
			this.gl.enableVertexAttribArray(loc)
			this.gl.vertexAttribPointer(loc, count, dtype, false, 0, 0)
		})
	}

	/**
	 * Creates a VAO given attribute data
	 * @param {GL Program} program - Program
	 * @param {Typed Array Object} positions - Vertex positions 
	 * @param {Typed Array Object} normals - Vertex normals
	 * @param {Typed Array Object} [texcoords] - Vertex texcoords 
	 */ 
	createVAO ( program, positions, normals, texcoords ) {
		
		const vao = this.gl.createVertexArray();

		this.gl.bindVertexArray( vao );

		this.setAttrib( program, "a_position", positions );
		this.setAttrib( program, "a_normal"  , normals );

		if ( texcoords ) {

			this.setAttrib( program, "a_texcoord", texcoords, 2 );
		}

		this.gl.bindVertexArray( null );

		const length = positions.length / 3;

		return () => {

			this.gl.bindVertexArray( vao );

			this.gl.drawArrays( this.gl.TRIANGLES, 0, length );

			this.gl.bindVertexArray( null );
		};
	}

	/**
	 * Creates a cuboid- mostly for testing purposes
	 * @param {GL Program} program - Program
	 * @param {Float} x - X position (Optional)
	 * @param {Float} y - Y position (Optional)
	 * @param {Float} z - Z position (Optional)
	 * @param {Float} w - Width (Optional)
	 * @param {Float} h - Height (Optional)
	 * @param {Float} l - Length (Optional)
	 */
	cube(program, x, y, z, w, h, l) {

		x ??= -0.5
		y ??= -0.5
		z ??= -0.5

		w ??= 1
		h ??= 1
		l ??= 1

		const position = [

			x + w, y + h, z + l,
			x + w, y    , z + l,
			x + w, y + h, z    ,

			x + w, y    , z    ,
			x + w, y + h, z    ,
			x + w, y    , z + l,

			x    , y + h, z + l,
			x    , y + h, z    ,
			x    , y    , z + l,

			x    , y    , z    ,
			x    , y    , z + l,
			x    , y + h, z    ,

			x + w, y + h, z + l,
			x + w, y + h, z    ,
			x    , y + h, z + l,

			x    , y + h, z    ,
			x    , y + h, z + l,
			x + w, y + h, z    ,

			x + w, y    , z + l,
			x    , y    , z + l,
			x + w, y    , z    ,

			x    , y    , z    ,
			x + w, y    , z    ,
			x    , y    , z + l,

			x + w, y + h, z + l,
			x    , y + h, z + l,
			x + w, y    , z + l,

			x    , y    , z + l,
			x + w, y    , z + l,
			x    , y + h, z + l,

			x + w, y + h, z    ,
			x + w, y    , z    ,
			x    , y + h, z    ,

			x    , y    , z    ,
			x    , y + h, z    ,
			x + w, y    , z    
		]

		const normal = [

			1,     0,     0,
			1,     0,     0,
			1,     0,     0,

			1,     0,     0,
			1,     0,     0,
			1,     0,     0,

		   -1,     0,     0,
		   -1,     0,     0,
		   -1,     0,     0,

		   -1,     0,     0,
		   -1,     0,     0,
		   -1,     0,     0,

			0,     1,     0,
			0,     1,     0,
			0,     1,     0,

			0,     1,     0,
			0,     1,     0,
			0,     1,     0,

			0,    -1,     0,
			0,    -1,     0,
			0,    -1,     0,

			0,    -1,     0,
			0,    -1,     0,
			0,    -1,     0,

			0,     0,     1,
			0,     0,     1,
			0,     0,     1,

			0,     0,     1,
			0,     0,     1,
			0,     0,     1,

			0,     0,    -1,
			0,     0,    -1,
			0,     0,    -1,

			0,     0,    -1,
			0,     0,    -1,
			0,     0,    -1
		]

		const vao = this.gl.createVertexArray()

		this.gl.bindVertexArray(vao)

		this.setAttrib(program, "a_position", new Float32Array(position))
		this.setAttrib(program, "a_normal", new Float32Array(normal))

		this.gl.bindVertexArray(null)

		return () => {

			this.gl.bindVertexArray(vao)

			this.gl.drawArrays(this.gl.TRIANGLES, 0, 36)

			this.gl.bindVertexArray(null)
		}
	}
}