import {
    Color,
    DefaultLoadingManager,
    FileLoader,
    FrontSide,
    Loader,
    LoaderUtils,
    MeshPhongMaterial,
    RepeatWrapping,
    TextureLoader,
    Vector2
} from './three.js/three.js-r120/build/three.module.js';

import { MLJ } from  "../mlj/MLJ.js";
import { ImageInfo } from  "../mlj/core/ImageInfo.js";
import "../mlj/util/Util.AssociativeArray.js";

/**
 * Loads a Wavefront .mtl file specifying materials
 */

var MTLLoader = function ( manager ) {

    Loader.call( this, manager );

};

MTLLoader.prototype = Object.assign( Object.create( Loader.prototype ), {

    constructor: MTLLoader,

    /**
     * Loads and parses a MTL asset from a URL.
     *
     * @param {String} url - URL to the MTL file.
     * @param {Function} [onLoad] - Callback invoked with the loaded object.
     * @param {Function} [onProgress] - Callback for download progress.
     * @param {Function} [onError] - Callback for download errors.
     *
     * @see setPath setResourcePath
     *
     * @note In order for relative texture references to resolve correctly
     * you must call setResourcePath() explicitly prior to load.
     */
    load: function ( url, onLoad, onProgress, onError ) {

        var scope = this;

        var path = ( this.path === '' ) ? LoaderUtils.extractUrlBase( url ) : this.path;

        var loader = new FileLoader( this.manager );
        loader.setPath( this.path );
        loader.setRequestHeader( this.requestHeader );
        loader.load( url, function ( text ) {

            try {

                onLoad( scope.parse( text, path ) );

            } catch ( e ) {

                if ( onError ) {

                    onError( e );

                } else {

                    console.error( e );

                }

                scope.manager.itemError( url );

            }

        }, onProgress, onError );

    },

    setMaterialOptions: function ( value ) {

        this.materialOptions = value;
        return this;

    },

    /**
     * Parses a MTL file.
     *
     * @param {String} text - Content of MTL file
     * @return {MTLLoader.MaterialCreator}
     *
     * @see setPath setResourcePath
     *
     * @note In order for relative texture references to resolve correctly
     * you must call setResourcePath() explicitly prior to parse.
     */
    parse: function ( text, path ) {

        var lines = text.split( '\n' );
        var info = {};
        var delimiter_pattern = /\s+/;
        var materialsInfo = {};

        for ( var i = 0; i < lines.length; i ++ ) {

            var line = lines[ i ];
            line = line.trim();

            if ( line.length === 0 || line.charAt( 0 ) === '#' ) {

                // Blank line or comment ignore
                continue;

            }

            var pos = line.indexOf( ' ' );

            var key = ( pos >= 0 ) ? line.substring( 0, pos ) : line;
            key = key.toLowerCase();

            var value = ( pos >= 0 ) ? line.substring( pos + 1 ) : '';
            value = value.trim();

            if ( key === 'newmtl' ) {

                // New material

                info = { name: value };
                materialsInfo[ value ] = info;

            } else {

                if ( key === 'ka' || key === 'kd' || key === 'ks' || key === 'ke' ) {

                    var ss = value.split( delimiter_pattern, 3 );
                    info[ key ] = [ parseFloat( ss[ 0 ] ), parseFloat( ss[ 1 ] ), parseFloat( ss[ 2 ] ) ];

                } else {

                    info[ key ] = value;

                }

            }

        }

        var materialCreator = new MTLLoader.MaterialCreator( this.resourcePath || path, this.materialOptions );
        materialCreator.setCrossOrigin( this.crossOrigin );
        materialCreator.setManager( this.manager );
        materialCreator.setMaterials( materialsInfo );
        return materialCreator;

    }

} );

/**
 * Create a new MTLLoader.MaterialCreator
 * @param baseUrl - Url relative to which textures are loaded
 * @param options - Set of options on how to construct the materials
 *                  side: Which side to apply the material
 *                        FrontSide (default), THREE.BackSide, THREE.DoubleSide
 *                  wrap: What type of wrapping to apply for textures
 *                        RepeatWrapping (default), THREE.ClampToEdgeWrapping, THREE.MirroredRepeatWrapping
 *                  normalizeRGB: RGBs need to be normalized to 0-1 from 0-255
 *                                Default: false, assumed to be already normalized
 *                  ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's
 *                                  Default: false
 * @constructor
 */

MTLLoader.MaterialCreator = function ( baseUrl, options ) {

    this.baseUrl = baseUrl || '';
    this.options = options;
    this.materialsInfo = {};
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};

    this.side = ( this.options && this.options.side ) ? this.options.side : FrontSide;
    this.wrap = ( this.options && this.options.wrap ) ? this.options.wrap : RepeatWrapping;

};

