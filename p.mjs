#!/usr/bin/env zx
import { readAllLines, readConocidos, ymKey } from './utils.mjs';

const conocidos = await readConocidos('Conocidos.csv');

const desconocidos = [];

const Y = 0,
  M = 1,
  D = 2,
  SH = 3,
  I = 4,
  C = 5,
  S = 6,
  YMD = 7;

const readMovimientos = async (fname) => {
  const fileContents = await readAllLines(fname);
  return fileContents
    .map((row) => {
      const [date, concepto, _, importe, saldo] = row.split('|');
      const [d, m, y] = date.split('/');
      let short = conocidos.find((s) => concepto.includes(s[0]));
      if (short) {
        short = short[1];
      } else {
        if (!desconocidos.includes(concepto)) desconocidos.push(concepto);
        short = concepto;
      }
      // el orden corresponde a las constantes de más arriba.
      return [
        parseInt(y, 10),
        parseInt(m, 10),
        parseInt(d, 10),
        short,
        parseFloat(importe),
        concepto.toUpperCase().trim(),
        parseFloat(saldo),
        [y, m, d].join('-'),
      ];
    })
    .reverse();
};
const movimientos = await readMovimientos('downloads/20190101-20231225.txt');

const sortBy = (rows, field) => rows.sort((a, b) => a[field] - b[field]);
// conocidos.forEach(([_, sh]) => {
//   const subset = sortBy(
//     movimientos.filter((row) => row[SH] === sh),
//     YMD
//   );
const sh = 'Electricidad casa';
const subset = movimientos.filter((row) => row[SH] === sh);
subset.forEach((row, index) => {
  const y1 = row[Y] + 1;
  console.log(row[YMD], sh, row[I]);
  for (let i = index + 1; i < subset.length; i++) {
    const s = subset[i];
    if (y1 === s[Y] && row[M] === s[M]) {
      console.log(
        i,
        s[YMD],
        s[I],
        Math.floor(Math.abs(((s[I] - row[I]) / row[I]) * 100))
      );
    }
  }
});
// console.log(sh);
// console.log(subset);
//   process.exit();
// });
