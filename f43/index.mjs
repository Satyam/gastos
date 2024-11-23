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
  resolve('./0063_000001646768_31102024.n43'),
  'utf8'
);

const salida = {};
const f43 = f43File.split('\n');

let lastMovimiento = null;

const detalles = [];

let numDebe = 0;
let totalDebe = 0;
let numHaber = 0;
let totalHaber = 0;

loop: for (let i = 0; true; i++) {
  const row = f43[i];
  // console.log(i);
  switch (numField(row, 0, 2)) {
    case CabeceraCuenta.type:
      const cabecera = new CabeceraCuenta(row);
      Object.assign(salida, cabecera);
      console.table(cabecera);
      salida.operaciones = [];
      break;
    case PrincipalMovimiento.type:
      if (detalles.length) {
        lastMovimiento.detalle = detalles.join('\n');
      }
      detalles.length = 0;
      lastMovimiento = new PrincipalMovimiento(row);
      salida.operaciones.push(lastMovimiento);
      if (lastMovimiento.importe < 0) {
        numDebe++;
        totalDebe -= lastMovimiento.importe;
      } else {
        numHaber++;
        totalHaber += lastMovimiento.importe;
      }
      // console.table(lastMovimiento);
      break;
    case ComplementarioConcepto.type:
      const concepto = new ComplementarioConcepto(row);
      detalles[concepto.secuencia - 1] = concepto.concepto;
      // console.table(concepto);
      break;
    case FinCuenta.type:
      const finCuenta = new FinCuenta(row);
      if (
        finCuenta.entidad !== salida.entidad ||
        finCuenta.oficina !== salida.oficina ||
        finCuenta.cuenta !== salida.cuenta
      ) {
        throw new Error(
          'Datos de la cuenta en cabecera y pie de registro no coinciden'
        );
      }
      if (finCuenta.divisa !== salida.divisa) {
        throw new Error('Disa en cabecera y pie no coinciden');
      }
      if (
        numDebe !== finCuenta.numDebe ||
        totalDebe !== finCuenta.totalDebe ||
        numHaber !== finCuenta.numHaber ||
        totalHaber !== finCuenta.totalHaber
      ) {
        throw new Error('Totales cruzados de fichero no cuadran');
      }
      salida.saldoFinal = finCuenta.saldoFinal;
      break;

    case FinFichero.type:
      console.log('fin fichero');
      break loop;
    default:
      console.log(row);
      break;
  }
}
// console.log(JSON.stringify(salida, null, 2));
await writeFile(
  resolve(
    `./f43_${salida.fInicial.toString()}_${salida.fFinal.toString()}.json`
  ),
  JSON.stringify(salida)
);
