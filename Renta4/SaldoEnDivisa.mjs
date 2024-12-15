import { readCSV, Fecha, sliceAfter, parseImporte } from './utils.mjs';

export async function SaldoEnDivisa(file) {
  console.log('Saldo En Divisa', file);
  const rows = await readCSV(file);
  const movs = sliceAfter(rows, 'FECHA|CONCEPTO|MOVIMIENTOS|SALDO').map(
    (row) => ({
      fecha: row[0] ? Fecha.fromSabadell(row[0]) : null,
      concepto: row[1],
      importe: parseImporte(row[2]),
      saldo: parseImporte(row[3]),
    })
  );
  // const firstRow = movs[0];
  // if (firstRow.concepto === 'SALDO ANTERIOR') {
  //   firstRow.fecha = new Fecha(movs[1].fecha.y, 1, 1);
  //   firstRow.importe = 0;
  // }
  // const lastRow = movs.at(-1);
  // if (lastRow.concepto === 'SALDO FINAL') {
  //   lastRow.fecha = new Fecha(firstRow.fecha.y, 12, 31);
  //   lastRow.importe = 0;
  // }
  return movs;
}

export default SaldoEnDivisa;
