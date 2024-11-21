import {
  CabeceraCuenta,
  PrincipalMovimiento,
  ComplementarioConcepto,
  FinCuenta,
  FinFichero,
} from './registros.mjs';
import { numField } from './utils.mjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const f43File = await readFile(
  resolve('./0063_000001646768_31102024.n43'),
  'utf8'
);

const f43 = f43File.split('\n');
let lastMovimiento = null;
loop: for (let i = 0; true; i++) {
  const row = f43[i];
  console.log(i);
  switch (numField(row, 0, 2)) {
    case CabeceraCuenta.type:
      console.table(new CabeceraCuenta(row));
      break;
    case PrincipalMovimiento.type:
      lastMovimiento = new PrincipalMovimiento(row);
      console.table(lastMovimiento);
      break;
    case ComplementarioConcepto.type:
      const concepto = new ComplementarioConcepto(row);
      lastMovimiento.conceptos[parseInt(concepto.secuencia, 10)] =
        concepto.concepto;
      console.table(concepto);
      break;
    case FinCuenta.type:
      console.table(new FinCuenta(row));
      break;

    case FinFichero.type:
      console.log('fin fichero');
      break loop;
    default:
      console.log(row);
      break;
  }
}
