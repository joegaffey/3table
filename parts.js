import * as THREE from 'three';
import { STLLoader } from 'STLLoader';
import * as model from 'model';

const c4040Shape = new THREE.Shape();
c4040Shape.lineTo(40, 0);
c4040Shape.lineTo(0, 40);

const wedgeShape = new THREE.Shape();
wedgeShape.lineTo(100, 0);
wedgeShape.lineTo(0, 100);

const prismShape = new THREE.Shape();
prismShape.lineTo(100, 50);
prismShape.lineTo(0, 100);

const c4040Geom = new THREE.ExtrudeGeometry(c4040Shape, { depth: 40, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 } );
const c8040Geom = new THREE.ExtrudeGeometry(c4040Shape, { depth: 80, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 } );
const wedgeGeom = new THREE.ExtrudeGeometry(wedgeShape, { depth: 100, bevelEnabled: false });
const prismGeom = new THREE.ExtrudeGeometry(prismShape, { depth: 100, bevelEnabled: false });

const boxGeom = new THREE.BoxGeometry(100, 100, 100);
const sphereGeom = new THREE.SphereGeometry(50, 50, 50, 50);
const cylinderGeom = new THREE.CylinderGeometry(50, 50, 100, 50);
const coneGeom = new THREE.ConeGeometry(50, 100, 32);
const torusGeom = new THREE.TorusGeometry(45, 15, 16, 100);

export const parts = {
  cube: { name: 'Cube', type: 'Modeled', geom: boxGeom, color: 0x444444 },
  sphere: { name: 'Sphere', type: 'Modeled', geom: sphereGeom, color: 0x444444 },
  cylinder: { name: 'Cylinder', type: 'Modeled', geom: cylinderGeom, color: 0x444444 },
  wedge: { name: 'Wedge', type: 'Modeled', geom: wedgeGeom, color: 0x444444, adjust: [1,1,1,0,-50,-50,0,-90,0] },
  prism: { name: 'Prism', type: 'Modeled', geom: prismGeom, color: 0x444444, adjust: [1,1,1,0,-50,-50,0,0,90] },
  cone: { name: 'Cone', type: 'Modeled', geom: coneGeom, color: 0x444444 },
  torus: { name: 'Torus', type: 'Modeled', geom: torusGeom, color: 0x444444 },
  8040: { name: '8040 profile', collection: 'profile', type: 'Extruded', geom: null, color: 0x444444, adjust: [1,1,1,-40,-20,0,0,0,0] },   //https://www.thingiverse.com/thing:4261766
  4040: { name: '4040 profile', collection: 'profile', type: 'Extruded', geom: null, color: 0x444444, adjust: [1,1,1/1.2,0,0,0,0,0,0] },  //https://www.thingiverse.com/thing:2944815
  c4040: { name: '4040 corner', type: 'Modeled', geom: c4040Geom, color: 0x111111, accessories: [{id: 'nuts', name: 'T-Slot nuts and bolts', count: 2}] },
  c8040: { name: '8040 corner', type: 'Modeled', geom: c8040Geom, color: 0x111111, accessories: [{id: 'nuts', name: 'T-Slot nuts and bolts', count: 4}] },
};

export const collections = {
  basic: {
    name: 'Basic shapes',
    parts: ['cube','sphere','cylinder', 'wedge', 'prism', 'cone', 'torus']
  },
  profile: {
    name: 'Extruded Profile',
    parts: ['8040','4040','c8040','c4040']
  }
};

const baseURL = './collections';

const stlLoader = new STLLoader();

export function loadGeometries(names) {
  const promises = [];
  names.forEach(name => {
    const partModel = parts[name];
    if(partModel && !partModel.geom) {
      const promise = stlLoader.loadAsync(`${baseURL}/${partModel.collection}/${name}.stl`);
      Promise.resolve(promise).then(geometry => {
        partModel.geom = geometry;
      });
      promises.push(promise);
    }
  });
  return promises;
}

export function getPart(name) {
  const partModel = parts[name];
  
  if(!partModel)
    return null;
  
  const part = new THREE.Mesh(); 
  part.name = name;
  part.collection = partModel.collection;
  part.geometry = partModel.geom.clone();
  setupPart(part);
  return part;
}

function setupPart(part) {
  const partModel = parts[part.name];
  part.material = new THREE.MeshPhongMaterial({ color: partModel.color });
  
  if(partModel.adjust) {
    const a = partModel.adjust;
    part.scale.set(a[0], a[1], a[2]);
    part.geometry.translate(a[3], a[4], a[5]);
    part.geometry.rotateX(a[6] * (Math.PI / 180));
    part.geometry.rotateY(a[7] * (Math.PI / 180));
    part.geometry.rotateZ(a[8] * (Math.PI / 180));
  }
}