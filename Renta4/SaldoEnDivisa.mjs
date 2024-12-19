import { readCSV, Fecha, sliceAfter, parseImporte } from './utils.mjs';
import { insertMov } from './sql.mjs';

let saldoEnDivisa = [];

const ops = [
  'CAMPAÑA FONCUENTA',
  'COMPRA DE',
  'INTERESES',
  'RETENCION A CUENTA',
  'TRANSF. EMITIDA A',
  'TRANSF. RECIBIDA DE',
  'VENTA DE',
  'SALDO ANTERIOR',
  'SALDO FINAL',
  'COMISION EMITIDA',
  'ASIENTO DE APERTURA',
];

export async function readSaldoEnDivisa(file) {
  console.log('Saldo En Divisa', file);
  const rows = await readCSV(file);
  saldoEnDivisa = saldoEnDivisa.concat(
    sliceAfter(rows, 'FECHA|CONCEPTO|MOVIMIENTOS|SALDO').map((row) => {
      const c = row[1];
      let op = null,
        fondo = '';
      ops.forEach((o) => {
        if (c.startsWith(o)) {
          op = o;
          fondo = c.replace(o, '').trim();
        }
      });
      if (fondo.includes('BARREIRO')) fondo = 'Satyam';
      if (fondo.includes('ROXANA')) fondo = 'Roxana';
      if (!op) console.error(c);
      return {
        fecha: row[0] ? Fecha.fromSabadell(row[0]) : null,
        concepto: c,
        op,
        fondo,
        importe: parseImporte(row[2]),
        saldo: parseImporte(row[3]),
      };
    })
  );
}

export function processSaldoEnDivisa() {
  let saldo = 0;
  let lastFecha = '2000-01-01';

  return saldoEnDivisa.reduce((acc, row) => {
    switch (row.concepto) {
      case 'SALDO ANTERIOR':
        if (row.saldo) {
          throw new Error(
            `Saldo anterior inesperado cerca de ${lastFecha}: ${row.saldo}`
          );
        }
        return acc;
      case 'SALDO FINAL':
        if (row.saldo !== saldo) {
          throw new Error(
            `Saldo final inesperado después de ${lastFecha}: ${row.saldo}`
          );
        }
        return acc;
      case 'ASIENTO DE APERTURA':
        if (row.saldo !== saldo) {
          throw new Error(
            `Asiento de apertura inesperado después de ${lastFecha}: ${row.saldo}`
          );
        }
        return acc;
      default:
        const f = row.fecha;
        if (lastFecha > f) {
          throw new Error(`Fechas desordenadas ${lastFecha} - ${f}`);
        }
        lastFecha = f;
        if (saldo + row.importe - row.saldo > 0.01) {
          throw new Error(
            `Saldo en ${row.concepto} de ${f} no da \nSaldo ant:${saldo}, importe: ${row.importe} no da ${row.saldo}`
          );
        }
        saldo = row.saldo;
        insertMov(row.fecha.iso, row.op, row.fondo, row.importe, row.saldo);
        return [...acc, row];
    }
  }, []);
}
