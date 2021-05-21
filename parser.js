
export default class Parser {

	async parseObj ( objFile, path = "./Imports/" ) {

		// https://en.wikipedia.org/wiki/Wavefront_.obj_file

		objFile = path + objFile;

		let ok;

		const file = await fetch( objFile ).then( i => {

			ok = i.ok;
			
			return i.text();
		});

		if ( !ok ) {

			console.log( "Failed to fetch .obj file: " + objFile );

			return;
		}

		const attributes = {

			"v" : [],
			"vt": [],
			"vn": []
		};

		for ( const key in attributes ) {

			const lines = file.match( RegExp( `^${ key }.+`, "gm" ) ) ?? [];
			const data  = lines.join``.match( /[\d\.]+/g );
			
			attributes[ key ] = data;
		}

		const objectGroups = [];
		const libraries    = {};

		let thisObjectGroup;
		let thisObject;
		let thisMaterialGroup;

		const newFace = data => {

			let length = data.length;

			const triangles = [];

			if ( length > 3 ) {

				const index0 = data[0];

				for ( length += 1; --length; ) {

					const index1 = data[ length ];
					const index2 = data[ length + 1 ];

					triangles.push( [ index0, index1, index2 ] );
				}
			} else {

				triangles.push( data );
			}

			thisMaterialGroup.push( ...triangles );
		};

		const newObject = name => {

			name           = name.join` `.trim();

			const material = ( thisMaterialGroup ?? {} ).material;
			const smooth   = ( thisObject ?? {} ).smooth;

			const group    = [];

			group.material = material;

			const object   = [ group ];

			object.name    = name;
			object.smooth  = smooth;

			thisObjectGroup.push( object );

			thisMaterialGroup = group;
			thisObject        = object;
		};

		const newObjectGroup = library => {

			const group = [];

			group.library = library;

			objectGroups.push( group );

			thisObjectGroup = group;

			newObject( [ "Object_0" ] );
		};

		const setSmooth = setting => {

			setting = setting[ 0 ];

			thisObject.smooth = !( setting === "off" || setting === "0" );
		};

		const materialLibrary = async library => {

			library = library.join` `.trim();

			libraries[ library ] = await this.parseMtl( library, path );

			newObjectGroup( library );
		};

		const useMaterial = material => {

			material = material.join` `.trim();

			const group = [];

			group.material = material;

			thisObject.push ( group );

			thisMaterialGroup = group;
		};

		newObjectGroup( "Library_0" );

		const objectData = file.match( /^[fgos(mtllib)(usemtl)].+/gm );

		for ( const line of objectData ) {

			const data = line.split` `;
			const type = data.splice( 0, 1 )[ 0 ];

			switch ( type ) {

				case "f"     : newFace( data );               break;

				case "g"     : newObject( data );             break;

				case "o"     : newObject( data );             break;

				case "s"     : setSmooth( data );             break;

				case "mtllib": await materialLibrary( data ); break;

				case "usemtl": useMaterial( data );           break;
			}
		}

		console.log(objectGroups);
	}

	async parseMtl ( mtlFile, path = "./Imports/" ) {

		// https://en.wikipedia.org/wiki/Wavefront_.obj_file

		mtlFile = path + mtlFile;

		let ok;

		const file = await fetch( mtlFile ).then( i => {

			ok = i.ok;
			
			return i.text();
		});

		if ( !ok ) {

			console.log( "Failed to fetch .mtl file: " + mtlFile );

			return;
		}

		const materialData = file.match( /(?=^newmtl)[\w\W\s\d\n]+?(?=^newmtl)/gm );

		const materials = {};

		materialData.forEach( material => {

			const name = material.match( /(?<=newmtl).+/gm );

			const properties = {
			
				"Ka"    : undefined,
				"Kd"    : undefined,
				"Ks"    : undefined,
				"Ns"    : undefined,

				"Tr"    : undefined,
				"d"     : undefined,

				"Tf"    : undefined,
				"Ni"    : undefined,

				"map_Ka": undefined,
				"map_Kd": undefined,
				"map_Ks": undefined,
				"map_Ns": undefined,

				"map_d" : undefined
			};

			for ( const key in properties ) {

				const regex = RegExp( `(?<=^${ key }).+`, "gm" );

				const lines = material.match( regex ) ?? [];
				const data  = lines.join``.match( /[\w\d\.]+/g );
				
				properties[ key ] = data;
			}

			materials[ name ] = properties;
		});

		return materials;
	}

