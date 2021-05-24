
/**
 * Ethan Kim
 * https://github.com/EthanKim8683
 */

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

		const vLines  = file.match( /^v.+/gm )  ?? [];
		const vtLines = file.match( /^vt.+/gm ) ?? [];
		const vnLines = file.match( /^vn.+/gm ) ?? [];

		const positions =  vLines.map( line => line.match( /[\d\.-]+/g ) );
		const texcoords = vtLines.map( line => line.match( /[\d\.-]+/g ) );
		const vnData    = vnLines.map( line => line.match( /[\d\.-]+/g ) );
		
		const vnLength = vnData.length;

		let smooth = false;

		let normals;

		let mapTriangle;
		let mapObject;

		if ( vnLength ) {

			normals = vnData;

			mapTriangle = ( vertex0, vertex1, vertex2 ) => [

				vertex0.split`/`,
				vertex1.split`/`,
				vertex2.split`/`
			];

			mapObject = texcoords.length ? 
			
			( object ) => {

				const length = object.length;

				let positionIndex = -3;
				let texcoordIndex = -2;
				let normalIndex   = -3;

				const length9 = length * 9;
				const length6 = length * 6;

				const thisPositions = new Float32Array( length9 );
				const thisTexcoords = new Float32Array( length6 );
				const thisNormals   = new Float32Array( length9 );

				object.forEach( triangle => {

					const vertex0 = triangle[ 0 ];
					const vertex1 = triangle[ 1 ];
					const vertex2 = triangle[ 2 ];

					thisPositions.set( positions[ vertex0[ 0 ] - 1 ], positionIndex += 3 );
					thisPositions.set( positions[ vertex1[ 0 ] - 1 ], positionIndex += 3 );
					thisPositions.set( positions[ vertex2[ 0 ] - 1 ], positionIndex += 3 );

					thisTexcoords.set( texcoords[ vertex0[ 1 ] - 1 ], texcoordIndex += 2 );
					thisTexcoords.set( texcoords[ vertex1[ 1 ] - 1 ], texcoordIndex += 2 );
					thisTexcoords.set( texcoords[ vertex2[ 1 ] - 1 ], texcoordIndex += 2 );

					thisNormals.set( normals[ vertex0[ 2 ] - 1 ], normalIndex += 3 );
					thisNormals.set( normals[ vertex1[ 2 ] - 1 ], normalIndex += 3 );
					thisNormals.set( normals[ vertex2[ 2 ] - 1 ], normalIndex += 3 );
				});

				return {

					positions: thisPositions,
					texcoords: thisTexcoords,
					normals  : thisNormals,
					material : object.material
				};
			} :
			
			( object ) => {

				const length = object.length * 9;

				let positionIndex = -3;
				let normalIndex   = -3;

				const thisPositions = new Float32Array( length );
				const thisNormals   = new Float32Array( length );

				object.forEach( triangle => {

					const vertex0 = triangle[ 0 ];
					const vertex1 = triangle[ 1 ];
					const vertex2 = triangle[ 2 ];

					thisPositions.set( positions[ vertex0[ 0 ] - 1 ], positionIndex += 3 );
					thisPositions.set( positions[ vertex1[ 0 ] - 1 ], positionIndex += 3 );
					thisPositions.set( positions[ vertex2[ 0 ] - 1 ], positionIndex += 3 );

					thisNormals.set( normals[ vertex0[ 2 ] - 1 ], normalIndex += 3 );
					thisNormals.set( normals[ vertex1[ 2 ] - 1 ], normalIndex += 3 );
					thisNormals.set( normals[ vertex2[ 2 ] - 1 ], normalIndex += 3 );
				});

				return {

					positions: thisPositions,
					normals  : thisNormals,
					material : object.material
				};
			};
		} else {

			normals = new Array( positions.length ).fill().map( () => [ [ 0, 0, 0 ] ] );

			mapTriangle = ( vertex0, vertex1, vertex2 ) => {

				vertex0 = vertex0.split`/`;
				vertex1 = vertex1.split`/`;
				vertex2 = vertex2.split`/`;

				const index0 = vertex0[ 0 ] - 1;
				const index1 = vertex1[ 0 ] - 1;
				const index2 = vertex2[ 0 ] - 1;

				const position0 = positions[ index0 ];
				const position1 = positions[ index1 ];
				const position2 = positions[ index2 ];

				const position0x = position0[ 0 ];
				const position0y = position0[ 1 ];
				const position0z = position0[ 2 ];

				const position1x = position1[ 0 ];
				const position1y = position1[ 1 ];
				const position1z = position1[ 2 ];

				const position2x = position2[ 0 ];
				const position2y = position2[ 1 ];
				const position2z = position2[ 2 ];

				const edge0x = position0x - position1x;
				const edge0y = position0y - position1y;
				const edge0z = position0z - position1z;

				const edge1x = position0x - position2x;
				const edge1y = position0y - position2y;
				const edge1z = position0z - position2z;

				let crossProductX = edge0y * edge1z - edge0z * edge1y;
				let crossProductY = edge0z * edge1x - edge0x * edge1z;
				let crossProductZ = edge0x * edge1y - edge0y * edge1x;

				if ( smooth ) {

					const normal0 = normals[ index0 ][ 0 ];
					const normal1 = normals[ index1 ][ 0 ];
					const normal2 = normals[ index2 ][ 0 ];

					normal0[ 0 ] += crossProductX;
					normal0[ 1 ] += crossProductY;
					normal0[ 2 ] += crossProductZ;

					normal1[ 0 ] += crossProductX;
					normal1[ 1 ] += crossProductY;
					normal1[ 2 ] += crossProductZ;

					normal2[ 0 ] += crossProductX;
					normal2[ 1 ] += crossProductY;
					normal2[ 2 ] += crossProductZ;
				} else {

					const inverseHypotenuse = 1 / Math.sqrt(

						crossProductX * crossProductX +
						crossProductY * crossProductY +
						crossProductZ * crossProductZ
					);

					const normal = [

						crossProductX * inverseHypotenuse,
						crossProductY * inverseHypotenuse,
						crossProductZ * inverseHypotenuse
					];

					normals[ index0 ].push( normal );
					normals[ index1 ].push( normal );
					normals[ index2 ].push( normal );
				}

				return [

					position0x, position0y, position0z,
					position1x, position1y, position1z,
					position2x, position2y, position2z,

					vertex0[ 1 ] - 1,
					vertex1[ 1 ] - 1,
					vertex2[ 1 ] - 1,

					index0,
					index1,
					index2
				];
			};

			mapObject = texcoords.length ? 

			( object ) => {

				const smooth = object.smooth;
				const length = object.length;

				let positionIndex = -9;
				let texcoordIndex = -2;
				let normalIndex   = -3;

				const length9 = length * 9;
				const length6 = length * 6;

				const thisPositions = new Float32Array( length9 );
				const thisTexcoords = new Float32Array( length6 );
				const thisNormals   = new Float32Array( length9 );

				const addNormals = smooth ? ( index0, index1, index2 ) => {

					thisNormals.set( normals[ index0 ][ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index1 ][ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index2 ][ 0 ], normalIndex += 3 );
				} : ( index0, index1, index2 ) => {

					thisNormals.set( normals[ index0 ].splice( 1, 1 )[ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index1 ].splice( 1, 1 )[ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index2 ].splice( 1, 1 )[ 0 ], normalIndex += 3 );
				};

				object.forEach( data => {

					thisPositions.set( data.splice( 0, 9 ), positionIndex += 9 );

					thisTexcoords.set( texcoords[ data[ 0 ] ], texcoordIndex += 2 );
					thisTexcoords.set( texcoords[ data[ 1 ] ], texcoordIndex += 2 );
					thisTexcoords.set( texcoords[ data[ 2 ] ], texcoordIndex += 2 );

					addNormals( data[ 3 ], data[ 4 ], data[ 5 ] );
				});

				return {

					positions: thisPositions,
					texcoords: thisTexcoords,
					normals  : thisNormals,
					material : object.material
				};
			} :

			( object ) => {

				const smooth = object.smooth;
				const length = object.length * 9;

				let positionIndex = -9;
				let normalIndex   = -3;

				const thisPositions = new Float32Array( length );
				const thisNormals   = new Float32Array( length );

				const addNormals = smooth ? ( index0, index1, index2 ) => {

					thisNormals.set( normals[ index0 ][ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index1 ][ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index2 ][ 0 ], normalIndex += 3 );
				} : ( index0, index1, index2 ) => {

					thisNormals.set( normals[ index0 ].splice( 1, 1 )[ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index1 ].splice( 1, 1 )[ 0 ], normalIndex += 3 );
					thisNormals.set( normals[ index2 ].splice( 1, 1 )[ 0 ], normalIndex += 3 );
				};

				object.forEach( data => {

					thisPositions.set( data.splice( 0, 9 ), positionIndex += 9 );

					addNormals( data[ 3 ], data[ 4 ], data[ 5 ] );
				});

				return {

					positions: thisPositions,
					normals  : thisNormals,
					material : object.material
				};
			};
		}

		const objectGroups = [];
		const libraries    = {};

		let thisObjectGroup;
		let thisObject;

		let thisObjectGroupEmpty;
		let thisObjectEmpty;

		const newFace = data => {

			let length = data.length;

			const vertex0 = data[ 0 ];
			let vertex2 = data[ --length ];

			for ( ; --length; ) {

				const vertex1 = data[ length ];

				thisObject.push( mapTriangle( vertex0, vertex1, vertex2 ) );

				vertex2 = vertex1;
			}

			thisObjectEmpty      = false;
			thisObjectGroupEmpty = false;
		};

		const newObject = () => {

			let smooth = false;
			let material;

			if ( thisObject ) {

				smooth   = thisObject.smooth;
				material = thisObject.material;

				if ( thisObjectEmpty ) {
					
					thisObjectGroup.splice( -1, 1 );
				}
			}

			const object = [];

			object.material = material;
			object.smooth   = smooth;

			thisObjectGroup.push( object );

			thisObject = object;
			thisObjectEmpty = true;
		};

		const newObjectGroup = library => {

			if ( thisObjectGroup && thisObjectGroupEmpty ) {
				
				objectGroups.splice( -1, 1 );
			}

			const group = [];

			group.library = library;

			objectGroups.push( group );

			thisObjectGroup = group;
			
			thisObjectGroupEmpty = true;

			newObject();
		};

		const setSmooth = setting => {

			newObject();

			setting = setting[ 0 ];

			setting = !( setting === "off" || setting === "0" );

			smooth = setting;

			thisObject.smooth = setting;
		};

		const materialLibrary = async library => {

			library = library.join` `.trim().replace(/^\.\//, "");

			libraries[ library ] = await this.parseMtl( library, path );

			newObjectGroup( library );
		};

		const useMaterial = material => {

			newObject();

			thisObject.material = material.join` `.trim();
		};

		newObjectGroup( "none" );

		const objectData = file.match( /^[fgos(mtllib)(usemtl)].+/gm );

		for ( const line of objectData ) {

			const data = line.split` `;
			const type = data.splice( 0, 1 )[ 0 ];

			switch ( type ) {

				case "f"     : newFace( data );               break;

				case "g"     : newObject();                   break;

				case "o"     : newObject();                   break;

				case "s"     : setSmooth( data );             break;

				case "mtllib": await materialLibrary( data ); break;

				case "usemtl": useMaterial( data );           break;
			}
		}

		if ( !vnLength ) {

			normals = normals.map( normal => {

				const smoothNormal = normal[ 0 ];

				const normalX = smoothNormal[ 0 ];
				const normalY = smoothNormal[ 1 ];
				const normalZ = smoothNormal[ 2 ];

				const inverseHypotenuse = 1 / Math.sqrt(

					normalX * normalX +
					normalY * normalY +
					normalZ * normalZ
				);

				normal[ 0 ] = [

					normalX * inverseHypotenuse,
					normalY * inverseHypotenuse,
					normalZ * inverseHypotenuse
				];

				return normal;
			});
		}

		return {
			
			groups: objectGroups.map( objectGroup => {

				return {

					geometry: objectGroup.map( mapObject ),
					library: objectGroup.library
				};
			}),

			libraries
		};
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

		const materialData = ( file + "EOF" ).match( /(?=^newmtl)[\S\s]+?(?=^newmtl|\nEOF)/gm );

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

				"illum" : undefined,

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

			const length = width * height;

			const dataLength = length << 2;

			const width4 = width << 2;

			const data = new Uint8ClampedArray( dataLength );

			let getRGBA;

			switch ( type & 7 ) {

				case 1:

					let getIndex;

					if ( depth > 8 ) {

						getIndex = bytes => bytes[ 0 ] | bytes[ 1 ] << 8;
					} else {

						getIndex = bytes => bytes[ 0 ];
					}

					getRGBA = bytes => {

						const colorIndex = getIndex( bytes );

						return colorMap[ colorIndex ];
					}

					break;
				
				case 2:

					const colorGetter = createColorGetter( depth );

					getRGBA = colorGetter;

					break;

				case 3:

					getRGBA = bytes => {
						
						const color = bytes[ 0 ];

						return color << 24 | color << 16 | color << 8 | 255;
					};

					break;
			}

			if ( type & 8 ) {

				let index = dataLength - 4;

				while ( index > -4 ) {

					const type = bytes[ byteOffset++ ];
					let count  = ( type & 127 ) + 1;

					if ( type & 128 ) {

						const color = getRGBA( bytes.slice( byteOffset, byteOffset += byteSize ) );

						const red   = color >>> 24;
						const green = color >>> 16 & 255;
						const blue  = color >>> 8  & 255;
						const alpha = color        & 255;

						for ( ; count--; index -= 4 ) {

							data[ index + 3 ] = red;
							data[ index + 2 ] = green;
							data[ index + 1 ] = blue;
							data[ index ]     = alpha;
						}
					} else {

						for ( ; count--; index -= 4 ) {

							const color = getRGBA( bytes.slice( byteOffset, byteOffset += byteSize ) );

							data[ index + 3 ] = color >>> 24;
							data[ index + 2 ] = color >>> 16 & 255;
							data[ index + 1 ] = color >>> 8  & 255;
							data[ index ]     = color        & 255;
						}
					}
				}

				let offset = 0;
				let indexY = 0;

				for ( let y = height; y--; indexY += width4 ) {

					const row = data.slice( offset, offset += width4 );

					data.set( row.reverse(), indexY );
				}
			} else {

				let indexY = dataLength;

				for ( let y = height; y--; indexY -= width4 ) {

					let index = indexY;

					for ( let x = width; x--; index += 4 ) {

						const color = getRGBA( bytes.slice( byteOffset, byteOffset += byteSize ) );
						
						data[ index ]     = color >>> 24;
						data[ index + 1 ] = color >>> 16 & 255;
						data[ index + 2 ] = color >>> 8  & 255;
						data[ index + 3 ] = color        & 255;
					}
				}
			}

			return {
				
				data,
				width,
				height
			};
		})();
	}

	async parsePly ( plyFile, path = "./Imports/" ) {

		// https://en.wikipedia.org/wiki/PLY_(file_format)

		plyFile = path + plyFile;

		let ok;

		const file = await fetch( plyFile ).then( i => {

			ok = i.ok;
			
			return i.text();
		});

		if ( !ok ) {

			console.log( "Failed to fetch .ply file: " + plyFile );

			return;
		}

		const header = file.match( /(?<=^ply\n)[\S\s]+?(?=\nend_header)/gm );
	}

	async parseHdr ( hdrFile, path = "./Imports/" ) {

		// https://en.wikipedia.org/wiki/Radiance_(software)#HDR_image_format
		// http://paulbourke.net/dataformats/pic/
		// https://programmersought.com/article/56978111948/

		hdrFile = path + hdrFile;

		let ok;

		const file = await fetch( hdrFile ).then( i => {
			
			ok = i.ok 

			return i.arrayBuffer();
		});

		if ( !ok ) {

			console.log( "Failed to fetch .hdr file: " + hdrFile );

			return;
		}

		let bytes = new Uint8Array( file );

		let byteOffset = 0;
		let header = "";

		let char;
		let stage = 0;

		do {

			char = String.fromCharCode( bytes[ byteOffset++ ] );

			header += char;

			stage += stage ? char === "\n" : char === "X";
		} while ( stage < 2 );

		const gamma     = ( header.match( /(?<=^GAMMA=).+/gm ) ?? [ 1 ] )[ 0 ];
		const primaries = header.match( /(?<=^PRIMARIES=).+/gm );
		const format    = header.match( /(?<=^FORMAT=).+/gm )[ 0 ];
		const height    = header.match( /(?<=Y ).+?(?= )/gm )[ 0 ];
		const width     = header.match( /(?<=X ).+?(?= |\n)/gm )[ 0 ];

		bytes = bytes.slice( byteOffset );

		console.log( format );

		const getRGB = ( bytes ) => {

			const e = bytes[ 3 ];

			if ( e === 0 ) {

				return [ 0, 0, 0 ];
			}

			const f = 2 ** ( e - 136 );

			return [

				bytes[ 0 ] * f,
				bytes[ 1 ] * f,
				bytes[ 2 ] * f 
			];
		};

		let off = 1;

		console.log( getRGB( bytes.slice( off, off + 4 ) ) );
	}
};