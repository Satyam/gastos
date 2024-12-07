let hashCache = null;
let startDate = null;
let endDate = null;
const monthsArray = [];

function getHistoricoHash() {
  if (hashCache) return hashCache;
  initTables();

  // Private functions only used here
  const findHeading = (concepto) =>
    conocidos[Object.keys(conocidos).find((s) => concepto.includes(s))] ??
    HEADINGS.VARIOS;

  // End of private functions

  let lastSaldo = 0;
  let lastYM = null;
  let prevSaldo = 0;

  const historico = sh.historico.getDataRange().getValues();

  startDate = new Fecha(historico[0][0]);
  endDate = new Fecha(historico.at(-1)[0]);
  startDate.loopUntilMonth((f) => monthsArray.push(f.ym), endDate);

  const descHash = new Desconocidos();
  const insideGap = new InsideGap(new Fecha(endDate.y - 1, endDate.m));
  let inside = false;

  hashCache = historico.reduce((hash, [date, concepto, importe, saldo]) => {
    if (!date) return hash;
    const fecha = new Fecha(date);

    const getYMEntry = (heading) => {
      if (!(heading in hash)) hash[heading] = {};
      const entry = hash[heading];
      const ym = fecha.ym;
      if (!(ym in entry)) entry[ym] = [];
      return entry[ym];
    };
    const setHashTo = (heading, i = importe) => {
      const YMEntry = getYMEntry(heading);
      YMEntry[0] = [fecha, i];
      if (heading == HEADINGS.VARIOS || heading == HEADINGS.CLASES_ROXY) {
        // This changes the entry from `[fecha, i]` to `[fecha, i, concepto]`
        YMEntry[0].push(concepto);
      }
    };
    const addToHash = (heading, i = importe) => {
      const YMEntry = getYMEntry(heading);
      YMEntry.push([fecha, i]);
      if (heading == HEADINGS.VARIOS || heading == HEADINGS.CLASES_ROXY) {
        // This changes the entry from `[fecha, i]` to `[fecha, i, concepto]`
        YMEntry.at(-1).push(concepto);
      }
    };

    if (lastYM) {
      if (fecha.ym > lastYM) {
        lastYM = fecha.ym;
        saldos.push(lastSaldo);
      }
    } else {
      lastYM = fecha.ym;
    }
    prevSaldo = lastSaldo;
    lastSaldo = saldo;
    const heading = findHeading(concepto);

    addToHash(heading);
    insideGap.add(inside, heading, fecha, importe);

    switch (heading) {
      // This one groups several entries within the Varios heading
      case HEADINGS.VARIOS:
        descHash.add(concepto, fecha, importe);
        break;
      // The following two help built the `within` tab
      // via the `insideGap.gs` module
      case HEADINGS.TARJETA:
        inside = true;
        setHashTo(HEADINGS.ANTES_TARJETA, prevSaldo);
        break;
      case HEADINGS.ALQUILER_GG:
        inside = false;
        setHashTo(HEADINGS.ANTES_ALQUILER, prevSaldo);
        break;
      // Up to here
    }
    return hash;
  }, {});
  saldos.push(lastSaldo);
  descHash.show();
  insideGap.show();
  return hashCache;
}
