const getImportado = () =>
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Importado');
const getHistorico = () =>
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Histórico');
const getConocidos = () =>
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Conocidos');
const getTotales = () =>
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Totales');
const getArchivos = () =>
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archivos');

function listFiles() {
  const folders = DriveApp.getFoldersByName('Gastos');
  const textFiles = [];
  while (folders.hasNext()) {
    const folder = folders.next();
    const files = folder.getFilesByType(MimeType.PLAIN_TEXT);
    while (files.hasNext()) {
      textFiles.push(files.next());
      // Logger.log(file.getId() + ' - ' + file.getName() + ' - ' + file.getSize())
    }
  }
  return textFiles;
}

/*
function onOpen() {
  ui
    .createMenu('Mi Menú')
    .addItem('qq','qq')
    .addItem('mostrar','mostrar')
    .addItem('Importar', 'importar')
    .addItem('Sumario', 'sumario')
    .addToUi();

}
*/

function uniqueConceptos() {
  const importado = getImportado();
  const muestra =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Muestra');
  muestra.clear();
  const range = importado.getRange('b:b');
  const lastRow = range.getLastRow();
  const values = range.getValues();
  const conceptos = {};
  for (let row = 0; row < lastRow; row++) {
    const c = values[row][0];
    if (c in conceptos) {
      conceptos[c] += 1;
    } else {
      conceptos[c] = 1;
    }
  }
  const sorted = Object.entries(conceptos).sort((a, b) => b[1] - a[1]);

  muestra.getRange(1, 1, sorted.length, 2).setValues(sorted);
}

function importar() {
  const importado = getImportado();
  const historico = getHistorico();
  const lastHistoryRow = historico.getLastRow();

  const parseDate = (ds) =>
    new Date(
      ds.replace(/(\d+)\/(\d+)\/(\d+)/, (_, d, m, y) => [y, m, d].join('-'))
    );

  const entries = importado
    .getRange(1, 1, importado.getLastRow(), 1)
    .getValues()
    .map((row) => {
      const [d, c, _, i, s] = row[0].split('|');
      return [
        parseDate(d),
        c.toUpperCase().trim(),
        parseFloat(i),
        parseFloat(s),
      ];
    });

  const lastData = lastHistoryRow
    ? historico.getRange(lastHistoryRow, 1, 1, 4).getValues()[0]
    : [new Date(), '', 0, 0];
  const firstDuplicate = entries.findIndex((row) =>
    row.every((cell, i) =>
      i ? cell === lastData[i] : cell.getTime() === lastData[i].getTime()
    )
  );
  switch (firstDuplicate) {
    case -1:
      break;
    case 0:
      return;
    default:
      entries.splice(firstDuplicate);
  }
  historico
    .getRange(lastHistoryRow + 1, 1, entries.length, 4)
    .setValues(entries.reverse());
}

const ymKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getUseComma = (cell) => {
  cell.setNumberFormat('#.#');
  cell.setValue(1.1);
  console.log(cell.getDisplayValue());
  return cell.getDisplayValue().includes(',');
};

function sumario() {
  const conocidos = getConocidos();
  const lastRowConocidos = conocidos.getLastRow();

  const totales = getTotales();

  const useComma = getUseComma(totales.getRange(1, 1));
  totales.clear();
  const historico = getHistorico();
  const lastHistoryRow = historico.getLastRow();

  const earliestDate = historico.getRange(1, 1).getValue();

  const latestDate = historico.getRange(lastHistoryRow, 1).getValue();
  const filas = conocidos
    .getRange(1, 1, lastRowConocidos, 1)
    .getValues()
    .flat();
  filas.push('----------------');

  const movimientos = historico.getRange(1, 1, lastHistoryRow, 4).getValues();
  const movHash = {};
  movimientos.forEach(([date, concepto, importe, saldo]) => {
    const ym = ymKey(date);
    if (!(ym in movHash)) {
      movHash[ym] = {};
    }
    const ymEntry = movHash[ym];
    const short = filas.find((s) => concepto.includes(s));
    if (short) {
      if (short in ymEntry) {
        ymEntry[short] = `${ymEntry[short]}+${importe}`;
      } else {
        ymEntry[short] = importe;
      }
    } else {
      filas.push(concepto);
      if (concepto in ymEntry) {
        ymEntry[concepto] = `${ymEntry[concepto]}+${importe}`;
      } else {
        ymEntry[concepto] = importe;
      }
    }
  });

  filas.forEach((concepto, index) => {
    const cell = totales.getRange(index + 2, 1);
    if (concepto.trim().startsWith('-')) {
      cell.setValue(concepto.replace('-', '').trim());
      cell.setFontWeight('bold');
      cell.setFontSize(20);
    } else {
      cell.setValue(concepto);
    }
  });
  for (
    let date = new Date(earliestDate.getFullYear(), earliestDate.getMonth()),
      col = 2;
    date.valueOf() <= latestDate.valueOf();
    date = new Date(date.getFullYear(), date.getMonth() + 1, 1), col++
  ) {
    totales.getRange(1, col).setValue(date);
    const ymEntries = movHash[ymKey(date)];
    filas.forEach((concepto, index) => {
      let val = ymEntries[concepto];
      const cell = totales.getRange(index + 2, col);
      if (typeof val === 'string') {
        if (useComma) val = val.replaceAll('.', ',');
        cell.setFormula(`=${val.replaceAll('+-', '-')}`);
        cell.setFontColor('blue');
      } else {
        cell.setValue(ymEntries[concepto]);
      }
    });
  }
  totales.getRange(1, 1, 1, totales.getLastColumn()).setNumberFormat('MM/yyy');
  totales
    .getRange(1, totales.getLastColumn(), totales.getLastRow(), 1)
    .activate();
}
