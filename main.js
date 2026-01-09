import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
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

const texture = new THREE.TextureLoader().load('/texture.jpg');
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

document.getElementById('sphereColor').addEventListener('input', (e) => {
  sphere.material.color.set(e.target.value);
});
document.getElementById('pyramidColor').addEventListener('input', (e) => {
  pyramid.material.color.set(e.target.value);
});
document.getElementById('planeColor').addEventListener('input', (e) => {
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

function applyLightDefaultsFromUI() {
  const intensity = lightIntensityEl.value;
  const color = lightColorEl.value;
  for (const key of Object.keys(lightsByKey)) {
    setLightIntensity(lightsByKey[key], intensity);
    setLightColor(lightsByKey[key], color);
  }
}
applyLightDefaultsFromUI();

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

lightSelectEl.addEventListener('change', () => {
  const L = lightsByKey[lightSelectEl.value];
  lightIntensityEl.value = String(L.intensity);
  if (L.color) lightColorEl.value = `#${L.color.getHexString()}`;
});

const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);

transformControls.addEventListener('dragging-changed', (e) => {
  controls.enabled = !e.value;
});

const showGizmoEl = document.getElementById('showGizmo');

transformControls.visible = false;
transformControls.enabled = false;

function updateGizmoState() {
  const wantOn = showGizmoEl.checked && !!selectedModel;
  transformControls.enabled = wantOn;
  transformControls.visible = wantOn;

  if (wantOn) {
    transformControls.attach(selectedModel);
  } else {
    transformControls.detach();
    controls.enabled = true;
  }
}
showGizmoEl.addEventListener('change', updateGizmoState);

// Загрузка моделей
const gltfLoader = new GLTFLoader();
const loadedModels = []; // { id, name, object3D, defaults }
let selectedModel = null;

const fileInput = document.getElementById('fileInput');
const modelSelect = document.getElementById('modelSelect');

const modeTranslate = document.getElementById('modeTranslate');
const modeRotate = document.getElementById('modeRotate');
const modeScale = document.getElementById('modeScale');

const resetModelBtn = document.getElementById('resetModel');

const posX = document.getElementById('posX');
const posY = document.getElementById('posY');
const posZ = document.getElementById('posZ');

const rotX = document.getElementById('rotX');
const rotY = document.getElementById('rotY');
const rotZ = document.getElementById('rotZ');

const sclX = document.getElementById('sclX');
const sclY = document.getElementById('sclY');
const sclZ = document.getElementById('sclZ');

const radToDeg = (r) => r * (180 / Math.PI);
const degToRad = (d) => d * (Math.PI / 180);

function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `m_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function setInputsDisabled(disabled) {
  for (const el of [posX,posY,posZ, rotX,rotY,rotZ, sclX,sclY,sclZ]) el.disabled = disabled;
  modeTranslate.disabled = disabled;
  modeRotate.disabled = disabled;
  modeScale.disabled = disabled;
  resetModelBtn.disabled = disabled;
}
setInputsDisabled(true);

modeTranslate.addEventListener('click', () => {
  if (!transformControls.enabled) return;
  transformControls.setMode('translate');
});
modeRotate.addEventListener('click', () => {
  if (!transformControls.enabled) return;
  transformControls.setMode('rotate');
});
modeScale.addEventListener('click', () => {
  if (!transformControls.enabled) return;
  transformControls.setMode('scale');
});

function syncInputsFromModel(obj) {
  if (!obj) return;

  posX.value = obj.position.x.toFixed(2);
  posY.value = obj.position.y.toFixed(2);
  posZ.value = obj.position.z.toFixed(2);

  rotX.value = Math.round(radToDeg(obj.rotation.x));
  rotY.value = Math.round(radToDeg(obj.rotation.y));
  rotZ.value = Math.round(radToDeg(obj.rotation.z));

  sclX.value = obj.scale.x.toFixed(2);
  sclY.value = obj.scale.y.toFixed(2);
  sclZ.value = obj.scale.z.toFixed(2);
}

function applyInputsToModel(obj) {
  if (!obj) return;

  obj.position.set(
    Number(posX.value),
    Number(posY.value),
    Number(posZ.value)
  );

  obj.rotation.set(
    degToRad(Number(rotX.value)),
    degToRad(Number(rotY.value)),
    degToRad(Number(rotZ.value))
  );

  obj.scale.set(
    Math.max(0.0001, Number(sclX.value)),
    Math.max(0.0001, Number(sclY.value)),
    Math.max(0.0001, Number(sclZ.value))
  );
}

for (const el of [posX,posY,posZ, rotX,rotY,rotZ, sclX,sclY,sclZ]) {
  el.addEventListener('input', () => {
    if (!selectedModel) return;
    applyInputsToModel(selectedModel);
  });
}

// синхронизация при изменении гизмо
transformControls.addEventListener('objectChange', () => {
  if (!selectedModel) return;
  syncInputsFromModel(selectedModel);
});

function addModelToSelect(id, name) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = name;
  modelSelect.appendChild(opt);

  modelSelect.value = id;
  modelSelect.dispatchEvent(new Event('change'));
}

function prepareLoadedObject(root) {
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // центрирование и постановка
  const box3 = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box3.getSize(size);
  box3.getCenter(center);

  root.position.sub(center);

  const boxAfter = new THREE.Box3().setFromObject(root);
  root.position.y -= boxAfter.min.y;
  root.position.z = 3.0;

  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 10) {
    const s = 10 / maxDim;
    root.scale.setScalar(s);
  }

  const defaults = {
    position: root.position.clone(),
    rotation: root.rotation.clone(),
    scale: root.scale.clone()
  };

  return defaults;
}

function loadUserModelFile(file) {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext !== 'glb' && ext !== 'gltf') {
    alert('Поддерживаются только .glb и .gltf.');
    return;
  }

  const url = URL.createObjectURL(file);

  gltfLoader.load(
    url,
    (gltf) => {
      URL.revokeObjectURL(url);

      const root = gltf.scene;
      const defaults = prepareLoadedObject(root);

      scene.add(root);

      const id = makeId();
      loadedModels.push({ id, name: file.name, object3D: root, defaults });
      addModelToSelect(id, file.name);
    },
    undefined,
    (err) => {
      URL.revokeObjectURL(url);
      console.error(err);
      alert('Не удалось загрузить модель. Проверь, что это корректный glTF/GLB.');
    }
  );
}

modelSelect.addEventListener('change', () => {
  const id = modelSelect.value;
  const record = loadedModels.find(m => m.id === id) || null;

  if (!record) {
    selectedModel = null;
    setInputsDisabled(true);
    updateGizmoState(); // скроет/отцепит гизмо
    return;
  }

  selectedModel = record.object3D;

  setInputsDisabled(false);
  syncInputsFromModel(selectedModel);

  // гизмо появляется только для пользовательской модели + если включили чекбокс
  updateGizmoState();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  loadUserModelFile(file);
  fileInput.value = '';
});

resetModelBtn.addEventListener('click', () => {
  if (!selectedModel) return;

  const id = modelSelect.value;
  const record = loadedModels.find(m => m.id === id);
  if (!record) return;

  const d = record.defaults;

  selectedModel.position.copy(d.position);
  selectedModel.rotation.copy(d.rotation);
  selectedModel.scale.copy(d.scale);

  syncInputsFromModel(selectedModel);
});

const dropOverlay = document.getElementById('dropOverlay');
let dragCounter = 0;

function isFileDrag(event) {
  return event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files');
}

window.addEventListener('dragenter', (e) => {
  if (!isFileDrag(e)) return;
  dragCounter++;
  dropOverlay.classList.add('visible');
});

window.addEventListener('dragleave', (e) => {
  if (!isFileDrag(e)) return;
  dragCounter--;
  if (dragCounter <= 0) {
    dropOverlay.classList.remove('visible');
    dragCounter = 0;
  }
});

window.addEventListener('dragover', (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();

  dropOverlay.classList.remove('visible');
  dragCounter = 0;

  const file = e.dataTransfer.files?.[0];
  if (!file) return;

  loadUserModelFile(file);
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
