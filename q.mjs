#!/usr/bin/env zx
import { readAllLines, readConocidos, ymKey } from './utils.mjs';

const readMovimientos = async (fname) => {
  const parseDate = (ds) =>
    ds.replace(/(\d+)\/(\d+)\/(\d+)/, (_, d, m, y) =>
      [y, m.padStart(2, '0'), d.padStart(2, '0')].join('-')
    );
  const fileContents = await readAllLines(fname);
  return fileContents
    .map((row) => {
      const [d, c, _, i, s] = row.split('|');
      return [
        parseDate(d),
        c.toUpperCase().trim(),
        parseFloat(i),
        parseFloat(s),
      ];
    })
    .reverse();
};

const movimientos = await readMovimientos('downloads/20190101-20231225.txt');

const conocidos = await readConocidos('Conocidos.csv');

const desconocidos = [];

console.log(movimientos), console.log(desconocidos);

const movHashByYearMonth = () => {
  const hash = {};
  movimientos.forEach((row) => {
    const [date, concepto] = row;

    const ym = ymKey(date);
    if (!(ym in hash)) {
      hash[ym] = {};
    }
    const ymEntry = hash[ym];
    let short = conocidos.find((s) => concepto.includes(s[0]));
    if (short) {
      short = short[1];
      if (short in ymEntry) {
        ymEntry[short].push(row);
      } else {
        ymEntry[short] = [row];
      }
    } else {
      if (!desconocidos.includes(concepto)) desconocidos.push(concepto);
      if (concepto in ymEntry) {
        ymEntry[concepto].push(row);
      } else {
        ymEntry[concepto] = [row];
      }
    }
  });
  return hash;
};
const movHashByConcepto = () => {
  const hash = {};
  movimientos.forEach((row) => {
    const [date, concepto] = row;
    let short = conocidos.find((s) => concepto.includes(s[0]));
    if (short) {
      short = short[1];
    } else {
      short = desconocidos.includes(concepto);
      if (!short) desconocidos.push(concepto);
    }
    if (!(short in hash)) hash[short] = {};
    const entry = hash[short];
    const ym = ymKey(date);
    if (ym in entry) {
      entry[ym].push(row);
    } else {
      entry[ym] = [row];
    }
  });
  return hash;
};

console.log(conocidos);
console.dir(await movHashByConcepto(), { depth: null });
console.log(desconocidos.sort());
