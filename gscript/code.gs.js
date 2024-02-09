/*class Sample {
  [Symbol.toPrimitive](hint) {
    Logger.log('symbol')
    return `${a}-${b}`;
  }
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  toString() {
    Logger.log('toString')
    return `${a}-${b}`;
  }
  valueOf() {
    Logger.log('valueOf')
    return `${a}-${b}`;
  }
}

function test() {
  const sample = new Sample(1, 2);
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(1, 7).setValue(sample)
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

function qq() {
  Logger.log(
    filterNewRows(
      readMovimientos(`24/12/2023|BONIFIC. COMISION MANTENIMIENTO|24/12/2023|50.00|1200.00||
24/12/2023|INTERESES Y/O COMISIONES|24/12/2023|-60.00|1150.00||
18/12/2023|PAGO BIZUM CAROLINA PATRICIA FALCONE|18/12/2023|-30.00|1210.00||593550867514
11/12/2023|ELECTRICIDAD ENERGIA XXI ENERGIA XXI FACTU|11/12/2023|-29.52|1240.00|B82846825070|040043563056
07/12/2023|TELEFONOS TELEFONICA DE ESPANA SAU FIJOxxxxxxxxx.dic|07/12/2023|-127.90|1269.52|A82018474002|X00112719817
04/12/2023|IMPUESTOS AJUNTAMENT DE BARCELONA|04/12/2023|-105.46|1397.42|P0801900B001|01266888J   0658
`)
    )
  );
}

let startDate = new Fecha(9999, 12, 30),
  endDate = new Fecha(1, 1, 1);

const readMovimientos = (movs) =>
  movs
    .trim()
    .split('\n')
    .map((row) => {
      const [d, c, _, i, s] = row.split('|');
      const fecha = Fecha.fromSabadell(d);
      if (fecha < startDate) startDate = fecha;
      if (fecha > endDate) endDate = fecha;
      return [fecha, c.toUpperCase().trim(), parseFloat(i), parseFloat(s)];
    })
    .reverse();

const filterNewRows = (movs) => {
  const lastHistoryRow = sh.historico.getLastRow();
  if (lastHistoryRow === 1) return movs;
  const historico = sh.historico.getRange(1, 1, lastHistoryRow, 4).getValues();
  const h1 = sh.historico.getDataRange().getValues();
  const lastYMD = historico.at(-1)[0];
  const ultimos = historico.filter((row) => row[0] === lastYMD);
  const lastFecha = new Fecha(lastYMD);
  return movs.filter(([f, c, i, s], index) => {
    const fDiff = f.compare(lastFecha);
    if (fDiff > 0) return true;
    if (fDiff < 0) return false;
    return !ultimos.some(([f1, c1, i1, s1]) => {
      return c === c1 && i === i1 && s === s1;
    });
  });
};

function procesarArchivo(id) {
  const contents = DriveApp.getFileById(id).getBlob().getDataAsString();
  const movs = readMovimientos(contents);

  const newMovs = filterNewRows(movs);
  if (newMovs.length === 0) {
    sSheet.toast('No hay movimientos nuevos que agregar', '', 15);
    return;
  }
  sh.archivos
    .getRange(1, 7, newMovs.length, 4)
    .setValues(newMovs.map(([f, ...rest]) => [f.toDate(), ...rest]));
  newMovs.forEach(([f, ...rest]) =>
    sh.historico.appendRow([f.toDate(), ...rest])
  );
  sSheet.toast('Listo');
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
