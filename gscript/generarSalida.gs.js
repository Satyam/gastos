const saldos = [];

function showHeading(t, heading) {
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

const $values = [];
const $notes = [];
const $colors = [];

function setCell(col, cols, cargos, frecuencia) {
  let value = '';
  let color = 'white';
  let note = '';

  if (cargos) {
    value = cargos.reduce((total, [, importe]) => total + importe, 0);
    let estimate = '';
    if (frecuencia && col >= frecuencia) {
      estimate = $values[col - frecuencia];
      if (estimate) {
        const err = Math.abs(1 - value / estimate);
        if (err > 0.3) color = 'red';
        else if (err > 0.2) color = 'pink';
        else if (err > 0.1) color = 'yellow';
      }
    }
    note = `Cargos:
${cargos
  .map(
    ([fecha, importe, concepto]) =>
      `${fecha}: ${formatCurrency(importe)}${
        concepto ? `\n   ${concepto}\n` : ''
      }`
  )
  .join('\n')}
${estimate ? `Estimado: ${formatCurrency(estimate)}` : ''}`;
  } else {
    if (frecuencia && col === cols - 1) {
      const val = $values[col - frecuencia];
      if (val) {
        value = val;
        color = ESTIMATE;
      }
    }
  }
  $values[col] = value;
  $colors[col] = color;
  $notes[col] = note;
}

function showSaldos(t, saldosRow) {
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

function addBottomFormulas(t, row, cols) {
  t.getRange(row, 3, 1, cols - 1)
    .setFormulasR1C1([
      Array(cols - 1).fill('=sum(R2C:R[-7]C) + R[-2]C[-1] - R[-2]C'),
    ])
    .setNumberFormat(NUMBER_FORMAT);
}

function addRowFormulas(t, row, col) {
  t.getRange(row, col, 1, 4)
    .setFormulasR1C1([
      [
        '=SUM(RC[-2]:RC2)/COLUMNS(RC[-2]:RC2)',
        '=RC[-1]* 12',
        '=RC[1] / 12',
        '=SUM(RC[-5]:RC[-16])',
      ],
    ])
    .setNumberFormat(NUMBER_FORMAT);
}

function generarSalida() {
  const t = sh.totales;
  initTables();
  sSheet.setActiveSheet(t);
  t.clear().clearNotes().setFrozenColumns(1); // warning: does not chain

  const hash = getHistoricoHash();

  const cols = monthsArray.length;
  const rows = headings.length;
  headings.forEach(([heading, frecuencia], rowIndex) => {
    const row = rowIndex + 1;
    if (heading.startsWith('-')) {
      showHeading(t, heading);
    } else {
      t.getRange(row, 1).setValue(heading);
      const entries = hash[heading] ?? {};
      monthsArray.forEach((ym, colIndex) => {
        setCell(colIndex, cols, entries[ym], frecuencia);
      });
      t.getRange(row, 2, 1, cols)
        .setValues([$values])
        .setNumberFormat(NUMBER_FORMAT)
        .setBackgrounds([$colors])
        .setNotes([$notes]);
      addRowFormulas(t, row, cols + 3);
    }
  });

  showSaldos(t, rows + 1);
  addBottomFormulas(t, rows + 2, cols);
  t.autoResizeColumn(1);
  t.getRange(1, t.getLastColumn()).activateAsCurrentCell();
}