	async parseTga ( tgaFile, path = "./Imports/" ) {

		// https://www.ryanjuckett.com/parsing-colors-in-a-tga-file/
		// https://en.wikipedia.org/wiki/Truevision_TGA
		// http://tfc.duke.free.fr/coding/tga_specs.pdf
		// https://github.com/vthibault/roBrowser/blob/master/src/Loaders/Targa.js

		tgaFile = path + tgaFile;

		let ok;

		const file = await fetch( tgaFile ).then( i => {

			ok = i.ok;
			
			return i.arrayBuffer();
		});

		if ( !ok ) {

			console.log( "Failed to fetch .tga file: " + tgaFile );

			return;
		}

		let bytes = new Uint8Array( file );

		let byteOffset = 18 + bytes[ 0 ];

		const createColorGetter = ( depth ) => {

			let colorGetter;

			switch ( depth ) {

				case 15:

					colorGetter = bytes => {

						const byte0 = bytes[ 0 ];
						const byte1 = bytes[ 1 ];

						let red   = byte1 >>> 2 & 0x1F;
						let green = ( byte1 << 3 & 0x1C ) | ( byte0 >>> 5 & 0x07 );
						let blue  = byte0 & 0x1F;

						red   = red   << 3 | red   >>> 2;
						green = green << 3 | green >>> 2;
						blue  = blue  << 3 | blue  >>> 2;

						return red << 24 | green << 16 | blue << 8 | 255;
					};

					break;

				case 16:

					colorGetter = bytes => {

						const byte0 = bytes[ 0 ];
						const byte1 = bytes[ 1 ];

						let red   = byte1 >>> 2 & 0x1F;
						let green = ( byte1 << 3 & 0x1C ) | ( byte0 >>> 5 & 0x07 );
						let blue  = byte0 & 0x1F;
						const alpha = 255 * ( byte1 >>> 7 & 1 );

						red   = red   << 3 | red   >>> 2;
						green = green << 3 | green >>> 2;
						blue  = blue  << 3 | blue  >>> 2;

						return red << 24 | green << 16 | blue << 8 | alpha;
					};

					break;

				case 24:

					colorGetter = bytes => {

						return bytes[ 2 ] << 24 | bytes[ 1 ] << 16 | bytes[ 0 ] << 8 | 255;
					};

					break;

				case 32:

					colorGetter = bytes => {

						return bytes[ 3 ] << 24 | bytes[ 2 ] << 16 | bytes[ 1 ] << 8 | bytes[ 0 ];
					};

					break;
			}

			return colorGetter;
		};

		const colorMap = (() => {

			const type = bytes[ 1 ];

			if ( !type ) return;

			const firstIndex = bytes[ 3 ] | bytes[ 4 ] << 8;
			const length     = bytes[ 5 ] | bytes[ 6 ] << 8;
			const depth      = bytes[ 7 ];

			const byteSize = Math.ceil( depth / 8 );

			byteOffset += byteSize * firstIndex;

			const colorGetter = createColorGetter( depth );

			const dataLength = length - firstIndex;

			const data = new Uint32Array( dataLength );

			for ( let index = 0; index < dataLength; index++ ) {
				
				const color = colorGetter( bytes.slice( byteOffset, byteOffset += byteSize ) );

				data[ index ] = color;
			}

			return data;
		})();

		return (() => {

			const type = bytes[ 2 ];

			if ( !type ) return;

			const originX    = bytes[ 8 ]  | bytes[ 9 ]  << 8;
			const originY    = bytes[ 10 ] | bytes[ 11 ] << 8;
			const width      = bytes[ 12 ] | bytes[ 13 ] << 8;
			const height     = bytes[ 14 ] | bytes[ 15 ] << 8;
			const depth      = bytes[ 16 ];
			const descriptor = bytes[ 17 ];

			const byteSize = Math.ceil( depth / 8 );

			const width4 = width << 2;

			const length = width * height;

			const dataLength = length << 2;

			let indexY = dataLength;

			const data = new Uint8ClampedArray( dataLength );

			if ( type & 8 ) {

				const byteLength = length * byteSize;

				const compressed = bytes.slice( byteOffset );
				const decompressed = new Uint8Array( byteLength );

				let index0 = 0;
				let index1 = 0;

				while ( index1 < byteLength ) {

					const type = compressed[ index0++ ];
					let count  = ( type & 127 ) + 1;

					if ( type & 128 ) {

						const bytes = compressed.slice( index0, index0 += byteSize );

						for ( ; count--; ) {

							decompressed.set( bytes, index1);

							index1 += byteSize;
						}
					} else {

						count *= byteSize;

						const bytes = compressed.slice( index0, index0 += count );

						decompressed.set( bytes, index1);

						index1 += count;
					}
				}

				bytes = decompressed;
				byteOffset = 0;
			}

			switch ( type & 7 ) {

				case 1:

					let getIndex;

					if ( depth > 8 ) {

						getIndex = bytes => {

							return bytes[ 0 ] | bytes[ 1 ] << 8;
						};
					} else {

						getIndex = bytes => {

							return bytes[ 0 ];
						};
					}

					for ( let y = height; y--; ) {

						let index = indexY;

						for ( let x = width; x--; ) {

							const colorIndex = getIndex( bytes.slice( byteOffset, byteOffset += byteSize ) );
							const color = colorMap[ colorIndex ];

							data[ index ]     = color >>> 24;
							data[ index + 1 ] = color >>> 16 & 255;
							data[ index + 2 ] = color >>> 8  & 255;
							data[ index + 3 ] = color        & 255;

							index += 4;
						}

						indexY -= width4;
					}

					break;
				
				case 2:

					const colorGetter = createColorGetter( depth );

					for ( let y = height; y--; ) {

						let index = indexY;

						for ( let x = width; x--; ) {

							const color = colorGetter( bytes.slice( byteOffset, byteOffset += byteSize ) );

							data[ index ]     = color >>> 24;
							data[ index + 1 ] = color >>> 16 & 255;
							data[ index + 2 ] = color >>> 8  & 255;
							data[ index + 3 ] = color        & 255;

							index += 4;
						}

						indexY -= width4;
					}

					break;

				case 3:

					for ( let y = height; y--; ) {

						let index = indexY;

						for ( let x = width; x--; ) {

							const color = bytes.slice( byteOffset, byteOffset += byteSize )[ 0 ];

							data[ index ]     = color;
							data[ index + 1 ] = color;
							data[ index + 2 ] = color;
							data[ index + 3 ] = color;

							index += 4;
						}

						indexY -= width4;
					}

					break;
			}

			return {
				
				data,
				width,
				height
			};
		})();
	}

	async parsePly ( plyFile, path = "./Imports/" ) {


	}
};