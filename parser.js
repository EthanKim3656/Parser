
export default class Parser {

	async parseObj ( objFile, path = "./Imports/" ) {

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

			"v": [],
			"vt": [],
			"vn": []
		};

		for ( const key in attributes ) {

			const regex = RegExp( `^${ key }.+`, "gm" );

			const lines = file.match( regex ) ?? [];
			const data = lines.join``.match( /[\d\.]+/g );
			
			attributes[ key ] = data;
		}

		const objectGroups = [];
		const libraries = {};

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

			name = name.join` `.trim();

			const material = ( thisMaterialGroup ?? {} ).material;
			const smooth = ( thisObject ?? {} ).smooth;

			const group = [];

			group.material = material;

			const object = [ group ];

			object.name = name;
			object.smooth = smooth;

			thisObjectGroup.push( object );

			thisMaterialGroup = group;
			thisObject = object;
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

		const regex = /^[fgos(mtllib)(usemtl)].+/gm;

		const objectData = file.match( regex );

		for ( const line of objectData ) {

			const data = line.split` `;
			const type = data.splice( 0, 1 )[ 0 ];

			switch ( type ) {

				case "f": newFace( data ); break;

				case "g": newObject( data ); break;

				case "o": newObject( data ); break;

				case "s": setSmooth( data ); break;

				case "mtllib": await materialLibrary( data ); break;

				case "usemtl": useMaterial( data ); break;
			}
		}

		console.log(objectGroups);
	}

	async parseMtl ( mtlFile, path = "./Imports/" ) {

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
			
				"Ka": undefined,
				"Kd": undefined,
				"Ks": undefined,
				"Ns": undefined,

				"Tr": undefined,
				"d": undefined,

				"Tf": undefined,
				"Ni": undefined,

				"map_Ka": undefined,
				"map_Kd": undefined,
				"map_Ks": undefined,
				"map_Ns": undefined,

				"map_d": undefined
			};

			for ( const key in properties ) {

				const regex = RegExp( `(?<=^${ key }).+`, "gm" );

				const lines = material.match( regex ) ?? [];
				const data = lines.join``.match( /[\w\d\.]+/g );
				
				properties[ key ] = data;
			}

			materials[ name ] = properties;
		});

		return materials;
	}
};