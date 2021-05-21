
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

			const regex = RegExp( `^${ key }.+`, "gm" );

			const lines = file.match( regex ) ?? [];
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

			const group   = [];

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

		const regex = /^[fgos(mtllib)(usemtl)].+/gm;

		const objectData = file.match( regex );

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
		// https://gist.github.com/szimek/763999

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

		const bytes = new Uint8Array( file );

		let byteOffset = 18 + bytes[ 0 ];

		const imageId  = bytes.slice( 18, byteOffset );

		const colorMap = (() => {

			const type       = bytes[ 1 ];

			const firstIndex = bytes[ 3 ] | bytes[ 4 ] << 8;
			const length     = bytes[ 5 ] | bytes[ 6 ] << 8;

			const bitDepth   = bytes[ 7 ];
		})();

		return (() => {

			const type = bytes[ 2 ];

			if ( !type ) return;

			const originX = bytes[ 8 ]  | bytes[ 9 ]  << 8;
			const originY = bytes[ 10 ] | bytes[ 11 ] << 8;

			const width   = bytes[ 12 ] | bytes[ 13 ] << 8;
			const height  = bytes[ 14 ] | bytes[ 15 ] << 8;

			const depth   = bytes[ 16 ];

			const descriptor = bytes[ 17 ];

			const byteSize = Math.ceil( depth / 8 );

			let index = width * height * 4;

			const data = new Uint8ClampedArray( index );

			let getPixelData;

			switch ( type & 7 ) {

				case 1:

					break;

				case 2:

					switch ( depth ) {

						case 15:

							getPixelData = pixel => {

								const pixel0 = pixel[ 0 ];
								const pixel1 = pixel[ 1 ];

								const red   = pixel1 >>> 2 & 0x1F;
								const green = ( pixel1 << 3 & 0x1C ) | ( pixel0 >>> 5 & 0x07 );
								const blue  = pixel0 & 0x1F;
								const alpha = 255;

								data[ index ]     = red   << 3 | red   >>> 2;
								data[ index + 1 ] = green << 3 | green >>> 2;
								data[ index + 2 ] = blue  << 3 | blue  >>> 2;
								data[ index + 3 ] = alpha;
							};

							break;

						case 16:

							getPixelData = pixel => { 

								const pixel0 = pixel[ 0 ];
								const pixel1 = pixel[ 1 ];

								const red   = pixel1 >>> 2 & 0x1F;
								const green = ( pixel1 << 3 & 0x1C ) | ( pixel0 >>> 5 & 0x07 );
								const blue  = pixel0 & 0x1F;
								const alpha = 255 * ( pixel1 >>> 7 & 1 );

								data[ index ]     = red   << 3 | red   >>> 2;
								data[ index + 1 ] = green << 3 | green >>> 2;
								data[ index + 2 ] = blue  << 3 | blue  >>> 2;
								data[ index + 3 ] = alpha;
							};

							break;

						case 24:

							getPixelData = pixel => {

								data[ index ] = pixel[ 2 ];
								data[ index + 1 ] = pixel[ 1 ];
								data[ index + 2 ] = pixel[ 0 ];
								data[ index + 3 ] = 255;
							};

							break;

						case 32:

							getPixelData = pixel => {

								data[ index ] = pixel[ 3 ];
								data[ index + 1 ] = pixel[ 2 ];
								data[ index + 2 ] = pixel[ 1 ];
								data[ index + 3 ] = pixel[ 0 ];
							};

							break;
					}

					break;
				
				case 2:

					break;
			}

			for( ; index -= 4; ) getPixelData( bytes.slice( byteOffset, byteOffset += byteSize ) );

			return {
				
				data,
				width,
				height
			};
		})();
	}
};