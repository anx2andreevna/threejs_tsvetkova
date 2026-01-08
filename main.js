import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(6, 5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(6, 10, 6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.set(-6, 4, -6);
scene.add(pointLight);

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/texture.jpg');

const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ map: texture })
);
box.position.y = 0.5;
box.castShadow = true;
scene.add(box);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
sphere.position.set(2.2, 0.55, 0);
sphere.castShadow = true;
scene.add(sphere);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.MeshStandardMaterial({ color: 0xd3d3d3 })
);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

const pyramid = new THREE.Mesh(
  new THREE.ConeGeometry(0.9, 1.6, 4),
  new THREE.MeshStandardMaterial({ color: 0x0077ff })
);
pyramid.position.set(-3.5, 0.8, 0);
pyramid.rotation.y = Math.PI / 4;
pyramid.castShadow = true;
scene.add(pyramid);


const sphereColorEl = document.getElementById('sphereColor');
const pyramidColorEl = document.getElementById('pyramidColor');
const planeColorEl = document.getElementById('planeColor');

sphereColorEl.addEventListener('input', (e) => {
  sphere.material.color.set(e.target.value);
});

pyramidColorEl.addEventListener('input', (e) => {
  pyramid.material.color.set(e.target.value);
});

planeColorEl.addEventListener('input', (e) => {
  plane.material.color.set(e.target.value);
});


const applyAllLightsEl = document.getElementById('applyAllLights');
const lightSelectEl = document.getElementById('lightSelect');
const lightIntensityEl = document.getElementById('lightIntensity');
const lightColorEl = document.getElementById('lightColor');

const lightsByKey = {
  ambient: ambientLight,
  directional: directionalLight,
  point: pointLight
};

applyAllLightsEl.addEventListener('change', () => {
  lightSelectEl.disabled = applyAllLightsEl.checked;
});

function setLightIntensity(light, value) {
  light.intensity = Number(value);
}

function setLightColor(light, value) {
  if (light.color) light.color.set(value);
}

lightIntensityEl.addEventListener('input', (e) => {
  const v = e.target.value;
  const applyAll = applyAllLightsEl.checked;

  if (applyAll) {
    for (const key of Object.keys(lightsByKey)) setLightIntensity(lightsByKey[key], v);
  } else {
    setLightIntensity(lightsByKey[lightSelectEl.value], v);
  }
});

lightColorEl.addEventListener('input', (e) => {
  const c = e.target.value;
  const applyAll = applyAllLightsEl.checked;

  if (applyAll) {
    for (const key of Object.keys(lightsByKey)) setLightColor(lightsByKey[key], c);
  } else {
    setLightColor(lightsByKey[lightSelectEl.value], c);
  }
});

/* При выборе источника значения в UI */
lightSelectEl.addEventListener('change', () => {
  const L = lightsByKey[lightSelectEl.value];
  lightIntensityEl.value = String(L.intensity);
  if (L.color) lightColorEl.value = `#${L.color.getHexString()}`;
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
