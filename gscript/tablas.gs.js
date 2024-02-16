const getConocidosHash = () =>
  sh.conocidos
    .getRange(2, 1, sh.conocidos.getLastRow(), 3)
    .getValues()
    .reduce((c, row) => {
      const key = row[0].trim().toUpperCase();
      if (key.length === 0) return c;
      return {
        ...c,
        [key]: {
          heading: row[1] || key,
          meses: Number(row[2]) || 1,
        },
      };
    }, {});

const getHeadings = () =>
  sh.headings.getRange(1, 1, sh.headings.getLastRow(), 1).getValues().flat();

let conocidos = {};
let headings = [];

function initTables() {
  conocidos = getConocidosHash();
  headings = getHeadings();

  // Check that both tables cross-references each other.
  const hdgs = [];
  Object.values(conocidos).forEach(({ heading }) => {
    hdgs.push(heading);
    if (!headings.includes(heading)) {
      ui.alert(
        `El encabezado "${heading}" en la solapa "Conocidos" no se encuentra en la solapa de "Encabezados"`
      );
    }
  });
  headings
    .filter((h) => !h.startsWith('-'))
    .forEach((h) => {
      if (!hdgs.includes(h)) {
        ui.alert(
          `No hay ninguna entrada en "Conocidos" para el encabezado "${h}"`
        );
      }
    });
}
