let descHash = {};
let hashCache = null;
let startDate = new Fecha(9999, 12, 30);
let endDate = new Fecha(1, 1, 1);
const monthsArray = [];

function showDesconocidos() {
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
            descHash[concepto].fechas.push(fecha.toString());
          } else {
            descHash[concepto] = {
              cant: 1,
              importe,
              fechas: [fecha.toString()],
            };
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
  startDate.loopUntilMonth((f) => monthsArray.push(f.ym), endDate);
  showDesconocidos();
  return hashCache;
}
