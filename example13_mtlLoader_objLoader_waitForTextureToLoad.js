
import {Scene as THREE_Scene,
        PerspectiveCamera as THREE_PerspectiveCamera,
        DirectionalLight as THREE_DirectionalLight,
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

        var camera = new THREE_PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
        camera.position.z = 250;
        camera.lookAt( scene.position );

        var directionalLight = new THREE_DirectionalLight( 0xffeedd );
        directionalLight.position.set( 0, 0, 1 ).normalize();
        scene.add( directionalLight );

        // model
        var mesh = null;

        var mtlLoader = new THREE_MTLLoader();
        mtlLoader.setPath( "https://threejs.org/examples/models/obj/walt/" );

        let validUrl = 'WaltHead.mtl';

        await mtlLoader.loadAsync( validUrl ).then( onLoad_mtlLoader ).catch( ( err ) => {
            console.log('In catch block');
            console.error('err', err);
            console.error('Failed to load the material file: ', url);
            // rethrow
            throw new Error('Error from mtlLoader.loadAsync()');

        });


        async function onLoad_mtlLoader( materials ) {

            await materials.preload();

            var objLoader = new THREE_OBJLoader();
            objLoader.setMaterials( materials );
        
            // console.log('objLoader.materials.materials', objLoader.materials.materials);
            console.log('objLoader.materials.materials[lambert2SG.001].map', objLoader.materials.materials['lambert2SG.001'].map);
        
            objLoader.setPath( "https://threejs.org/examples/models/obj/walt/" );

            let objInstance = await objLoader.loadAsync('WaltHead.obj');

            console.log('objLoader.materials.materials[lambert2SG.001].map2', objLoader.materials.materials['lambert2SG.001'].map);

            onLoad_FileObj_objLoader(objInstance);

            function onLoad_FileObj_objLoader( object ) {
                mesh = object;
                mesh.position.y = -50;
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



