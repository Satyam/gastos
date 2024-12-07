/* Un intento de ver la relación de los campos ref1 y ref2 de cada movimiento
   con el detalle del mismo.
   La idea sería usar el formato de archivo F43 y usar alguna de estas referencias 
   en lugar de el texto del detalle que puede cambiar.
*/

import {
  CabeceraCuenta,
  PrincipalMovimiento,
  ComplementarioConcepto,
  FinCuenta,
  FinFichero,
} from './registros.mjs';
import { numField } from './utils.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const f43File = await readFile(
  resolve('./0063_000001646768_28112024.n43'),
  'utf8'
);

const ref1 = {};
const ref2 = {};
let mov = null;
const detalles = [];

const f43 = f43File.split('\n');
for (const row of f43) {
  if (row.length) {
    switch (numField(row, 0, 2)) {
      case PrincipalMovimiento.type:
        if (mov) {
          if (detalles.length) {
            mov.detalle = detalles.join('\n');
          }
          let r = ref1[mov.ref1];
          if (typeof r === 'undefined') {
            ref1[mov.ref1] = r = {};
          }
          let n = r[mov.detalle];
          if (typeof n === 'undefined') {
            r[mov.detalle] = 1;
          } else {
            r[mov.detalle] += 1;
          }
          r = ref2[mov.ref2];
          if (typeof r === 'undefined') {
            ref2[mov.ref2] = r = {};
          }
          n = r[mov.detalle];
          if (typeof n === 'undefined') {
            r[mov.detalle] = 1;
          } else {
            r[mov.detalle] += 1;
          }
        }

        detalles.length = 0;
        mov = new PrincipalMovimiento(row);
        break;
      case ComplementarioConcepto.type:
        const concepto = new ComplementarioConcepto(row);
        detalles[concepto.secuencia - 1] = concepto.concepto;
        break;
      default:
        break;
    }
  }
}

const arr1 = [];
for (const [ref, dets] of Object.entries(ref1)) {
  const numDets = Object.keys(dets).length;
  for (const [det, n] of Object.entries(dets)) {
    if (numDets > 1 || n > 1) {
      arr1.push([ref, numDets, det, n]);
    }
  }
}

const arr2 = [];
for (const [ref, dets] of Object.entries(ref2)) {
  const numDets = Object.keys(dets).length;
  for (const [det, n] of Object.entries(dets)) {
    if (numDets > 1 || n > 1) {
      arr2.push([ref, numDets, det, n]);
    }
  }
}

debugger;
