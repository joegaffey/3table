import * as THREE from 'three';
import { OrbitControls } from 'orbitControls';
import { STLExporter } from 'STLExporter';
import * as parts from 'parts';

// renderer.xr.enabled = true;
// document.body.appendChild(VRButton.createButton(renderer));

let groups = {};

const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);

export let size = 2000;
let divisions = size / 100;

let gridHelper = new THREE.GridHelper(size, divisions);
scene.add(gridHelper);

export function showGrid(on) {
  if(on && !scene.getObjectById(gridHelper.id)) {
    sceneConfig.gridOn = true;
    scene.add(gridHelper);
  }
  else {
    sceneConfig.gridOn = false;
    scene.remove(gridHelper);
  }
}

export function setSize(s) {
  size = sceneConfig.size = s; // Sceneconfig appears to be required by DAT.GUI
  divisions = size / 100;
  rebuild();
  scene.remove(gridHelper);
  gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);
}

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
  size: 2000,
  wireframe: false,
  gridOn: true,
  xrayMaterial: xrayMaterial,
};

export const cams = {
  front: { name: 'Front', pos: [0, 500, 1500], target: [0, 0, 0] },
  back: { name: 'Back', pos: [0, 500, -1500], target: [0, 0, 0] },
  top: { name: 'Top', pos: [0, 1500, 10], target: [0, 0, 0] },
  left: { name: 'Left', pos: [-1500, 500, 0], target: [0, 0, 0] },
  right: { name: 'Right', pos: [1500, 500, 0], target: [0, 0, 0] },
  oblLeft: { name: 'Oblique Left', pos: [-1000, 1000, 1000], target: [0, 0, 0] },
  oblRight: { name: 'Oblique Right', pos: [1000, 1000, 1000], target: [0, 0, 0] }
};
setCamera(Object.values(cams)[0]);

let xrayOn = false;
const rowMap = {};
let csvStr = null;

export function fromCSV(str) {
  csvStr = str;
  highlightedRow = -1;
  rebuild();
}

let highlightedRow = -1;

export function highlightRow(index) {
  highlightedRow = index;
  rebuild();
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
  const rows = [];
  
  if(!csvStr)
    return;
  
  csvStr.split('\n').forEach(l => {
    rows.push(l.split(','));
  });
  
  let names = [];
  rows.forEach(row => {
    names.push(row[0]);
  });
  names = [...new Set(names)];
  
  Promise.all(parts.loadGeometries(names)).then(() => {
    rows.forEach((row, i) => {
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
            part.row = row;
            rowMap[i] = part;
            part.visible = visible;
            const group = getGroup(row[1]);
            group.add(part);
            updatePart(part, row);
          }
          else {
            // Handle group
            const group = getGroup(row[0]);
            rowMap[i] = group;
            const parent = getGroup(row[1]);
            if(group !== parent) {
              group.parent = parent;
              group.visible = visible;
              parent.add(group);
              updatePart(group, row);
            }
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
    
    if(highlightedRow > -1) {
      highlightedObjects = [];
      getHighlightedObjects(rowMap[highlightedRow]);
      const axesHelper = new THREE.AxesHelper(200);
      rowMap[highlightedRow].add(axesHelper);
      rowMap[highlightedRow].material = selectedMaterial;
      highlightedObjects.forEach(object => {
        object.material = selectedMaterial;
      });
    }
  });
}

let highlightedObjects = [];
function getHighlightedObjects(object) {
  if(object.type === 'Mesh')
    highlightedObjects.push(object);
  else if(object.type === 'Object3D') {
    object.children.forEach(child => {
      getHighlightedObjects(child);
    });
  }
}


function updatePart(part, props) {
  if(props) {
    part.scale.set(props[2] * part.scale.x, props[3] * part.scale.y, props[4] * part.scale.z);
    part.position.set(props[5], props[6], props[7]); 
    part.rotation.set(props[8] * (Math.PI / 180), props[9] * (Math.PI / 180), props[10] * (Math.PI / 180)); 
    part.userData.scaleZ = props[4]; //Store original scale
  }
  if(xrayOn)
    part.material = xrayMaterial;
}

export function setXRay(on) {
  xrayOn = on;
  rebuild();
}

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

// const raycaster = new THREE.Raycaster();
// export const pointer = new THREE.Vector2();
//
// function updateRaycaster() {
//   raycaster.setFromCamera(pointer, camera);
//   let intersects = raycaster.intersectObjects(scene.children, false);
//   if(intersects.length > 0)
//     console.log(intersects)
// }

export function getGroupNames() {
  return Object.keys(groups);
}

export let loaded = false;

renderer.setAnimationLoop(() => {
  // if(loaded)
    // updateRaycaster();
  animate();
});

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}