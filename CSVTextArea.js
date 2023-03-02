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

export default csvTA;