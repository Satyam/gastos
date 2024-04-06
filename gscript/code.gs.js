const BIG_FONT = 16;
const BKG_BAND = 'lightgrey';
const ESTIMATE = 'lightpink';
const NUMBER_FORMAT = '#,0.00';
const HEADING_VARIOS = 'Varios';

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
let hashCache = null;
let startDate = new Fecha(9999, 12, 30);
let endDate = new Fecha(1, 1, 1);
const saldos = [];
const saldoTarjeta = [];
const saldoAlquiler = [];

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

const findHeading = (concepto) =>
  conocidos[Object.keys(conocidos).find((s) => concepto.includes(s))] ??
  HEADING_VARIOS;

function getHistoricoHash() {
  if (hashCache) return hashCache;
  descHash = {};
  let lastSaldo = 0;
  let lastYMD = null;
  hashCache = sh.historico
    .getDataRange()
    .getValues()
    .reduce((hash, [date, concepto, importe, saldo]) => {
      if (!date) return hash;
      const fecha = new Fecha(date);

      const addToHash = (heading, i = importe) => {
        if (!(heading in hash)) hash[heading] = {};
        const entry = hash[heading];
        const ym = fecha.ym;
        if (ym in entry) {
          entry[ym].push([fecha, i]);
        } else {
          entry[ym] = [[fecha, i]];
        }
        if (heading == HEADING_VARIOS) {
          entry[ym].at(-1).push(concepto);
        }
      };

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
      prevSaldo = lastSaldo;
      lastSaldo = saldo;
      const heading = findHeading(concepto);
      switch (heading) {
        case HEADING_VARIOS:
          if (descHash[concepto]) {
            descHash[concepto].cant += 1;
            descHash[concepto].importe += importe;
          } else {
            descHash[concepto] = { cant: 1, importe };
          }
          break;
        case 'Tarjeta de Crédito':
          addToHash('Saldo antes tarjeta', prevSaldo);
          break;
        case 'Pago alquiler GG':
          addToHash('Saldo antes alquiler', prevSaldo);
          break;
      }
      addToHash(heading);
      return hash;
    }, {});
  saldos.push(lastSaldo);
  return hashCache;
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

function showCell(cargos, rowIndex, colIndex, meses) {
  const t = sh.totales;
  const value = cargos.reduce((total, [, importe]) => total + importe, 0);
  let color = 'white';
  let estimate = '';
  if (meses && colIndex > meses) {
    estimate = t.getRange(rowIndex + 1, colIndex + 2 - meses).getValue();
    if (estimate) {
      const err = Math.abs(1 - value / estimate);
      if (err > 0.3) color = 'red';
      else if (err > 0.2) color = 'pink';
      else if (err > 0.1) color = 'yellow';
    }
  }
  t
    .getRange(rowIndex + 1, colIndex + 2)
    .setValue(value)
    .setNumberFormat(NUMBER_FORMAT)
    .setBackground(color).setNote(`Cargos:
${cargos
  .map(
    ([fecha, importe, concepto]) =>
      `${fecha}: ${Number(importe).toFixed(2)}${
        concepto ? `\n   ${concepto}\n` : ''
      }`
  )
  .join('\n')}
${estimate ? `Estimado: ${Number(estimate).toFixed(2)}` : ''}`);
}

function showSaldos() {
  const t = sh.totales;
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

function showSumas() {
  const t = sh.totales;
  const len = saldos.length;
  const sumasRow = t.getLastRow() + 2;
  t.getRange(sumasRow, 3, 1, len - 1).setFormulasR1C1([
    Array(len - 1).fill('=sum(R2C:R[-7]C) + R[-2]C[-1] - R[-2]C'),
  ]);
}

function generarSalida() {
  const t = sh.totales;
  initTables();
  sSheet.setActiveSheet(t);
  t.clear().clearNotes();
  const hash = getHistoricoHash();

  showDesconocidos();
  generateMonthsArray();
  const lastColIndex = monthsArray.length - 1;
  headings.forEach(([heading, meses], rowIndex) => {
    if (heading.startsWith('-')) {
      showHeading(heading);
    } else {
      t.getRange(rowIndex + 1, 1).setValue(heading);
      const entries = hash[heading] ?? {};
      monthsArray.forEach((ym, colIndex) => {
        const cargos = entries[ym];
        if (cargos) {
          showCell(cargos, rowIndex, colIndex, meses);
        } else {
          // Logger.log({heading, meses, colIndex, lastColIndex})
          if (colIndex === lastColIndex) {
            if (meses) {
              const val = t
                .getRange(rowIndex + 1, colIndex + 2 - meses)
                .getDisplayValue();
              if (val) {
                t.getRange(rowIndex + 1, colIndex + 2)
                  .setValue(val)
                  .setBackground(ESTIMATE);
              }
            }
          }
        }
      });
    }
  });

  showSaldos();
  showSumas();
  t.autoResizeColumn(1);
  t.setFrozenColumns(1);
  t.getRange(1, t.getLastColumn()).activateAsCurrentCell();
}

function generarAlquileres() {
  initTables();
  const a = sh.alquileres;
  a.clear().clearNotes();
  sSheet.setActiveSheet(a);
  const h = getHistoricoHash();
  const cols = endDate.y - startDate.y + 1;

  // Pagos de Alquiler
  {
    const alqs = Array(12);
    const notes = Array(12);
    for (let row = 0; row < 12; row++) {
      alqs[row] = Array(cols);
      notes[row] = Array(cols);
    }

    for (const [ym, entries] of Object.entries(h['Pago alquiler GG'])) {
      const [y, m] = ym.split('-');
      const col = parseInt(y, 10) - startDate.y;
      const row = parseInt(m, 10) - 1;
      for (const [fecha, importe] of entries) {
        alqs[row][col] = (alqs[row][col] ?? 0) + importe;
        notes[row][col] = `${
          notes[row][col] ?? ''
        }${fecha.toString()}: ${Number(importe).toFixed(2)}\n`;
      }
    }
    a.getRange(3, 2, 12, cols)
      .setValues(alqs)
      .setNotes(notes)
      .setNumberFormat(NUMBER_FORMAT);
    const años = Array(cols);
    for (let i = 0; i < cols; i++) {
      años[i] = String(startDate.y + i).padStart(4, '0');
    }
    a.getRange(1, 2, 1, cols)
      .setValues([años])
      .setFontSize(BIG_FONT)
      .setFontWeight('bold');
    a.getRange(2, 1, 1, 1)
      .setValue('Alquileres')
      .setFontSize(BIG_FONT)
      .setFontWeight('bold');
    const meses = Array(12);
    for (let i = 0; i < 12; i++) {
      meses[i] = [Fecha._meses[i]];
    }
    a.getRange(3, 1, 12, 1)
      .setValues(meses)
      //.setFontSize(BIG_FONT)
      .setFontWeight('bold');
    a.getRange(a.getLastRow() + 1, 2, 1, cols)
      .setFormulasR1C1([Array(cols).fill('=sum(R[-12]C:R[-1]C)')])
      .setFontWeight('bold')
      .setNumberFormat(NUMBER_FORMAT)
      .setBorder(true, null, null, null, false, false);
  }
  function gastosVarios(key, heading) {
    const gastos = Array(cols);
    const notes = Array(cols);

    for (const [ym, entries] of Object.entries(h[key])) {
      const [y, m] = ym.split('-');
      const col = parseInt(y, 10) - startDate.y;
      for (const [fecha, importe] of entries) {
        gastos[col] = (gastos[col] ?? 0) + importe;
        notes[col] = `${notes[col] ?? ''}${fecha.toString()}: ${Number(
          importe
        ).toFixed(2)}\n`;
      }
    }
    const row = a.getLastRow() + 1;
    a.getRange(row, 1)
      .setValue(heading)
      .setFontSize(BIG_FONT)
      .setFontWeight('bold');
    a.getRange(row, 2, 1, cols)
      .setValues([gastos])
      .setNumberFormat(NUMBER_FORMAT)
      .setNotes([notes]);
  }
  gastosVarios('Comunidad GG', 'Comunidad');
  gastosVarios('IBI GG', 'IBI');
  gastosVarios('Alquiler contador agua GG', 'Tasa Agua');
  // seguro
  const seguro = Array(cols);
  for (const [ym, entries] of Object.entries(h['Catalana Occidente'])) {
    const [y, m] = ym.split('-');
    if (m === '11') {
      const col = parseInt(y, 10) - startDate.y;
      for (const [fecha, importe] of entries) {
        if (seguro[col]) {
          Logger.log({ fecha, importe });
        }
        seguro[col] = importe;
      }
    }
  }
  const row = a.getLastRow() + 1;
  a.getRange(row, 1)
    .setValue('Seguro')
    .setFontSize(BIG_FONT)
    .setFontWeight('bold');
  a.getRange(row, 2, 1, cols)
    .setValues([seguro])
    .setNumberFormat(NUMBER_FORMAT);
  a.autoResizeColumn(1);
}

function procesarArchivo(id) {
  const h = sh.historico;
  h.getRange(1, h.getLastColumn() || 1).activateAsCurrentCell();
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
