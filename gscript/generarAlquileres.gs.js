function generarAlquileres() {
  const a = sh.alquileres;
  a.clear().clearNotes();
  sSheet.setActiveSheet(a);
  const h = getHistoricoHash();
  const cols = endDate.y - startDate.y + 1;

  const pagosAlquiler = () => {
    const alqs = Array(12);
    const notes = Array(12);
    for (let row = 0; row < 12; row++) {
      alqs[row] = Array(cols);
      notes[row] = Array(cols);
    }

    for (const [ym, entries] of Object.entries(h[HEADINGS.ALQUILER_GG])) {
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
    const anyos = Array(cols);
    for (let i = 0; i < cols; i++) {
      anyos[i] = String(startDate.y + i).padStart(4, '0');
    }
    a.getRange(1, 2, 1, cols)
      .setValues([anyos])
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
  };
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

  const pagoSeguro = () => {
    const seguro = Array(cols);
    const notes = Array(cols);
    for (const [ym, entries] of Object.entries(h[HEADINGS.CATALANA])) {
      const [y, m] = ym.split('-');
      if (m === '11') {
        const col = parseInt(y, 10) - startDate.y;
        for (const [fecha, importe] of entries) {
          notes[col] = `${notes[col] ?? ''}${fecha.toString()}: ${Number(
            importe
          ).toFixed(2)}\n`;
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
      .setNumberFormat(NUMBER_FORMAT)
      .setNotes([notes]);
  };

  const copyAlqIRPF = () => {
    const u = sh.alqIRPF.clear();
    const lastRow = a.getLastRow();
    a.getRange(1, 1, lastRow).copyTo(u.getRange(1, 1, lastRow));
    a.getRange(1, cols, lastRow).copyTo(u.getRange(1, 2, lastRow));

    const extraRows = sh.extrasAlq.getLastRow() - 1;

    const extras = extraRows
      ? sh.extrasAlq
          .getRange(2, 1, extraRows, 3)
          .getValues()
          .filter((row) => row[0].getFullYear() === endDate.y - 1)
      : [];
    if (extras.length) {
      u.getRange(lastRow + 2, 1, 1, 3)
        .setValues([['Fecha', 'Importe', 'Concepto']])
        .setFontSize(BIG_FONT)
        .setFontWeight('bold');
      u.getRange(lastRow + 3, 1, extras.length, 3)
        .setValues(extras)
        .setNumberFormats(
          Array(extras.length).fill(['dd/mmm/yyyy', NUMBER_FORMAT, ''])
        );
    }
  };

  pagosAlquiler();
  gastosVarios(HEADINGS.COMUNIDAD_GG, 'Comunidad');
  gastosVarios(HEADINGS.IBI_GG, 'IBI');
  gastosVarios(HEADINGS.CONTADOR_AGUA_GG, 'Tasa Agua');
  pagoSeguro();

  a.getRange(1, 1).setValue(`Gran de Gracia 231 Pr.1ª
9142108DF2894A0004JQ`);
  a.autoResizeColumn(1);
  copyAlqIRPF();
}
