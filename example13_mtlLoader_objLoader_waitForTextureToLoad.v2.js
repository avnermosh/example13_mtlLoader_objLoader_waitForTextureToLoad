
import {Scene as THREE_Scene,
        OrthographicCamera as THREE_OrthographicCamera,
        AmbientLight as THREE_AmbientLight,
        LoadingManager as THREE_LoadingManager,
        DoubleSide as THREE_DoubleSide,
        Vector3 as THREE_Vector3,
        WebGLRenderer as THREE_WebGLRenderer
       } from './three.js/three.js-r120/build/three.module.js';

import { MTLLoader as THREE_MTLLoader } from "./example13_MTLLoader.js";
import { OBJLoader as THREE_OBJLoader } from "./example13_OBJLoader.js";



class Example13 {
    constructor(component){
        console.log('BEG Example13');
    };

    run = async function () {
        console.log('BEG run');

        var scene = new THREE_Scene();

        let width1 = 1000 / 2;
        let height1 = 1000 / 2;
        let left = -width1;
        let right = width1;
        let top = height1;
        let bottom = -height1;
        let near = 0.1;
        let far = 100000;
        var camera = new THREE_OrthographicCamera(left, right, top, bottom, near, far);
        var camera3DtopDownPosition0 = new THREE_Vector3(643, 2000, 603);
        camera.position.copy( camera3DtopDownPosition0 );
        camera.zoom = 0.42;
        camera.updateProjectionMatrix();
        camera.lookAt( scene.position );
        camera.updateMatrixWorld();

        scene.add(camera);

        let lightTopDown = new THREE_AmbientLight("#808080");
        scene.add(lightTopDown);
            

        // model
        var mesh = null;

        let loadingManager = new THREE_LoadingManager();
        loadingManager.setURLModifier( ( url ) => {
            let url0 = 'https://cdn.jsdelivr.net/gh/avnermosh/example13_mtlLoader_objLoader_waitForTextureToLoad' + '/' + url;
            // let url0 = 'http://127.0.0.1:8080' + '/' + url;
            return url0;
        } );
        
        var mtlLoader = new THREE_MTLLoader(loadingManager);
        mtlLoader.setMaterialOptions( {side: THREE_DoubleSide, needsUpdate: true} );

        mtlLoader.setPath( "./" );

        let mtlFilename = 'test2.mtl';
        await mtlLoader.loadAsync( mtlFilename ).then( onLoad_mtlLoader ).catch( ( err ) => {
            console.log('In catch block');
            console.error('err', err);
            console.error('Failed to load the material file: ', mtlFilename);
            // rethrow
            throw new Error('Error from mtlLoader.loadAsync()');

        });


        async function onLoad_mtlLoader( materials ) {

            await materials.preload();

            var objLoader = new THREE_OBJLoader(loadingManager);
            objLoader.setMaterials( materials );
        
            console.log('objLoader.materials.materials', objLoader.materials.materials);
            console.log('objLoader.materials.materials.test2', objLoader.materials.materials.test2);
            if(objLoader.materials.materials.test2)
            {
                console.log('objLoader.materials.materials.test2.map.image', objLoader.materials.materials.test2.map.image);
            }
        
            objLoader.setPath( "./" );

            let objFilename = 'test2.obj';
            let objInstance = await objLoader.loadAsync(objFilename);

            onLoad_FileObj_objLoader(objInstance);

            function onLoad_FileObj_objLoader( object ) {
                mesh = object;
                scene.add( mesh );
            };
        };

        var renderer = new THREE_WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(0xccccff);
        document.body.appendChild( renderer.domElement );

        let doRenderViaSingleRender = true;
        // doRenderViaSingleRender = false;
        if(doRenderViaSingleRender)
        {
            console.log('using renderer.render()');            
            renderer.render( scene, camera );
        }
        else
        {
            console.log('using animate()');            
            animate();
        }

        function animate() {
            requestAnimationFrame( animate );
            renderer.render( scene, camera );
        }
        
    };
    
};

export { Example13 };

let example13 = new Example13();
example13.run();



