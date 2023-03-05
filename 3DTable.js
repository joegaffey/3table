import * as model from 'model';

export const tableBodyEl = document.querySelector('.spec-table > tbody');
const valSliderEl = document.querySelector('.val-slider');

tableBodyEl.oninput = (e) => { 
  valSliderEl.value = e.target.textContent.trim();
  tableBodyEl.dispatchEvent(new CustomEvent('update', { detail: { data: asCSV() }}));
}

let selectedCell = null;
tableBodyEl.onclick = (e) => {
  let focus = false;
  if(e.pointerType === 'mouse')
    focus = true;
  if(e.target.nodeName !== 'TD')
    return;
  if(!selectedCell)
    selectCell(e.target, focus);
  else if(!e.target.isSelected) {
    unselectCell();
    selectCell(e.target, focus);
  }
  e.stopPropagation();
}

function unselectCell() {
  selectedCell.isSelected = false;
  selectedCell.contentEditable = false;
  selectedCell.style.background = selectedCell.originalColor;
  selectedCell.style.outline = 'none';
  selectedCell = null;
  valSliderEl.disabled = true;
}

function selectCell(el, focus) {
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
    if(Number.isInteger(row)) {
      model.highlightRow(row);
    }
    if(isNaN(selectedCell.innerText))
      valSliderEl.disabled = true;
    else {
      valSliderEl.disabled = false;
      setSliderRange(JSON.parse(selectedCell.attributes['data-address'].value)[1]);
    }
  }
}

function setSliderRange(col) {
  if(col < 5) {
    valSliderEl.max = model.size / 100;
    valSliderEl.min = 0;
    valSliderEl.step = 0.01;
  }
  else if(col < 8) {
    valSliderEl.max = model.size / 2;
    valSliderEl.min = model.size / -2;
    valSliderEl.step = 1;
  }
  else {
    valSliderEl.max = 180;
    valSliderEl.min = -180;
    valSliderEl.step = 1;
  }
}

valSliderEl.oninput = e => {
  if(selectedCell)
    selectedCell.innerText = valSliderEl.value;
  tableBodyEl.dispatchEvent(new CustomEvent('update', { detail: { data: asCSV() }}));
  if(selectedCell.attributes['data-address']) {
    const row = JSON.parse(selectedCell.attributes['data-address'].value);
    if(Number.isInteger(row[0]))
      model.highlightRow(row[0]);
  }
};

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

export function addPart(part, parent) {
  const rowNum = tableBodyEl.rows.length;
  const row = tableBodyEl.insertRow(-1);
  [part,parent,1,1,1,0,0,0,0,0,0].map((val, i) => { 
    const cell = row.insertCell(i);
    cell.innerHTML = val;
    cell.setAttribute('data-address', JSON.stringify([rowNum, i]));
  });
  tableBodyEl.dispatchEvent(new CustomEvent('update', { detail: { data: asCSV() }}));
}

export function deleteRow(id) {
  console.log(id);
  unselectCell();
  [...tableBodyEl.children][id].remove();
  tableBodyEl.dispatchEvent(new CustomEvent('update', { detail: { data: asCSV() }}));
}

export function deleteSelectedRow(id) {
  if(selectedCell)
    deleteRow(JSON.parse(selectedCell.attributes['data-address'].value)[0]);
}