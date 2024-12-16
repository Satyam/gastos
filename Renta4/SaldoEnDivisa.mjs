import { readCSV, Fecha, sliceAfter, parseImporte } from './utils.mjs';

let saldoEnDivisa = [];

export async function readSaldoEnDivisa(file) {
  console.log('Saldo En Divisa', file);
  const rows = await readCSV(file);
  saldoEnDivisa = saldoEnDivisa.concat(
    sliceAfter(rows, 'FECHA|CONCEPTO|MOVIMIENTOS|SALDO').map((row) => ({
      fecha: row[0] ? Fecha.fromSabadell(row[0]) : null,
      concepto: row[1],
      importe: parseImporte(row[2]),
      saldo: parseImporte(row[3]),
    }))
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
        const f = row.fecha.toString();
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
        return [...acc, row];
    }
  }, []);
}
