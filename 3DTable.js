import * as model from 'model';

export const tableBodyEl = document.querySelector('.spec-table > tbody');
const tableEl = document.querySelector('.spec-table');
const valSliderEl = document.querySelector('.val-slider');
const ticksEl = document.querySelector('.ticks');

const arrow = {
  left: 37,
  up: 38,
  right: 39,
  down: 40
};

tableBodyEl.addEventListener('keydown', e => {
  if (!Object.values(arrow).includes(e.which)) {
    return;
  }

  const currentAddress = JSON.parse(selectedCell.attributes['data-address'].value);
  let newAddress = currentAddress;
  switch (e.which) {
    case arrow.left: {
      if(currentAddress[1] > 0) {
        newAddress = [currentAddress[0], currentAddress[1] - 1];
      }
      break;
    }
    case arrow.right: {
      if(currentAddress[1] < 12) {
        newAddress = [currentAddress[0], currentAddress[1] + 1];
      }
      break;
    }
    case arrow.up: {
      if(currentAddress[0] > 0) {
        newAddress = [currentAddress[0] - 1, currentAddress[1]];
      }
      break;
    }
    case arrow.down: {
      if(currentAddress[0] < tableBodyEl.rows.length) {
        newAddress = [currentAddress[0] + 1, currentAddress[1]];
      }
      break;
    }
  }
  
  if(newAddress !== currentAddress) {
    selectCellByCoord(newAddress[0], newAddress[1], true);
    e.preventDefault();
  }

});

tableBodyEl.oninput = (e) => { 
  valSliderEl.value = e.target.textContent.trim();
  sendUpdate();
}

export function show() {
  tableEl.style.display = 'block';
}

export function hide() {
  tableEl.style.display = 'none';
}

let selectedCell = null;
tableBodyEl.onclick = (e) => {
  let focus = false;
  if(e.pointerType === 'mouse')
    focus = true;
  if(e.target.nodeName !== 'TD')
    return;
  selectCell(e.target, focus);
  e.stopPropagation();
}

function unselectCell() {
  if(!selectedCell)
    return;
  selectedCell.isSelected = false;
  selectedCell.contentEditable = false;
  selectedCell.style.background = selectedCell.originalColor;
  selectedCell.style.outline = 'none';
  selectedCell = null;
  disableSlider();
}

function selectCell(el, focus) {
  if(selectedCell)
    unselectCell();
  selectedCell = el;
  selectedCell.isSelected = true;
  selectedCell.originalColor = selectedCell.style.background;
  selectedCell.style.background = 'yellow';
  selectedCell.style.outline = '5px solid red';
  selectedCell.contentEditable = true;
  if(focus)
    selectedCell.focus();
  
  valSliderEl.value = selectedCell.textContent.trim();
  if(selectedCell.attributes['data-address']) {
    const row = JSON.parse(selectedCell.attributes['data-address'].value)[0];
    const col = JSON.parse(selectedCell.attributes['data-address'].value)[1];
    if(Number.isInteger(row)) {
      model.highlightRow(row);
    }
    if(isNaN(selectedCell.innerText)) {
      disableSlider();
    }
    else {
      enableSlider();
      setSliderRange(JSON.parse(selectedCell.attributes['data-address'].value)[1]);
    }
  }
}

function disableSlider() {
  valSliderEl.value = 0;
  valSliderEl.disabled = true;
  ticksEl.style.opacity = 0;
}

function enableSlider() {
  valSliderEl.disabled = false;
  ticksEl.style.opacity = 1;
}

export function selectCellByCoord(row, col = -1, focus = false) {
  if(col < 0 && selectedCell)
    col = JSON.parse(selectedCell.attributes['data-address'].value)[1];
  const rowEl = tableBodyEl.rows[row];
  if(!rowEl)
    return;
  const cell = rowEl.cells[col];
  if(cell)
    selectCell(cell, focus);
}

function setTicks(count) {
  if(count > 50)  // Shitty hack to avoid overrunning the slider
    count = count / 2;
  ticksEl.innerHTML = '<span></span>\n';
  for(let i = 0; i < count; i++) {
    ticksEl.innerHTML += '<span class="tick">|</span>\n'
  }
}

let snapOn = true;

