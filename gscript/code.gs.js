/*
function qq() {
  Logger.log(filterNewRows(readMovimientos(`24/12/2023|BONIFIC. COMISION MANTENIMIENTO|24/12/2023|50.00|1200.00||
24/12/2023|INTERESES Y/O COMISIONES|24/12/2023|-60.00|1150.00||
18/12/2023|PAGO BIZUM CAROLINA PATRICIA FALCONE|18/12/2023|-30.00|1210.00||593550867514
11/12/2023|ELECTRICIDAD ENERGIA XXI ENERGIA XXI FACTU|11/12/2023|-29.52|1240.00|B82846825070|040043563056
07/12/2023|TELEFONOS TELEFONICA DE ESPANA SAU FIJOxxxxxxxxx.dic|07/12/2023|-127.90|1269.52|A82018474002|X00112719817
04/12/2023|IMPUESTOS AJUNTAMENT DE BARCELONA|04/12/2023|-105.46|1397.42|P0801900B001|01266888J   0658
`)))
}
*/

const readMovimientos = (movs) =>
  movs
    .trim()
    .split('\n')
    .map((row) => {
      const [d, c, _, i, s] = row.split('|');
      const fecha = Fecha.fromSabadell(d);
      //    if (fecha < startDate) startDate = fecha;
      //    if (fecha > endDate) endDate = fecha;
      return [fecha, c.toUpperCase().trim(), parseFloat(i), parseFloat(s)];
    })
    .reverse();

const filterNewRows = (movs) => {
  const lastHistoryRow = sh.historico.getLastRow();
  if (lastHistoryRow === 1) return movs;
  const historico = sh.historico.getRange(1, 1, lastHistoryRow, 4).getValues();
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
let descHash = {};
let startDate = new Fecha(9999, 12, 30);
let endDate = new Fecha(1, 1, 1);

function showDesconocidos() {
  sh.desconocidos.clear();
  const desc = Object.entries(descHash);
  if (desc.length) {
    sh.desconocidos
      .getRange(1, 1, desc.length + 1, 2)
      .setValues([['Concepto', 'Ocurrencias'], ...desc])
      .sort({ column: 2, ascending: false });
  }
}

function getHistoricoHash() {
  descHash = {};
  const conocidosKeys = Object.keys(conocidos);
  return sh.historico
    .getDataRange()
    .getValues()
    .reduce((hash, row) => {
      if (!row[0]) return hash;
      const fecha = new Fecha(row[0]);
      if (fecha.compare(startDate) < 0) startDate = fecha;
      if (fecha.compare(endDate) > 0) endDate = fecha;
      const concepto = row[1];
      const short = conocidosKeys.find((s) => concepto.includes(s));
      if (!short) {
        if (descHash[concepto]) {
          descHash[concepto] += 1;
        } else {
          descHash[concepto] = 1;
        }
        return hash;
      }
      const heading = conocidos[short].heading;
      if (!(heading in hash)) hash[heading] = {};
      const entry = hash[heading];
      const ym = fecha.ym;
      if (ym in entry) {
        entry[ym].push(row);
      } else {
        entry[ym] = [row];
      }
      return hash;
    }, {});
}

const monthsArray = [];
function generateMonthsArray() {
  for (let f = startDate; f <= endDate; f.addMonths(1)) {
    monthsArray.push(f.ym);
  }
}

function showHeading(heading) {
  const t = sh.totales;
  t.appendRow([
    heading.substring(2).trim(),
    ...monthsArray.map(Fecha.ymToString),
  ]);
  t.getRange(t.getLastRow(), 1).setFontSize(16).setFontWeight('bold');
  t.getRange(t.getLastRow(), 1, 1, t.getLastColumn())
    .setBackground('silver')
    .setBorder(true, true, null, null, null, null)
    .setVerticalAlignment('middle');
}

function showCell(cargos, range) {
  if (cargos.length) {
    range.setValue(
      cargos.reduce(
        (total, [fecha, concepto, importe, saldo]) => total + importe,
        0
      )
    );
  }
}

function generarSalida() {
  const t = sh.totales;
  initTables();
  sSheet.setActiveSheet(t);
  t.clear();
  const hash = getHistoricoHash();

  showDesconocidos();
  generateMonthsArray();
  headings.forEach((heading, rowIndex) => {
    if (heading.startsWith('-')) {
      showHeading(heading);
    } else {
      t.getRange(rowIndex + 1, 1).setValue(heading);
      const entries = hash[heading] ?? {};
      monthsArray.forEach((ym, colIndex) => {
        const cargos = entries[ym] ?? [];
        showCell(cargos, t.getRange(rowIndex + 1, colIndex + 2));
      });

      t.getRange(t.getLastRow(), 2, 1, t.getLastColumn() - 1).setNumberFormat(
        '#0.00'
      );
    }
  });
  t.autoResizeColumn(1);
}
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
  generarSalida();
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
