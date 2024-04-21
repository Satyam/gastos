const getConocidosHash = () =>
  sh.conocidos
    .getRange(2, 1, sh.conocidos.getLastRow(), 2)
    .getValues()
    .reduce((c, row) => {
      const key = row[0].trim().toUpperCase();
      if (key.length === 0) return c;
      return {
        ...c,
        [key]: row[1] || key,
      };
    }, {});

const getHeadings = () =>
  sh.headings
    .getRange(2, 1, sh.headings.getLastRow(), 2)
    .getValues()
    .filter((row) => row[0].length);

const getEstimados = () =>
  sh.estimados
    .getRange(2, 1, sh.estimados.getLastRow(), 3)
    .getValues()
    .reduce(
      (est, row) => ({
        ...est,
        [row[0].trim()]: {
          formula: `=${row[1]}`,
          note: row[2],
        },
      }),
      {}
    );

let conocidos = {};
let headings = [];
let estimados = {};

function initTables() {
  conocidos = getConocidosHash();
  headings = getHeadings();
  estimados = getEstimados();

  const headingsHash = headings.reduce((hash, [heading]) => {
    if (heading.startsWith('-')) return hash;
    return {
      [heading]: 0,
      ...hash,
    };
  }, {});
  Object.values(conocidos).forEach((h) => {
    if (h in headingsHash) {
      headingsHash[h] += 1;
    } else {
      ui.alert(
        `El encabezado "${h}" en la solapa "Conocidos" no se encuentra en la solapa de "Encabezados"`
      );
    }
  });
  for (const [heading, qty] of Object.entries(headingsHash)) {
    if (qty === 0) {
      ui.alert(
        `No hay ninguna entrada en "Conocidos" para el encabezado "${heading}"`
      );
    }
  }
}
