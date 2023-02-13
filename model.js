import * as THREE from 'three';
import { OrbitControls } from 'orbitControls';
import { STLExporter } from 'STLExporter';
import { parts } from 'parts';

let groups = {};

const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);

export const aLight = new THREE.AmbientLight(0x404040, 3);
scene.add(aLight);

//https://manu.ninja/webgl-3d-model-viewer-using-three-js/
export const keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
keyLight.position.set(-100, 0, 100);

const fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
fillLight.position.set(100, 0, 100);

const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(100, 0, -100).normalize();

scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);

export const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const xrayMaterial = new THREE.MeshPhongMaterial({
  color: 0x88ff88,
  transparent: true,
  opacity: 0.2,
});

const selectedMaterial = new THREE.MeshPhongMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.6,
});

export const sceneConfig = {
  wireframe: false,
  xrayMaterial: xrayMaterial,
};

export const cams = {
  oblLeft: { name: 'Oblique Left', pos: [-1000, 1000, 1000], target: [0, 0, 0] },
  oblRight: { name: 'Oblique Right', pos: [1000, 1000, 1000], target: [0, 0, 0] },
  left: { name: 'Left', pos: [-1500, 500, 0], target: [0, 0, 0] },
  right: { name: 'Right', pos: [1500, 500, 0], target: [0, 0, 0] },
  top: { name: 'Top', pos: [0, 1500, 10], target: [0, 0, 0] },
  front: { name: 'Front', pos: [0, 500, -1500], target: [0, 0, 0] },
  back: { name: 'Back', pos: [0, 500, 1250], target: [0, 0, 0] }
};
setCamera(Object.values(cams)[0]);

let xrayOn = false;
const rowMap = {};
let specStr = null;

export function setSpec(str) {
  specStr = str;
  rebuild();
}

export function highlightRow(index) {
  rebuild();
  const object = rowMap[index];
  if(!object)
    return;
  highlightObject(object);
  const axesHelper = new THREE.AxesHelper(200);
  object.add(axesHelper);
}

function highlightObject(object) {
  if(object.type === 'Mesh') 
    object.material = selectedMaterial;
  else if(object.type === 'Object3D') {
    object.children.forEach(child => {
      highlightObject(child);
    });
  }
}

export function rebuild() {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    if(scene.children[i].type === "Mesh" || scene.children[i].type === "Object3D")
      scene.remove(scene.children[i]);
  }        
  groups = {};
  build();
}

function getGroup(name) {
  if(groups[name]) {
    if(groups[name].parent)
      return groups[name].clone();
    else    
      return groups[name];
  }
  else {
    const group = new THREE.Object3D();
    group.name = name;
    groups[name] = group;
    return group;
  }
}

export function getAllMeshProps(prop) {
  const items = [];
  scene.traverse((obj) => {
    if(obj.type === 'Mesh'){
      items.push(obj[prop]);
    }
  });
  return items;
}

export function getAllMeshInstances() {
  const items = [];
  scene.traverse((obj) => {
    if(obj.type === 'Mesh'){
      items.push(obj);
    }
  });
  return items;
}

function build() {
  const spec = [];
  if(!specStr)
    return;
  specStr.split('\n').forEach(l => {
    spec.push(l.split(','));
  });
  
  spec.forEach((row, i) => {
    try {
      if(row.length > 9) {
        row = row.map(str => str.trim());
        
        let visible = true;
        if(row[0].startsWith('#')) {
          row[0] = row[0].slice(1);  
          visible = false;
        }
        const part = parts.getPart(row[0]);
        if(part) {
          // Handle part
          const group = getGroup(row[1]);
          rowMap[i] = part;
          part.visible = visible;
          group.add(part);
          updatePart(part, row);
          if(xrayOn)
            part.material = xrayMaterial;
        }
        else {
          // Handle group
          const group = getGroup(row[0]);
          rowMap[i] = group;
          const parent = getGroup(row[1]);
          group.parent = parent;
          group.visible = visible;
          parent.add(group);
          updatePart(group, row);
        }
      }    
    }
    catch(e) { console.log(e); };
  });
  Object.keys(groups).forEach(g => {
    if(!groups[g].parent) {
      scene.add(groups[g]);
    }
  });
}     

function updatePart(part, spec) {
  part.scale.set(spec[2] * part.scale.x, spec[3] * part.scale.y, spec[4] * part.scale.z);
  part.position.set(spec[5], spec[6], spec[7]); 
  part.rotation.set(spec[8] * (Math.PI / 180), spec[9] * (Math.PI / 180), spec[10] * (Math.PI / 180)); 
  part.userData.scaleZ = spec[4]; //Store original scale
}

export function setXRay(on) {
  xrayOn = on;
  rebuild();
}

const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('click', () => {
  rebuild();
});

export function exportSTL() {
  const exporter = new STLExporter();
  return exporter.parse(scene, {binary: true});
}

export function setCamera(cam) {
  camera.position.set(...cam.pos);
  controls.target.set(...cam.target);
  controls.update();
}

function animate() {
  renderer.render(scene, camera);
}

function updateRaycaster() {
  raycaster.setFromCamera(pointer, camera);
  let intersects = raycaster.intersectObjects(scene.children, false);
  if(intersects.length > 0)
    console.log(intersects)
}

export let loaded = false;

renderer.setAnimationLoop(() => {
  // if(loaded)
    // updateRaycaster();
  animate();
});