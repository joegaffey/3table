import * as THREE from 'three';
import { STLLoader } from 'STLLoader';
import * as model from 'model';

const c4040Shape = new THREE.Shape();
c4040Shape.lineTo(40, 0);
c4040Shape.lineTo(0, 40);

const c4040Geom = new THREE.ExtrudeGeometry( c4040Shape, { depth: 40, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 } );
const c8040Geom = new THREE.ExtrudeGeometry( c4040Shape, { depth: 80, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 } );
const boxGeom = new THREE.BoxGeometry(100, 100, 100);
const sphereGeom = new THREE.SphereGeometry(50, 50, 50, 50);
const cylinderGeom = new THREE.CylinderGeometry(50, 50, 100, 50);


export const parts = {
  "cube": { name: '100mm cube', type: "Modeled", geom: boxGeom, color: 0x444444, adjust: [1,1,1,0,0,0,0,0,0] },
  "sphere": { name: '100mm sphere', type: "Modeled", geom: sphereGeom, color: 0x444444, adjust: [1,1,1,0,0,0,0,0,0] },
  "cylinder": { name: '100mm cylinder', type: "Modeled", geom: cylinderGeom, color: 0x444444, adjust: [1,1,1,0,0,0,0,0,0] },
  "8040": { name: '8040 profile', type: "Extruded", geom: null, color: 0x444444, adjust: [1,1,1/100,-40,-20,0,0,0,0] },   //https://www.thingiverse.com/thing:4261766
  "4040": { name: '4040 profile', type: "Extruded", geom: null, color: 0x444444, adjust: [1,1,1/120,0,0,0,0,0,0] },  //https://www.thingiverse.com/thing:2944815
  "c4040": { name: '4040 corner', type: "Modeled", geom: c4040Geom, color: 0x111111, accessories: [{id: "nuts", name: "T-Slot nuts and bolts", count: 2}] },
  "c8040": { name: '8040 corner', type: "Modeled", geom: c8040Geom, color: 0x111111, accessories: [{id: "nuts", name: "T-Slot nuts and bolts", count: 4}] },
};

const baseURL = './assets/';

const stlLoader = new STLLoader();

function loadGeometry(name) {
  stlLoader.load(
    `${baseURL}${name}.stl`,
    (geometry) => {
      parts[name].geom = geometry;
      try {
        model.rebuild();
      }
      catch(e) { console.log(e); }
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
      console.log(`Error loading profile STL: ${name}`);
    }
  );
}

parts.load = function(callback) {
  Object.keys(parts).forEach(model => {
    if(typeof parts[model] !== 'function' && !parts[model].geom) 
      loadGeometry(model);
  });
  if(callback)
    callback();
}

parts.getPart = function(name) {
  const part = new THREE.Mesh();
  const model = parts[name];
  
  if(!model)
    return null;
  
  part.name = name;
  
  if(model.geom)
    part.geometry = model.geom.clone();
  
  // part.geometry.center();
  part.material = new THREE.MeshPhongMaterial({ color: model.color });
  
  if(model.adjust) {
    const a = model.adjust;
    part.scale.set(a[0], a[1], a[2]);
    part.geometry.translate(a[3], a[4], a[5]);
    part.rotation.set(a[6], a[7], a[8]);
  }

  return part;
}

export default parts;