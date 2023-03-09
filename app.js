// import { VRButton } from 'vrButton';

import * as model from 'model';
import * as table from '3DTable';
import * as parts from 'parts';
import csvTA from 'CSVTextArea';

// const loaderEl = document.querySelector('.loader');

const plDialog = document.querySelector('#plDialog');
const helpDialog = document.querySelector('#helpDialog');
const exportDialog = document.querySelector('#exportDialog');
const addDialog = document.querySelector('#addDialog');

const partsHelpEl = document.querySelector('#partsUl');
const modelSelectEl = document.querySelector('#model-select');
const partSelectEl = document.querySelector('#part-select');
const collectionSelectEl = document.querySelector('#collection-select');
const parentSelectEl = document.querySelector('#parent-select');
const plTextEl = document.querySelector('#plText');

const undoButton = document.querySelector('#undoButton');
const redoButton = document.querySelector('#redoButton');

parts.load(partsLoaded);

let history = []; // History is not the past but a map of the past
let future = []; // There's no fate but what we make for ourselves

function partsLoaded() {
  setCollectionOptions();
  setPartOptions(collectionSelectEl.value);  
}

function setCollectionOptions() {
  let html = '';  
  Object.keys(parts.collections).forEach(collection => {
    html += `<option value="${collection}">${parts.collections[collection].name}</option>\n`;
  });
  collectionSelectEl.innerHTML = html;
}

function setPartOptions(collection) {
  let html = ''; 
  const collectionParts = parts.collections[collection].parts;
  
  collectionParts.forEach(partKey => {
    const part = parts.parts[partKey];
    html += `<option value="${partKey}">${partKey} - ${part.name}</option>\n`;
  });
  partSelectEl.innerHTML = html;
}

modelSelectEl.onchange = () => {
  getCSVFile(modelSelectEl.value);
  window.location.hash = 'model=' + modelSelectEl.value.split('.')[0]
};

collectionSelectEl.onchange = () => {
  setPartOptions(collectionSelectEl.value);
};

table.tableBodyEl.addEventListener('update', (e) => {
  update3dData(e.detail.data, table);
});  

const modelBase = './models/';
      
function getCSVFile(name) {
  fetch(modelBase + name)
    .then((response) => response.text())
    .then((text) => {
      update3dData(text, null);
  });
}

if(window.location.hash) {
  const param = window.location.hash.split('=');
  if(param[0] === '#model')
    setModel(param[1]);
}
else 
  getCSVFile(modelSelectEl.value);
  
function setModel(model) {
  modelSelectEl.value = model + '.csv';
  modelSelectEl.dispatchEvent(new Event('change'));
}

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
fileInput.addEventListener('change', getLocalCSVFile);

document.getElementById('importButton').addEventListener('click', (e) => { 
  fileInput.click();
}, false);

document.getElementById('csvButton').addEventListener('click', (e) => { 
  if(csvTA.style.display === 'block')
    csvTA.style.display = 'none';
  else
    csvTA.style.display = 'block';
}, false);

function getLocalCSVFile(event) {
	const input = event.target;
  if ('files' in input && input.files.length > 0) {
    readFileContent(input.files[0]).then(content => {
      update3dData(content, null);
    }).catch(error => console.log(error));
  }
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

// const urlParams = new URLSearchParams(window.location.hash.replace("#","?"));


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
  update3dData(table.asCSV(), table);
});

document.querySelector('#copyButton').addEventListener('click', (event) => {
  table.copySelectedRow();
  update3dData(table.asCSV(), table);
});

document.querySelector('#snapButton').addEventListener('click', (event) => {
  table.toggleSnap();
});

document.querySelector('#addDialogButton').addEventListener('click', (event) => {
  table.addPart(partSelectEl.value, parentSelectEl.value);
});

undoButton.addEventListener('click', (event) => {
  undo();
});

redoButton.addEventListener('click', (event) => {
  redo();
});

function getBOMText() {
  let list = '';
  let accessories = {};
  const meshes = model.getAllMeshInstances();
  meshes.forEach(mesh => {
    const part = parts.parts[mesh.name];
    list += part.name;
    if(part.type === 'Extruded')
      list += ` (${mesh.userData.scaleZ * 100}mm)\n`;
    else if(mesh.scale.x !== 1 || mesh.scale.y !== 1 || mesh.scale.z !== 1) 
      list += ` (scaled)\n`;
    else 
      list += `\n`;
  });

  const partNames = model.getAllMeshProps('name');
  partNames.forEach(name => {
    const part = parts.parts[name];
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
  update3dData(csvTA.value, csvTA); 
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
  update3dData(csvTA.value, csvTA);
});

function update3dData(csvStr, source) {
  addHistory(csvStr)
  model.fromCSV(csvStr);
  if(source !== table)
    table.fromCSV(csvStr);
  if(source !== csvTA)
    csvTA.value = csvStr;
  updateSelection(source);
}

function updateSelection(source) {
  let row = -1;
  if(source === csvTA) {
    row = csvTA.getCaretRow();
  }
  if(row > -1) {
    model.highlightRow(row);
    if(source === csvTA) 
      table.selectCellByCoord(row);
  }
}

const debounce = (func, delay) => {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  }
}

const addHistory = debounce(function(csvStr) {
  if(history[history.length] > 0 && history[history.length].trim() === csvStr.trim())
    return;
  undoButton.disabled = false;
  future = [];
  redoButton.disabled = true;
  history.push(csvStr);
  if(history.length > 100)
    history = history.splice(-1);
}, 250);

/** The past is never where you think you left it */
function undo() {
  const lastState = history.pop();
  if(history.length < 1)
    undoButton.disabled = true;
  future.push(lastState);
  redoButton.disabled = false;
  setCSV(history[history.length -1]);
  updateSelection();
}

/** Those who do not remember the past are condemned to repeat it. */
function redo() {
  if(future.length < 1)
    return;
  const lastState = future.pop();
  if(future.length < 1) {
    redoButton.disabled = true;
    undoButton.disabled = false;
  }
  history.push(lastState);
  setCSV(lastState);
  updateSelection();
}

function setCSV(csv) {
  model.fromCSV(csv);
  table.fromCSV(csv);
  csvTA.value = csv;
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