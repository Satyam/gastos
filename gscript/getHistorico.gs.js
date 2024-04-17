let hashCache = null;
let startDate = new Fecha(9999, 12, 30);
let endDate = new Fecha(1, 1, 1);
const monthsArray = [];

function getHistoricoHash() {
  if (hashCache) return hashCache;
  const descHash = {};

  // Private functions only used here
  const showDesconocidos = () => {
    sh.desconocidos.clear();
    const desc = Object.entries(descHash);
    if (desc.length) {
      sh.desconocidos
        .getRange(1, 1, desc.length + 1, 4)
        .setValues([
          ['Concepto', 'Ocurrencias', 'Total', 'Fechas'],
          ...desc.map(([concepto, info]) => [
            concepto,
            info.cant,
            info.importe,
            info.fechas.join(' , '),
          ]),
        ])
        .sort([
          { column: 3, ascending: false },
          { column: 2, ascending: false },
        ]);
    }
  };
  const findHeading = (concepto) =>
    conocidos[Object.keys(conocidos).find((s) => concepto.includes(s))] ??
    HEADINGS.VARIOS;

  // End of private functions

  let lastSaldo = 0;
  let lastYM = null;
  let prevSaldo = 0;
  hashCache = sh.historico
    .getDataRange()
    .getValues()
    .reduce((hash, [date, concepto, importe, saldo]) => {
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

      if (fecha.compare(startDate) < 0) startDate = fecha;
      if (fecha.compare(endDate) > 0) endDate = fecha;
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
      switch (heading) {
        case HEADINGS.VARIOS:
          if (descHash[concepto]) {
            descHash[concepto].cant += 1;
            descHash[concepto].importe += importe;
            descHash[concepto].fechas.push(fecha.toString());
          } else {
            descHash[concepto] = {
              cant: 1,
              importe,
              fechas: [fecha.toString()],
            };
          }
          break;
        case HEADINGS.TARJETA:
          setHashTo(HEADINGS.ANTES_TARJETA, prevSaldo);
          break;
        case HEADINGS.ALQUILER_GG:
          setHashTo(HEADINGS.ANTES_ALQUILER, prevSaldo);
          break;
      }
      addToHash(heading);
      return hash;
    }, {});
  saldos.push(lastSaldo);
  startDate.loopUntilMonth((f) => monthsArray.push(f.ym), endDate);
  showDesconocidos();
  return hashCache;
}
