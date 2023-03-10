const csvTA = document.querySelector('#ta');

csvTA.lineComplete = () => {
  console.log('@ToDo lineComplete');
}

csvTA.wordComplete = () => {
  console.log('@ToDo wordComplete');
}

csvTA.getCaretRow = () => {
  const pos = csvTA.selectionStart;
  const rows = csvTA.value.split('\n');
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    count += (rows[i].length + 1);
    if(count > pos)
      return i;
  }
  return -1;
}

csvTA.getCaretCell = () => {
  const pos = csvTA.selectionStart;
  const rows = csvTA.value.split('\n');
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const lastCount = count;
    count += (rows[i].length + 1);
    if(count > pos) {
      const rowPos = pos - lastCount;
      const cellIndex = rows[i].substring(rowPos).split(',').length;
      return cellIndex;
    }
  }
  return -1;
}

csvTA.getCaretAddress = () => {
  const pos = csvTA.selectionStart;
  const rows = csvTA.value.split('\n');
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const lastCount = count;
    count += (rows[i].length + 1);
    if(count > pos) {
      const rowPos = pos - lastCount;
      const cellIndex = rows[i].substring(0, rowPos).split(',').length - 1;
      return [i, cellIndex];
    }
  }
  return null;
}

export default csvTA;