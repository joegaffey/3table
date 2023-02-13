import * as model from 'model';

const gui = new dat.GUI({ autoPlace: false });
gui.domElement.id = 'guiContainer';
document.querySelector('#guiContainer').appendChild(gui.domElement);
gui.close();

const sceneGUI = gui.addFolder('Scene');
sceneGUI.add(model.sceneConfig, 'wireframe').name('X-Ray').onChange((value) => { model.setXRay(value); });;
sceneGUI.add(model.sceneConfig.xrayMaterial, 'opacity', 0.1, 0.5, 0.01).name('X-Ray Opacity');
sceneGUI.add(model.aLight, 'intensity', 0, 20, 0.1).name('Ambient Light');

const pLightGUI = sceneGUI.addFolder('Key Light');
pLightGUI.add(model.keyLight, 'intensity', 0, 10, 0.1).name('Intensity');
pLightGUI.add(model.keyLight.position, 'x', -1000, 1000, 10).name('X');
pLightGUI.add(model.keyLight.position, 'y', -1000, 1000, 10).name('Y');
pLightGUI.add(model.keyLight.position, 'z', -1000, 1000, 10).name('Z');
pLightGUI.addColor(model.keyLight, 'color').name('Color');

const camGUI = gui.addFolder('Camera');

const camSelect = { view: Object.keys(model.cams)[0] };
camGUI.add(camSelect, 'view', Object.keys(model.cams)).name('View').onChange((value) => {
  model.setCamera(model.cams[value]);
});
camGUI.add(model.camera, 'fov', 20, 120).name('FoV').onChange((value) => {
  model.camera.updateProjectionMatrix();
});

const camPosGUI = camGUI.addFolder('Position');
camPosGUI.add(model.camera.position, 'x', -2500, 2500).name('X').listen();
camPosGUI.add(model.camera.position, 'y', -2500, 2500).name('Y').listen();
camPosGUI.add(model.camera.position, 'z', -2500, 2500).name('Z').listen();

const camRotGUI = camGUI.addFolder('Rotation');
camRotGUI.add(model.camera.rotation, 'x', -Math.PI, Math.PI).name('Z').listen();
camRotGUI.add(model.camera.rotation, 'y', -Math.PI, Math.PI).name('Y').listen();
camRotGUI.add(model.camera.rotation, 'z', -Math.PI, Math.PI).name('Z').listen();