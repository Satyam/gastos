const BIG_FONT = 16;
const BKG_BAND = 'lightgrey';
const NUMBER_FORMAT = '#0.00';

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
  if (lastHistoryRow === 0) return movs;
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
const saldos = [];

function showDesconocidos() {
  sh.desconocidos.clear();
  const desc = Object.entries(descHash);
  if (desc.length) {
    sh.desconocidos
      .getRange(1, 1, desc.length + 1, 3)
      .setValues([
        ['Concepto', 'Ocurrencias', 'Total'],
        ...desc.map(([concepto, info]) => [concepto, info.cant, info.importe]),
      ])
      .sort([
        { column: 3, ascending: false },
        { column: 2, ascending: false },
      ]);
  }
}

function getHistoricoHash() {
  descHash = {};
  let lastSaldo = 0;
  let lastYMD = null;
  const conocidosKeys = Object.keys(conocidos);
  const hash = sh.historico
    .getDataRange()
    .getValues()
    .reduce((hash, [date, concepto, importe, saldo]) => {
      if (!date) return hash;
      const fecha = new Fecha(date);
      if (fecha.compare(startDate) < 0) startDate = fecha;
      if (fecha.compare(endDate) > 0) endDate = fecha;
      if (lastYMD) {
        if (fecha.ym > lastYMD) {
          lastYMD = fecha.ym;
          saldos.push(lastSaldo);
        }
      } else {
        lastYMD = fecha.ym;
      }
      lastSaldo = saldo;
      const short = conocidosKeys.find((s) => concepto.includes(s));
      if (!short) {
        if (descHash[concepto]) {
          descHash[concepto].cant += 1;
          descHash[concepto].importe += importe;
        } else {
          descHash[concepto] = { cant: 1, importe };
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
  saldos.push(lastSaldo);
  return hash;
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
  t.getRange(t.getLastRow(), 1).setFontSize(BIG_FONT);
  t.getRange(t.getLastRow(), 1, 1, t.getLastColumn())
    .setBackground(BKG_BAND)
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
      .setNumberFormat(NUMBER_FORMAT)
      .setNote(
        cargos
          .map(([fecha, importe]) => `${fecha}: ${Number(importe).toFixed(2)}`)
          .join('\n')
      );
  }
}

function showSaldos() {
  t = sh.totales;
  const saldosRow = t.getLastRow() + 2;
  t.getRange(saldosRow, 1)
    .setValue('Saldos')
    .setFontSize(BIG_FONT)
    .setFontWeight('bold')
    .setBackground(BKG_BAND);
  t.getRange(saldosRow, 2, 1, saldos.length)
    .setValues([saldos])
    .setNumberFormat(NUMBER_FORMAT)
    .setBackground(BKG_BAND);
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
  showSaldos();
  t.autoResizeColumn(1);
  t.setFrozenColumns(1);
  t.getRange(1, t.getLastColumn()).activateAsCurrentCell();
}

function procesarArchivo(id) {
  const h = sh.historico;
  h.getRange(1, h.getLastColumn()).activateAsCurrentCell();
  sSheet.setActiveSheet(h);
  const file = DriveApp.getFileById(id);
  sSheet.toast(`Leyendo archivo ${file.getName()}`);
  const contents = file.getBlob().getDataAsString('ISO-8859-1');
  const movs = readMovimientos(contents);

  const newMovs = filterNewRows(movs);
  if (newMovs.length === 0) {
    sSheet.toast('No hay movimientos nuevos que agregar', '', 15);
    return;
  }
  h.getRange(h.getLastRow() + 1, 1, newMovs.length, 4).setValues(
    newMovs.map(([f, ...rest]) => [f.toDate(), ...rest])
  );
  sSheet.toast('Generando salidas');
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
