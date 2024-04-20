let hashCache = null;
let startDate = null;
let endDate = null;
const monthsArray = [];

function getHistoricoHash() {
  if (hashCache) return hashCache;
  initTables();

  const descHash = {};
  const headingsHash = headings.reduce((hash, [heading, frecuencia]) => {
    if (heading.startsWith('-')) return hash;
    return {
      [heading]: {
        frecuencia,
        within: 0,
        total: 0,
        importe: 0,
        $within: 0,
        $total: 0,
        $importe: 0,
        $dia: 0,
      },
      ...hash,
    };
  }, {});
  let inside = false;

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

  const addToHeadingHash = (heading, fecha, importe) => {
    const hh = headingsHash[heading];
    hh.total += 1;
    if (ultimoAnyo.compare(fecha) < 0) hh.$total += 1;
    if (inside && importe < 0) {
      hh.within += 1;
      hh.importe += importe;
      if (ultimoAnyo.compare(fecha) < 0) {
        hh.$within += 1;
        hh.$importe += importe;
        hh.$dia += fecha.d;
      }
    }
  };

  const showHeadingsHash = () => {
    sh.within
      .getRange(1, 1, 1, 11)
      .setValues([
        [
          'Heading',
          'frecuencia',
          'within',
          'total',
          'importe',
          'promedio',
          '$within',
          '$total',
          '$importe',
          '$promedio',
          '$dia',
        ],
      ]);

    sh.within.getRange(2, 1, Object.keys(headingsHash).length, 11).setValues(
      Object.keys(headingsHash).map((heading) => {
        const {
          frecuencia,
          within,
          total,
          importe,
          $within,
          $total,
          $importe,
          $dia,
        } = headingsHash[heading];
        return [
          heading,
          frecuencia,
          within,
          total,
          importe,
          within ? importe / within : 0,
          $within,
          $total,
          $importe,
          $within ? $importe / $within : 0,
          $within ? $dia / $within : 0,
        ];
      })
    );
  };
  // End of private functions

  let lastSaldo = 0;
  let lastYM = null;
  let prevSaldo = 0;

  const historico = sh.historico.getDataRange().getValues();

  startDate = new Fecha(historico[0][0]);
  endDate = new Fecha(historico.at(-1)[0]);
  startDate.loopUntilMonth((f) => monthsArray.push(f.ym), endDate);
  const ultimoAnyo = new Fecha(endDate.y - 1, endDate.m);

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
    addToHeadingHash(heading, fecha, importe);

    switch (heading) {
      case HEADINGS.VARIOS:
        {
          let dh = descHash[concepto];
          if (!dh) {
            descHash[concepto] = dh = {
              cant: 0,
              importe: 0,
              fechas: [],
            };
            dh.cant += 1;
            dh.importe += importe;
            dh.fechas.push(fecha.toString());
          }
        }
        break;
      case HEADINGS.TARJETA:
        inside = true;
        setHashTo(HEADINGS.ANTES_TARJETA, prevSaldo);
        break;
      case HEADINGS.ALQUILER_GG:
        inside = false;
        setHashTo(HEADINGS.ANTES_ALQUILER, prevSaldo);
        break;
    }
    return hash;
  }, {});
  saldos.push(lastSaldo);
  showDesconocidos();
  showHeadingsHash();
  return hashCache;
}
