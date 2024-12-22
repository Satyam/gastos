import { readCSV, Fecha, sliceAfter, parseImporte } from './utils.mjs';
import { insertIngSal } from './sql.mjs';
const cuentas = {
  ES3400830001160038501071: 'Renta4',
  ES8000810063260001646768: 'Sabadell',
};
const replaceCuenta = (field) => cuentas[field] ?? field;
const aliases = [
  ['BARREIRO', 'Satyam'],
  ['CABUT', 'Roxana'],
];

const replaceNombre = (field) => {
  for (const [nombre, alias] of aliases) {
    if (field.includes(nombre)) return alias;
  }
  return field;
};

// `select strftime('%Y',fechaValor) as year, sum(importe)
//  from IngSals
//  GROUP by year`
export async function ingresosRetiradas([file]) {
  if (file) {
    const rows = await readCSV(file);
    sliceAfter(rows, 'FECHA VALOR|FECHA|OPERACIÓN|CUENTA CARGO')
      .reverse()
      .forEach((row) =>
        insertIngSal(
          Fecha.fromSabadell(row[0]).iso,
          Fecha.fromSabadell(row[1]).iso,
          row[2],
          replaceCuenta(row[3]),
          replaceNombre(row[4]),
          replaceCuenta(row[5]),
          replaceNombre(row[6]),
          row[7],
          parseImporte(row[8]),
          row[9],
          row[10]
        )
      );
  }
}

export default ingresosRetiradas;