export function toggleSnap() {
  if(snapOn) {
    snapOn = false;
  }
  else {
    snapOn = true;
  }
  if(selectedCell) {
    setSliderRange(JSON.parse(selectedCell.attributes['data-address'].value)[1]);
  }
}

function setSliderRange(col) {
  if(col < 5) {
    valSliderEl.max = model.size / 100;
    valSliderEl.min = 0;
    if(snapOn) {
      valSliderEl.step = 0.5;
      setTicks(valSliderEl.max / valSliderEl.step);
    }
    else {
      valSliderEl.step = 0.01;
      setTicks(0);
    }
  }
  else if(col < 8) {
    valSliderEl.max = model.size / 2;
    valSliderEl.min = model.size / -2;
    if(snapOn) {
      valSliderEl.step = 50;
      setTicks(valSliderEl.step);
    }
    else {
      valSliderEl.step = 1;
      setTicks(0);
    }
  }
  else {
    valSliderEl.max = 180;
    valSliderEl.min = -180;
    if(snapOn) {
      valSliderEl.step = 10;
      setTicks(360 / valSliderEl.step);
    }
    else {
      valSliderEl.step = 1;
      setTicks(0);
    }
  }
}

valSliderEl.oninput = e => {
  if(selectedCell)
    selectedCell.innerText = valSliderEl.value;
  sendUpdate();
  if(selectedCell.attributes['data-address']) {
    const row = JSON.parse(selectedCell.attributes['data-address'].value);
    if(Number.isInteger(row[0]))
      model.highlightRow(row[0]);
  }
};

function sendUpdate() {
  tableBodyEl.dispatchEvent(new CustomEvent('update', { detail: { data: asCSV() }}));
}

export function asCSV(){
  let csv = '';
  Array.from(tableBodyEl.children).forEach(tr => {
    Array.from(tr.children).forEach((td, i) => {
      if(i < 11) {
        if(i > 0)
          csv += ',';
        csv += ' ' + td.innerText.replace(/\n|\r/g, '');
      }
    }); 
    csv += '\n';
  });
  return csv;
}

export function fromCSV(csv) {
  const rows = [];
  if(!csv)
    return;
  let html = '';
  csv.split('\n').forEach(l => {
    if(l.trim().length > 0) {
      if(l.split(',').length > 10)
        rows.push(l.split(','));
    }
  });
  
  rows.forEach((row, i) => {
    html += '<tr>\n';
    row.forEach((item, j) => {
      html += `<td data-address="[${i},${j}]">${item.trim()}</td>\n`;
    });
    html += '</tr>\n'
  });
  
  tableBodyEl.innerHTML = html;
}

export function addPart(part, group) {
  let row = -1;
  if(selectedCell) {
    row = JSON.parse(selectedCell.attributes['data-address'].value)[0] + 1;
  }
  const rowEl = tableBodyEl.insertRow(row);
  [part,group,1,1,1,0,0,0,0,0,0].map((val, i) => { 
    const cell = rowEl.insertCell(i);
    cell.innerHTML = val;
  });
  setCellAddresses();
  selectCellByCoord(row);
  sendUpdate();
}

export function deleteRow(row) {
  [...tableBodyEl.children][row].remove();
  setCellAddresses();
  sendUpdate();
}

export function deleteSelectedRow() {
  if(selectedCell) {
    const row = JSON.parse(selectedCell.attributes['data-address'].value)[0];
    const col = JSON.parse(selectedCell.attributes['data-address'].value)[1]
    unselectCell();
    deleteRow(row);
    if(tableBodyEl.rows[row])
      selectCellByCoord(row, col, true);
  }
}

export function copySelectedRow() {
  if(!selectedCell)
    return;
  const row = JSON.parse(selectedCell.attributes['data-address'].value)[0];
  const col = JSON.parse(selectedCell.attributes['data-address'].value)[1];
  unselectCell();
  const cloneEl = [...tableBodyEl.children][row].cloneNode(true); 
  var newRowEl = tableBodyEl.insertRow(row + 1);
  newRowEl.replaceWith(cloneEl);
  setCellAddresses();
  selectCellByCoord(row + 1, col, false);
}

function setCellAddresses() {
  [...tableBodyEl.rows].forEach((row, i) => {
    [...row.cells].forEach((cell, j) => {
      cell.setAttribute('data-address', `[${i},${j}]`);
    });
  });
}