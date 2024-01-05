#!/usr/bin/env zx

const readAllLines = async (fname) => {
  const fileContents = await fs.readFile(fname, 'latin1');
  return fileContents.trim().split('\n');
};

// const readMovimientos = async (fname) => {
//   const parseDate = (ds) =>
//     ds.replace(/(\d+)\/(\d+)\/(\d+)/, (_, d, m, y) =>
//       [y, m.padStart(2, '0'), d.padStart(2, '0')].join('-')
//     );
//   const fileContents = await readAllLines(fname);
//   return fileContents
//     .map((row) => {
//       const [d, c, _, i, s] = row.split('|');
//       return [
//         parseDate(d),
//         c.toUpperCase().trim(),
//         parseFloat(i),
//         parseFloat(s),
//       ];
//     })
//     .reverse();
// };

const readConocidos = async (fname) => {
  const fileContents = await readAllLines(fname);
  return fileContents
    .filter((l) => !l.startsWith('-'))
    .map((row) => {
      const [r, s] = row.split(',');
      return [r.trim(), (s ?? r).trim()];
    });
};

// const movimientos = await readMovimientos('20190101-20231225.txt');
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

// console.log(movimientos), console.log(desconocidos);
// const ymKey = (date) => date.slice(0, 7);

// const movHashByYearMonth = () => {
//   const hash = {};
//   movimientos.forEach((row) => {
//     const [date, concepto] = row;

//     const ym = ymKey(date);
//     if (!(ym in hash)) {
//       hash[ym] = {};
//     }
//     const ymEntry = hash[ym];
//     let short = conocidos.find((s) => concepto.includes(s[0]));
//     if (short) {
//       short = short[1];
//       if (short in ymEntry) {
//         ymEntry[short].push(row);
//       } else {
//         ymEntry[short] = [row];
//       }
//     } else {
//       if (!desconocidos.includes(concepto)) desconocidos.push(concepto);
//       if (concepto in ymEntry) {
//         ymEntry[concepto].push(row);
//       } else {
//         ymEntry[concepto] = [row];
//       }
//     }
//   });
//   return hash;
// };
// const movHashByConcepto = () => {
//   const hash = {};
//   movimientos.forEach((row) => {
//     const [date, concepto] = row;
//     let short = conocidos.find((s) => concepto.includes(s[0]));
//     if (short) {
//       short = short[1];
//     } else {
//       short = desconocidos.includes(concepto);
//       if (!short) desconocidos.push(concepto);
//     }
//     if (!(short in hash)) hash[short] = {};
//     const entry = hash[short];
//     const ym = ymKey(date);
//     if (ym in entry) {
//       entry[ym].push(row);
//     } else {
//       entry[ym] = [row];
//     }
//   });
//   return hash;
// };

// console.log(conocidos);
// console.dir(await movHashByConcepto(), { depth: null });
// console.log(desconocidos.sort());

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
