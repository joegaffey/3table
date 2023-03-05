// import { VRButton } from 'vrButton';

import * as model from 'model';
import * as table from '3DTable';
import parts from 'parts';
import csvTA from 'CSVTextArea';

// const loaderEl = document.querySelector('.loader');

const plDialog = document.querySelector('#plDialog');
const helpDialog = document.querySelector('#helpDialog');
const exportDialog = document.querySelector('#exportDialog');
const addDialog = document.querySelector('#addDialog');

const partsHelpEl = document.querySelector('#partsUl');
const modelSelectEl = document.querySelector('#model-select');
const partSelectEl = document.querySelector('#part-select');
const parentSelectEl = document.querySelector('#parent-select');
const plTextEl = document.querySelector('#plText');

parts.load(partsLoaded);

function partsLoaded() {
  let html = '';
  Object.keys(parts).forEach(model => {
    if(typeof parts[model] !== 'function')
      html += `<li>"${model}": ${parts[model].name} (${parts[model].type})</li>\n`;
  });
  partsHelpEl.innerHTML = html;
  
  html = '';  
  Object.keys(parts).forEach(model => {
    if(typeof parts[model] !== 'function')
      html += `<option value="${model}">"${model}": ${parts[model].name} (${parts[model].type})</option>\n`;
  });
  partSelectEl.innerHTML = html;
}

modelSelectEl.onchange = () => {
  getCSV(modelSelectEl.value);
};

table.tableBodyEl.addEventListener('update', (e) => {
  csvTA.value = e.detail.data;
  model.fromCSV(e.detail.data);
});  

const modelBase = './models/';
      
function getCSV(name) {
  fetch(modelBase + name)
    .then((response) => response.text())
    .then((text) => {
      csvTA.value = text;
      table.fromCSV(text);
      model.fromCSV(text);
  });
}

getCSV(modelSelectEl.value);

window.dlCSV = () => {
  downloadText('model.csv', csvTA.value);
}

window.dlParts = () => {
  const txt = getBOMText();
  downloadText('model.txt', txt);
}

window.dlSTL = () => {
  const stl = model.exportSTL();
  save(new Blob([stl]), 'model.stl');
}

function save(blob, filename) {
  const link = document.createElement( 'a' );
  link.style.display = 'none';
  document.body.appendChild( link );
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function downloadText(name, text) {
  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/text,' + encodeURI(text);
  hiddenElement.target = '_blank';
  hiddenElement.download = name;
  hiddenElement.click();
}

const fileInput = document.getElementById('input-file');
fileInput.addEventListener('change', getFile);

document.getElementById('importButton').addEventListener('click', (e) => { 
  fileInput.click();
}, false);

document.getElementById('csvButton').addEventListener('click', (e) => { 
  if(csvTA.style.display === 'block')
    csvTA.style.display = 'none';
  else
    csvTA.style.display = 'block';
}, false);

function getFile(event) {
	const input = event.target;
  if ('files' in input && input.files.length > 0) {
    placeFileContent(csvTA, input.files[0]);
  }
}

function placeFileContent(target, file) {
	readFileContent(file).then(content => {
  	target.value = content;
    table.fromCSV(content);
	  model.fromCSV(content);
  }).catch(error => console.log(error));
}

function readFileContent(file) {
	const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  })
}

let loadingCount = 0;

// renderer.xr.enabled = true;
// document.body.appendChild(VRButton.createButton(renderer));

const urlParams = new URLSearchParams(window.location.hash.replace("#","?"));


document.querySelector('#helpButton').addEventListener('click', (event) => {
  helpDialog.showModal();
});

document.querySelector('#expButton').addEventListener('click', (event) => {
  exportDialog.showModal();
});

document.querySelector('#listButton').addEventListener('click', (event) => {
  plTextEl.innerText = getBOMText();
  plDialog.showModal();
});

document.querySelector('#addButton').addEventListener('click', (event) => {
  addDialog.showModal();
  let html = '';  
  const groups = model.getGroupNames();
  if(groups.length === 0)
    groups.push('model');
  groups.forEach(parent => {
    html += `<option value="${parent}">${parent}</option>\n`;
  });
  parentSelectEl.innerHTML = html;
});

document.querySelector('#deleteButton').addEventListener('click', (event) => {
  table.deleteSelectedRow();
  csvTA.value = table.asCSV();
  update3dData(csvTA.value);
});

document.querySelector('#copyButton').addEventListener('click', (event) => {
  table.copySelectedRow();
  csvTA.value = table.asCSV();
  update3dData(csvTA.value);
});

document.querySelector('#addDialogButton').addEventListener('click', (event) => {
  table.addPart(partSelectEl.value, parentSelectEl.value);
});

function getBOMText() {
  let list = '';
  let accessories = {};
  const meshes = model.getAllMeshInstances();
  meshes.forEach(mesh => {
    const part = parts[mesh.name];
    list += part.name;
    if(part.type === 'Extruded')
      list += ` (${mesh.userData.scaleZ}mm)\n`;
    else if(mesh.scale.x !== 1 || mesh.scale.y !== 1 || mesh.scale.z !== 1) 
      list += ` (scaled)\n`;
    else 
      list += `\n`;
  });

  const partNames = model.getAllMeshProps('name');
  partNames.forEach(name => {
    const part = parts[name];
    if(part && part.accessories) {
      part.accessories.forEach(acc => {
      if(accessories[acc.id]) {
        accessories[acc.id].count += acc.count;
      }
      else
        accessories[acc.id] = { name: acc.name, count: acc.count };
    });
    }
  });
  
  const counts = {};
  const pList = list.split('\n');
  pList.forEach(x => { counts[x] = (counts[x] || 0) + 1; });

  list = '';
  Object.keys(counts).forEach(i => {
    if(i.trim().length > 0)
      list += i + ' x' + counts[i] + '\n';
  });
  
  Object.keys(accessories).forEach(key => {
    const acc = accessories[key];
    list += `${acc.name} x${acc.count}\n`;
  });

  return list;
}

csvTA.onkeyup = (e) => {
  update3dData(csvTA.value); 
  if(e.keyCode === 32 && e.ctrlKey) 
    csvTA.lineComplete();
}

csvTA.onkeydown = (e) => {
  if(e.keyCode === 9) {
    csvTA.wordComplete();
    e.preventDefault();
  }
}

csvTA.addEventListener('click', () => {
  update3dData(csvTA.value);
});

window.deleteRow = (id) => {
  table.deleteRow(id);
  csvTA.value = table.asCSV();
  update3dData(csvTA.value);
}

function update3dData(csvStr) {
  model.fromCSV(csvStr);
  table.fromCSV(csvStr);
  updateSelection();
}

function updateSelection() {
  const row = csvTA.getCaretRow();
  if(row > -1) 
    model.highlightRow(row);  
}

// let isDown = false;
// let isDrag = false;

// function onPointerMove(event) {
//   model.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//   model.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

//   if(isDown)
//     isDrag = true;
//   else
//     isDrag = false;
// }
// window.addEventListener('pointermove', onPointerMove);

// function onPointerUp() {
//   isDown = false;
//   if(isDrag)
//     return;
// }
// window.addEventListener('pointerup', onPointerUp);

// function onPointerDown() {
//   isDown = true;
// }      
// window.addEventListener('pointerdown', onPointerDown);

// function startLoad() {
//   loadingCount++;
//   loaderEl.style.display = 'block';
// }

// function endLoad() {
//   loadingCount--;
//   if(loadingCount === 0) {
//     model.loaded = true;
//     loaderEl.style.display = 'none';
//   }
// }