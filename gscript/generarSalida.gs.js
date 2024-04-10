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

function showCell(t, row, col, cargos, frecuencia) {
  const value = cargos.reduce((total, [, importe]) => total + importe, 0);
  let color = 'white';
  let estimate = '';
  if (frecuencia && col > frecuencia) {
    estimate = t.getRange(row, col - frecuencia).getValue();
    if (estimate) {
      const err = Math.abs(1 - value / estimate);
      if (err > 0.3) color = 'red';
      else if (err > 0.2) color = 'pink';
      else if (err > 0.1) color = 'yellow';
    }
  }
  t
    .getRange(row, col)
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
        const cargos = entries[ym];
        const col = colIndex + 2;
        if (cargos) {
          showCell(t, row, col, cargos, frecuencia);
        } else {
          if (col === cols) {
            if (frecuencia) {
              const val = t.getRange(row, col - frecuencia).getDisplayValue();
              if (val) {
                t.getRange(row, col).setValue(val).setBackground(ESTIMATE);
              }
            }
          }
        }
      });
      addRowFormulas(t, row, cols + 3);
    }
  });

  showSaldos(t, rows + 1);
  addBottomFormulas(t, rows + 2, cols);
  t.autoResizeColumn(1);
  t.getRange(1, t.getLastColumn()).activateAsCurrentCell();
}
