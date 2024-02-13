const readMovimientos = (movs) =>
  movs
    .trim()
    .split('\n')
    .map((row) => {
      const [d, c, _, i, s] = row.split('|');
      const fecha = Fecha.fromSabadell(d);
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
    .reduce((hash, [date, concepto, importe]) => {
      if (!date) return hash;
      const fecha = new Fecha(date);
      if (fecha.compare(startDate) < 0) startDate = fecha;
      if (fecha.compare(endDate) > 0) endDate = fecha;
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
        entry[ym].push([fecha, importe]);
      } else {
        entry[ym] = [[fecha, importe]];
      }
      return hash;
    }, {});
}

const monthsArray = [];
function generateMonthsArray() {
  startDate.loopUntilMonth((f) => monthsArray.push(f.ym), endDate);
}

function showHeading(heading) {
  const t = sh.totales;
  t.appendRow([
    heading.substring(2).trim(),
    ...monthsArray.map(Fecha.ymToString),
  ]);
  t.getRange(t.getLastRow(), 1).setFontSize(16);
  t.getRange(t.getLastRow(), 1, 1, t.getLastColumn())
    .setBackground('lightgrey')
    .setBorder(true, true, null, null, null, null)
    .setVerticalAlignment('middle')
    .setFontWeight('bold')
    .offset(0, 1)
    .setHorizontalAlignment('center');
}

function showCell(cargos, range) {
  if (cargos.length) {
    range
      .setValue(cargos.reduce((total, [, importe]) => total + importe, 0))
      .setNumberFormat('#0.00')
      .setNote(
        cargos
          .map(([fecha, importe]) => `${fecha}: ${Number(importe).toFixed(2)}`)
          .join('\n')
      );
  }
}

function generarSalida() {
  const t = sh.totales;
  initTables();
  sSheet.setActiveSheet(t);
  t.clear().clearNotes();
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
    }
  });
  t.autoResizeColumn(1);
  t.setFrozenColumns(1);
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

function getUseComma(emptyCell) {
  return emptyCell
    .setNumberFormat('#.#')
    .setValue(1.1)
    .getDisplayValue()
    .includes(',');
}
