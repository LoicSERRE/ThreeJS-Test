import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DDSLoader } from 'three/addons/loaders/DDSLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import Stats from 'three/addons/libs/stats.module.js';

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaddff);

var camera = new THREE.PerspectiveCamera(45,
    window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.set(0, 50, 50);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 10, 0);

// plane helper de 200 par 200
var planeHelper = new THREE.GridHelper(200, 200);
scene.add(planeHelper);

let relief;

await fetch('terrain.json')
    .then(response => response.json())
    .then(data => {
        relief = data;
    })
    .catch(error => {
        console.error('Error loading JSON file:', error);
    }
);

// Création du terrain
const worldWidth = relief.dimx, worldDepth = relief.dimz;
const altitudes = relief.altitudes;
const geometry = new THREE.PlaneGeometry(200, 200, worldWidth - 1, worldDepth - 1);
geometry.rotateX(- Math.PI / 2);
geometry.computeVertexNormals();

const vertices = geometry.attributes.position.array;

for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = altitudes[i];
}

const material = new THREE.MeshLambertMaterial({ color: 0x909090, side: THREE.DoubleSide });
const plane = new THREE.Mesh(geometry, material);
plane.receiveShadow = true; // Enable shadow casting on the plane
scene.add(plane);

// Texturer le plane avec l'image sable.jpg que je repète 10 fois sur les deux axes
let sable = new THREE.TextureLoader().load('sable.jpg');
sable.wrapS = THREE.RepeatWrapping;
sable.wrapT = THREE.RepeatWrapping;
sable.repeat.set(10, 10);
let materialsable = new THREE.MeshLambertMaterial({ map: sable, side: THREE.DoubleSide });
let mesh = new THREE.Mesh(geometry, materialsable);
mesh.receiveShadow = true; // Enable shadow casting on the mesh
scene.add(mesh);

// Ajouter une lumière embiante de couleur 0x5555555
const ambientLight = new THREE.AmbientLight(0x555555, 1);
scene.add(ambientLight);

// Ajouter une lumière directionelle de couleurs 0x999999
const directionalLight = new THREE.DirectionalLight(0x999999, 1.0);
directionalLight.position.set(2, 50, 1);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
scene.add(directionalLight.target); 
scene.add(directionalLight);

// Ajouter une source de lumière ponctuelle en 0, 12, 0 de couleurs 0x999999 
const light = new THREE.PointLight(0x999999, 20, 10, 0.1);
light.position.set(0, 10, 0);
scene.add(light);

scene.background = new THREE.Color(0x016cb2);

scene.fog = new THREE.Fog(0x016cb2, 2, 120);

// Charger l'object tresor.obj et son material tresor.mtl
const mtlLoader = new MTLLoader();
mtlLoader.load('tresor/tresor.mtl', (materials) => {
    materials.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('tresor/tresor.obj', (object) => {
        object.position.x = 0;
        object.position.y = 9;
        object.position.z = 0;
        scene.add(object);
    });
});

function creation_algues(nb_algues, terrain) {
    const group = new THREE.Group();
    group.name = "algues";

    const mtlLoader = new MTLLoader();
    mtlLoader.load('algue/algue.mtl', (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);

        for (let i = 0; i < nb_algues; i++) {
            objLoader.load('algue/algue.obj', (object) => {
                const scale = Math.random() * 6 + 1;
                object.scale.set(scale, scale, scale);

                const position = getRandomPositionOnTerrain(terrain);
                object.position.copy(position);

                object.rotation.y = Math.random() * Math.PI * 2;

                let object2 = object.clone();
                object2.rotation.y = object.rotation.y + Math.PI / 2;
                object2.rotation.x = object.rotation.x;
                object2.rotation.z = object.rotation.z;

                group.add(object);
                group.add(object2);
            });
        }
    });

    scene.add(group);
}

function getRandomPositionOnTerrain(terrain) {
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, -1, 0);
    const origin = new THREE.Vector3(Math.random() * 200 - 100, 100, Math.random() * 200 - 100);

    raycaster.set(origin, direction);
    const intersects = raycaster.intersectObject(terrain);

    if (intersects.length > 0) {
        return intersects[0].point;
    }

    return new THREE.Vector3();
}

creation_algues(300, plane);

const stats = new Stats();
document.body.appendChild(stats.dom);

function creation_requins(nb_requins, rayon_min, rayon_max, hauteur_min, hauteur_max) {
    const group = new THREE.Group();
    group.name = "requins";

    const mtlLoader = new MTLLoader();
    mtlLoader.load('requin/requin.mtl', function (materials) {
        materials.preload();
        const objLoader = new OBJLoader();
        // Création d'un material pour chaque requin
        objLoader.setMaterials(materials);

        objLoader.load('requin/requin.obj', function (object) {
            for (let i = 0; i < nb_requins; i++) {
                const clonedObject = object.clone();

                const scale = Math.random() * 0.8 + 0.2;
                clonedObject.scale.set(scale, scale, scale);

                // Mettre la meme rotation que l'objet original
                clonedObject.rotation.copy(object.rotation);

                const clockwise = Math.random() < 0.5; // Choix aléatoire du sens
                
                const radius = Math.random() * (rayon_max - rayon_min) + rayon_min;
                const angle = Math.random() * Math.PI * 2;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                const y = Math.random() * (hauteur_max - hauteur_min) + hauteur_min;

                clonedObject.position.set(x, y, z);

                // Ajouter les informations de position, radius, hauteur, vitesse et sens aux requins
                const speed = Math.random() * 0.01 + 0.0002; // Vitesse aléatoire entre 0.1 et 0.6

                group.add(clonedObject);

                

                clonedObject.userData = {
                    position: clonedObject.position.clone(),
                    radius: radius,
                    hauteur: y,
                    vitesse: speed,
                    sens: clockwise
                };
            }
        });
    });

    scene.add(group);
}

var clock = new THREE.Clock();
var angle = 0;
var speed = 0.2;

function animateRequins() {
    const group = scene.getObjectByName("requins");
    const delta = clock.getDelta();

    for (let i = 0; i < group.children.length; i++) {
        const requin = group.children[i];

        angle += requin.userData.vitesse * delta;

        const direction = requin.userData.sens ? 1 : -1; // Sens horaire ou anti-horaire

        requin.position.x = requin.userData.position.x + direction * requin.userData.radius * Math.cos(angle);
        requin.position.z = requin.userData.position.z + direction * requin.userData.radius * Math.sin(angle);
        requin.rotation.y = -angle;
    }
}

creation_requins(30, 20, 60, 12, 30);

function animateAlgues() {
    const group = scene.getObjectByName("algues");
    const delta = clock.getDelta();

    for (let i = 0; i < group.children.length; i++) {
        const algue = group.children[i];
        algue.rotation.x = 0.1 * Math.cos(clock.elapsedTime);
    }
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'c') {
        const existingImg = document.querySelector('img');
        if (existingImg) {
            existingImg.remove();
        } else {
            const img = document.createElement('img');
            img.src = 'cockpit.png';
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.zIndex = '9999';
            img.style.pointerEvents = 'none'; // Pour continuer à utiliser les contrôles
            document.body.appendChild(img);
        }
    }
});

function animate() {
    stats.update();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animateRequins);
    requestAnimationFrame(animateAlgues);
    requestAnimationFrame(animate);
};
requestAnimationFrame(animate);