MTLLoader.MaterialCreator.prototype = {

    constructor: MTLLoader.MaterialCreator,

    crossOrigin: 'anonymous',

    setCrossOrigin: function ( value ) {

        this.crossOrigin = value;
        return this;

    },

    setManager: function ( value ) {

        this.manager = value;

    },

    setMaterials: function ( materialsInfo ) {

        this.materialsInfo = this.convert( materialsInfo );
        this.materials = {};
        this.materialsArray = [];
        this.nameLookup = {};

    },

    convert: function ( materialsInfo ) {

        if ( ! this.options ) return materialsInfo;

        var converted = {};

        for ( var mn in materialsInfo ) {

            // Convert materials info into normalized form based on options

            var mat = materialsInfo[ mn ];

            var covmat = {};

            converted[ mn ] = covmat;

            for ( var prop in mat ) {

                var save = true;
                var value = mat[ prop ];
                var lprop = prop.toLowerCase();

                switch ( lprop ) {

                    case 'kd':
                    case 'ka':
                    case 'ks':

                        // Diffuse color (color under white light) using RGB values

                        if ( this.options && this.options.normalizeRGB ) {

                            value = [ value[ 0 ] / 255, value[ 1 ] / 255, value[ 2 ] / 255 ];

                        }

                        if ( this.options && this.options.ignoreZeroRGBs ) {

                            if ( value[ 0 ] === 0 && value[ 1 ] === 0 && value[ 2 ] === 0 ) {

                                // ignore

                                save = false;

                            }

                        }

                        break;

                    default:

                        break;

                }

                if ( save ) {

                    covmat[ lprop ] = value;

                }

            }

        }

        return converted;

    },

    preload: async function () {
        console.log('BEG MTLLoader::preload');
        
        // create an associative array: imageInfoVec
        // populate imageInfoVec (inside create() ) with the images that the .mtl file references.
        // Return imageInfoVec
        let imageInfoVec = new MLJ.util.AssociativeArray();

        for ( var materialName in this.materialsInfo ) {

            // this.create( mn );
            let material1 = await this.create( materialName, imageInfoVec );
        }
        return imageInfoVec;

    },

    getIndex: function ( materialName ) {

        return this.nameLookup[ materialName ];

    },

    getAsArray: function () {

        var index = 0;

        for ( var mn in this.materialsInfo ) {

            this.materialsArray[ index ] = this.create( mn );
            this.nameLookup[ mn ] = index;
            index ++;

        }

        return this.materialsArray;

    },

    // MTLLoader.MaterialCreator::create() is called
    // - from within MTLLoader.js - from (i.e. here) MTLLoader.MaterialCreator::preload(), which passes an empty imageInfoVec to be filled (in createMaterial_)
    // - from within OBJLoader.js - from OBJLoader::parse(), which does NOT pass imageInfoVec, but this.materials[ materialName ] is expected to be defined
    //   (because the material was preloaded), so we whould not have any problem...
    create: function ( materialName, imageInfoVec ) {
        let material1 = undefined;
        if ( this.materials[ materialName ] === undefined ) {
            // pass in imageInfoVec. It will be populated with the images that the .mtl file refers to
            // console.log('imageInfoVec.toString()333', imageInfoVec.toString());
            material1 = this.createMaterial_( materialName, imageInfoVec );
            // console.log('imageInfoVec.toString()444', imageInfoVec.toString());
            
        }
        else
        {
            material1 = this.materials[ materialName ];
        }
        
        // console.log('material1', material1);
        // console.log('material1.userData.imagesInfo.size()', material1.userData.imagesInfo.size()); 
        return material1;
        // return this.materials[ materialName ];
    },
    
    createMaterial_: async function ( materialName, imageInfoVec ) {

        // Create material
        var scope = this;
        var mat = this.materialsInfo[ materialName ];
        var params = {
            name: materialName,
            side: this.side,
            userData: {}
        };
        
        function resolveURL( baseUrl, url ) {

            if ( typeof url !== 'string' || url === '' )
                return '';

            // Absolute URL
            if ( /^https?:\/\//i.test( url ) ) return url;

            return baseUrl + url;

        }

        async function setMapForType( mapType, value ) {

            if ( params[ mapType ] ) return; // Keep the first encountered texture

            var texParams = scope.getTextureParams( value, params );
            // console.log('scope.baseUrl', scope.baseUrl); 

            // var map = scope.loadTexture( resolveURL( scope.baseUrl, texParams.url ) );
            var map = await scope.loadTexture( resolveURL( scope.baseUrl, texParams.url ) );

            map.repeat.copy( texParams.scale );
            map.offset.copy( texParams.offset );

            map.wrapS = scope.wrap;
            map.wrapT = scope.wrap;

            params[ mapType ] = map;
        }

        let imageFilenameArray = [];
        let imageOrientationArray = [];

        for ( var prop in mat ) {

            var value = mat[ prop ];
            var n;

            if ( value === '' ) continue;

            switch ( prop.toLowerCase() ) {

                    // Ns is material specular exponent

                case 'kd':

                    // Diffuse color (color under white light) using RGB values

                    params.color = new Color().fromArray( value );

                    break;

                case 'ks':

                    // Specular color (color when light is reflected from shiny surface) using RGB values
                    params.specular = new Color().fromArray( value );

                    break;

                case 'ke':

                    // Emissive using RGB values
                    params.emissive = new Color().fromArray( value );

                    break;

                case 'map_kd':

                    // Diffuse texture map
                    // await setMapForType( "map", value );
                    imageFilenameArray = value.split(" ");

                    break;

                case 'map_kd_orientation':
                    // Image orientation (e.g. landscape, portrait)
                    imageOrientationArray = value.split(" ");
                    break;

                case 'map_ks':

                    // Specular map

                    await setMapForType( "specularMap", value );

                    break;

                case 'map_ke':

                    // Emissive map

                    await setMapForType( "emissiveMap", value );

                    break;

                case 'norm':

                    await setMapForType( "normalMap", value );

                    break;

                case 'map_bump':
                case 'bump':

                    // Bump texture map

                    await setMapForType( "bumpMap", value );

                    break;

                case 'map_d':

                    // Alpha map

                    await setMapForType( "alphaMap", value );
                    params.transparent = true;

                    break;

                case 'ns':

                    // The specular exponent (defines the focus of the specular highlight)
                    // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.

                    params.shininess = parseFloat( value );

                    break;

                case 'd':
                    n = parseFloat( value );

                    if ( n < 1 ) {

                        params.opacity = n;
                        params.transparent = true;

                    }

                    break;

                case 'tr':
                    n = parseFloat( value );

                    if ( this.options && this.options.invertTrProperty ) n = 1 - n;

                    if ( n > 0 ) {

                        params.opacity = 1 - n;
                        params.transparent = true;

                    }

                    break;

                default:
                    break;

            }

        }

        if( imageFilenameArray.length !== imageOrientationArray.length )
        {
            console.error( 'The number of image file names  and image orientations differ. ' +
                           'imageFilenameArray: ' + imageFilenameArray +
                           ', imageOrientationArray: ' + imageOrientationArray );
        }
        else
        {
            params.userData.imagesInfo = new MLJ.util.AssociativeArray();

            for (let i=0; i<imageFilenameArray.length; i++) {
                let imageFilename = imageFilenameArray[i];
                let imageOrientation = imageOrientationArray[i];
                
                if(materialName === "ground_1")
                {
                    // call the setMapForType function that loads the texture
                    // only for images that relate to the plan map (i.e. xxx.structure.layerXX.mtl, indicated by material name "ground_1")
                    // setMapForType( "map", imageFilename );
                    await setMapForType( "map", imageFilename );
                }

                // console.log('imageFilename', imageFilename);

                // remove the prefix "./" before the file name if it exists
                // e.g. ./xxx -> xxx
                const regex2 = /\.\//gi;
                let imageFilename2 = imageFilename.replace(regex2, '');
                // console.log('imageFilename:', imageFilename);
                // console.log('imageFilename2:', imageFilename2);
                
                
                let imageInfo = new ImageInfo({filename: imageFilename2});
                params.userData.imagesInfo.set(imageFilename2, imageInfo);
                // add imageInfo to imageInfoVec  
                imageInfoVec.set(imageFilename2, imageInfo);
            }             
        }
        // console.log('params.userData.imagesInfo', params.userData.imagesInfo);
        
        this.materials[ materialName ] = new MeshPhongMaterial( params );
        return this.materials[ materialName ];
    },

    getTextureParams: function ( value, matParams ) {

        var texParams = {

            scale: new Vector2( 1, 1 ),
            offset: new Vector2( 0, 0 )

        };

        var items = value.split( /\s+/ );
        var pos;

        pos = items.indexOf( '-bm' );

        if ( pos >= 0 ) {

            matParams.bumpScale = parseFloat( items[ pos + 1 ] );
            items.splice( pos, 2 );

        }

        pos = items.indexOf( '-s' );

        if ( pos >= 0 ) {

            texParams.scale.set( parseFloat( items[ pos + 1 ] ), parseFloat( items[ pos + 2 ] ) );
            items.splice( pos, 4 ); // we expect 3 parameters here!

        }

        pos = items.indexOf( '-o' );

        if ( pos >= 0 ) {

            texParams.offset.set( parseFloat( items[ pos + 1 ] ), parseFloat( items[ pos + 2 ] ) );
            items.splice( pos, 4 ); // we expect 3 parameters here!

        }

        texParams.url = items.join( ' ' ).trim();
        return texParams;

    },

    loadTexture: async function ( url, mapping, onLoad, onProgress, onError ) {
        console.log('BEG loadTexture');
        
        var texture;
        var manager = ( this.manager !== undefined ) ? this.manager : DefaultLoadingManager;
        var loader = manager.getHandler( url );

        if ( loader === null ) {

            loader = new TextureLoader( manager );

        }

        if ( loader.setCrossOrigin ) loader.setCrossOrigin( this.crossOrigin );

        // texture = loader.load( url, onLoad, onProgress, onError );
        texture = await loader.loadAsync(url);

        if ( mapping !== undefined ) texture.mapping = mapping;

        return texture;

    }
    
};

export { MTLLoader };
