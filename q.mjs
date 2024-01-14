#!/usr/bin/env zx
import { Fecha, logger, readAllLines, readConocidos } from './utils.mjs';

let startDate = '9999-99-99',
  endDate = '0000-00-00';

const readMovimientos = async (fname) => {
  const fileContents = await readAllLines(fname);
  return fileContents
    .map((row) => {
      const [d, c, _, i, s] = row.split('|');
      const date = Fecha.fromSabadell(d);
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

    const ym = date.ym;
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
    const ym = date.ym;
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
      .group {
        text-align: left;
        font-size: larger;
        background-color: silver;
        padding-left: 1em;
      }
      td table {
        width: 100%
      }
      td table td {
        text-align: right;
      }
      .red {
        background-color: red;
      }
      .yellow {
        background-color: yellow;
      }
      .blue {
        background-color: blue;
      }
    </style>
  </head>
  <body>
  <table>`);

const startY = startDate.y,
  startM = startDate.m;
const endY = endDate.y,
  endM = endDate.m;

let numCols = 2;
out.log('<tr><td></td>');

startDate.loopUntil((f) => {
  numCols++;
  out.log('<th>%s</th>', f.ym);
}, endDate);
out.log('</tr>');

const colores = (total, previsto) => {
  const err = previsto / total;
  if (err > 1.3 || err < 0.7) return 'red';
  if (err > 1.2 || err < 0.8) return 'yellow';
  if (err > 1.1 || err < 0.9) return 'blue';
  return '';
};

const headings = await readAllLines('Headings.txt');
headings.forEach((h) => {
  if (h.startsWith('-')) {
    out.log(
      '<tr><th class="group" colspan="%d">%s</th></tr>',
      numCols,
      h.substring(1)
    );
  } else {
    const entriesConcepto = hash[h];
    out.log('<tr><th>%s</th>', h);

    startDate.loopUntil((f) => {
      const entries = entriesConcepto[f.ym];
      if (entries) {
        let previsto = 0;
        let total = 0;
        out.log('<td><table>');
        entries.forEach(([date, concepto, i]) => {
          if (concepto) {
            total += i;
            out.log('<tr><td>%s</td><td>%d</td></tr>', date.d, i.toFixed(2));
          } else {
            previsto = i;
          }
        });
        if (entries.length > 1) {
          out.log(
            '<tr><th class="%s">Total</td><td>%d</td></tr>',
            colores(total, previsto),
            total.toFixed(2)
          );
        }
        if (previsto) {
          out.log(
            '<tr><th class="%s">Previsto</td><td>%d</td></tr>',
            colores(total, previsto),
            previsto.toFixed(2)
          );
        }

        const ym = f.nextYear().ym;
        const futuro = entriesConcepto[ym];
        if (!futuro) {
          entriesConcepto[ym] = [['previsto', null, total]];
        } else {
          entriesConcepto[ym].push(['previsto', null, total]);
        }

        out.log('</table></td>');
      } else {
        out.log('<td></td>');
      }
    }, endDate);
    out.log('<th>%s</th>', h);

    out.log('</tr>');
  }
});

out.log('</table></body></html>');
// console.log(conocidos);
// console.dir(await movHashByConcepto(movimientos), { depth: null });
// console.log(desconocidos.sort());
