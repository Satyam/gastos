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
  a.getRange(1, 1).setValue(`Gran de Gracia 231 Pr.1ª
9142108DF2894A0004JQ`);
  a.autoResizeColumn(1);
}
