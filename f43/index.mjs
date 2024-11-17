import {
  CabeceraCuenta,
  PrincipalMovimiento,
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
loop: for (let i = 0; true; i++) {
  const row = f43[i];
  console.log(i);
  switch (numField(row, 0, 2)) {
    case CabeceraCuenta.type:
      console.table(new CabeceraCuenta(row));
      break;
    case PrincipalMovimiento.type:
      console.table(new PrincipalMovimiento(row));
      break;
    case FinFichero.type:
      console.log('fin fichero');
      break loop;
    default:
      console.log(row);
      break;
  }
}
