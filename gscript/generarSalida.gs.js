const saldos = [];

function generarSalida() {
  const t = sh.totales;
  sSheet.setActiveSheet(t);
  t.clear().clearNotes().setFrozenColumns(1); // warning: does not chain

  const hash = getHistoricoHash();
  const cols = monthsArray.length;
  const rows = headings.length;
  const rowValues = [];
  const rowNotes = [];
  const rowColors = [];

  // Private functions
  const showHeading = (heading) => {
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
  };

  const setCell = (col, cargos, frecuencia) => {
    let value = '';
    let color = 'white';
    let note = '';

    if (cargos) {
      value = cargos.reduce((total, [, importe]) => total + importe, 0);
      let estimate = '';
      if (frecuencia && col >= frecuencia) {
        estimate = rowValues[col - frecuencia];
        if (estimate) {
          color = changeColor(estimate, value);
        }
      }
      note = l`
        Cargos:
          ${cargos
            .map(
              ([fecha, importe, concepto]) =>
                `
                  ${fecha}: ${formatCurrency(importe)}
                  ${concepto ?? ''}
                `
            )
            .join('\n')}
        ${
          estimate
            ? `Estimado: ${formatCurrency(estimate)}
              de hace ${frecuencia} mes[es]`
            : ''
        }
      `;
    } else {
      if (frecuencia && col === cols - 1) {
        const val = rowValues[col - frecuencia];
        if (val) {
          value = val;
          color = ESTIMATE;
          note = `Estimado de hace ${frecuencia} mes[es]`;
        }
      }
    }
    rowValues[col] = value;
    rowColors[col] = color;
    rowNotes[col] = note;
  };

  const showSaldos = (saldosRow) => {
    t.getRange(saldosRow, 1)
      .setValue('Saldos')
      .setFontSize(BIG_FONT)
      .setFontWeight('bold')
      .setBackground(BKG_BAND);
    t.getRange(saldosRow, 2, 1, saldos.length)
      .setValues([saldos])
      .setNumberFormat(NUMBER_FORMAT)
      .setBackground(BKG_BAND);
  };

  const showTests = (row) => {
    t.getRange(row, 1, 2, 1).setValues([
      [HEADINGS.ANTES_TARJETA],
      [HEADINGS.ANTES_ALQUILER],
    ]);
    const tarj = hash[HEADINGS.ANTES_TARJETA];
    const alq = hash[HEADINGS.ANTES_ALQUILER];
    t.getRange(row, 2, 2, cols)
      .setValues([
        monthsArray.map((ym) => (tarj[ym] ? tarj[ym][0][1] : '')),
        monthsArray.map((ym) => (alq[ym] ? alq[ym][0][1] : '')),
      ])
      .setNumberFormat(NUMBER_FORMAT);
  };

  const addBottomFormulas = (row) => {
    t.getRange(row, 3, 1, cols - 1)
      .setFormulasR1C1([
        Array(cols - 1).fill('=sum(R2C:R[-7]C) + R[-2]C[-1] - R[-2]C'),
      ])
      .setNumberFormat(NUMBER_FORMAT);
  };

  const addRowFormulas = (row, col) => {
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
  };
  const addEstimateCalculation = (row, col) => {
    t.getRange(row, col, 5, 1).setValues([
      ['Saldo mes pasado'],
      ['Gastos del mes'],
      ['Estimados antes alquiler'],
      ['Tarjeta'],
      ['Faltante'],
    ]);
    t.getRange(row, col + 1, 5, 1).setFormulasR1C1([
      ['R[-3]C[-3]'],
      ['sum(R2C[-2]:R[-6]C[-2])'],
      ['sum(R2C[-1]:R[-7]C[-1])'],
      ['0'],
      ['max(R[-1]C - sum(R[-2]C:R[-4]C);0)'],
    ]);
  };
  // end of private functions

  headings.forEach(([heading, frecuencia], rowIndex) => {
    const row = rowIndex + 1;
    if (heading.startsWith('-')) {
      showHeading(heading);
    } else {
      t.getRange(row, 1).setValue(heading);
      const entries = hash[heading] ?? {};
      monthsArray.forEach((ym, colIndex) => {
        setCell(colIndex, entries[ym], frecuencia);
      });
      t.getRange(row, 2, 1, cols)
        .setValues([rowValues])
        .setNumberFormat(NUMBER_FORMAT)
        .setBackgrounds([rowColors])
        .setNotes([rowNotes]);
      const estimado = estimados[heading];
      if (estimado) {
        t.getRange(row, cols + 2)
          .setFormulaR1C1(estimado.formula)
          .setNote(estimado.note)
          .setNumberFormat(NUMBER_FORMAT)
          .setBackground(ESTIMATE);
      }
      addRowFormulas(row, cols + 3);
    }
  });

  showSaldos(rows + 1);
  showTests(rows + 10);
  addBottomFormulas(rows + 2);
  addEstimateCalculation(rows + 4, cols + 2);
  t.autoResizeColumn(1);
  t.getRange(t.getLastRow(), t.getLastColumn()).activateAsCurrentCell();
}
