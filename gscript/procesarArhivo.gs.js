function procesarArchivo(formEl) {
  const h = sh.historico;

  // private functions
  const filterNewRows = (movs) => {
    const lastHistoryRow = h.getLastRow();
    if (lastHistoryRow === 0) return movs;
    const historico = h.getRange(1, 1, lastHistoryRow, 4).getValues();
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
  const rx =
    /^\d{2}\/\d{2}\/\d{4}\|.+\|\d{2}\/\d{2}\/\d{4}\|[\d\.\-]+\|[\d\.\-]+\|/;

  const readMovimientos = (movs) =>
    movs
      .trim()
      .split('\n')
      .map((row) => {
        if (rx.test(row)) {
          const [d, c, _, i, s] = row.split('|');
          const fecha = Fecha.fromSabadell(d);
          return [fecha, c.toUpperCase().trim(), parseFloat(i), parseFloat(s)];
        } else {
          throw new Error('Malformed line in file');
        }
      })
      .reverse();

  // end of private functions

  sSheet.setActiveSheet(h);
  sSheet.toast(`Recibiendo archivo`);
  const contents = formEl.inputFile.getDataAsString('ISO-8859-1');
  try {
    const movs = readMovimientos(contents);

    const newMovs = filterNewRows(movs);
    if (newMovs.length === 0) {
      sSheet.toast('No hay movimientos nuevos que agregar', '', 15);
      return;
    }
    h.getRange(h.getLastRow() + 1, 1, newMovs.length, 4)
      .activate()
      .setValues(newMovs.map(([f, ...rest]) => [f.toDate(), ...rest]));
  } catch (err) {
    ui.alert(err);
    return;
  }
  sSheet.toast('Listo');
}
