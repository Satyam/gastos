#!/usr/bin/env zx
import {
  joinDate,
  logger,
  readAllLines,
  readConocidos,
  splitDate,
  ymKey,
  parseSabadellDate,
} from './utils.mjs';

let startDate = '9999-99-99',
  endDate = '0000-00-00';

const readMovimientos = async (fname) => {
  const fileContents = await readAllLines(fname);
  return fileContents
    .map((row) => {
      const [d, c, _, i, s] = row.split('|');
      const date = parseSabadellDate(d);
      if (date < startDate) startDate = date;
      if (date > endDate) endDate = date;
      return [date, c.toUpperCase().trim(), parseFloat(i), parseFloat(s)];
    })
    .reverse();
};

const movimientos = await readMovimientos('downloads/20190101-20231225.txt');

const conocidos = await readConocidos('Conocidos.csv');

const desconocidos = [];

// console.log(movimientos), console.log(desconocidos);

const movHashByYearMonth = (movimientos) => {
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

const movHashByConcepto = (movimientos) => {
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

const hash = movHashByConcepto(movimientos);

// fs.writeFile('salidas/hash.txt', JSON.stringify(hash, null, 2));

const out = logger('salidas/index.html');

out.log(`<html>
  <head>
    <style>
      td,th {
        border:thin solid silver;
      }
      th {
        font-weight: bolder;
      }
    </style>
  </head>
  <body>
  <table>`);
const [startY, startM] = splitDate(startDate);
const [endY, endM] = splitDate(endDate);

out.log('<tr><td></td>');
for (let y = startY, m = startM; y <= endY || m <= endM; m++) {
  if (m > 12) {
    m = 1;
    y++;
    if (y > endY) break;
  }
  out.log('<th>%s</th>', ymKey(joinDate(y, m)));
}
out.log('</tr>');
for (const [concepto, short] of conocidos) {
  const entriesConcepto = hash[short];
  out.log('<tr><th>%s</th>', short);

  for (let y = startY, m = startM; y <= endY || m <= endM; m++) {
    if (m > 12) {
      m = 1;
      y++;
      if (y > endY) break;
    }
    const entries = entriesConcepto[ymKey(joinDate(y, m))];
    if (entries) {
      out.log('<td><table>');
      entries.forEach(([d, _, i]) => {
        out.log('<tr><td>%s</td><td>%s</td></tr>', d, i);
      });
      out.log('</table></td>');
    } else {
      out.log('<td></td>');
    }
  }

  out.log('</tr>');
}

out.log('</table></body></html>');
// console.log(conocidos);
// console.dir(await movHashByConcepto(movimientos), { depth: null });
// console.log(desconocidos.sort());
