function procesarArchivo(id) {
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

  // end of private functions

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
