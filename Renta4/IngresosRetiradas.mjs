import { readCSV, Fecha, sliceAfter, parseImporte } from './utils.mjs';

export async function IngresosRetiradas(file) {
  console.log('Ingresos Retiradas', file);
  const rows = await readCSV(file);
  return sliceAfter(rows, 'FECHA VALOR|FECHA|OPERACIÓN|CUENTA CARGO')
    .reverse()
    .map((row) => ({
      fecha: Fecha.fromSabadell(row[1]),
      op: row[2],
      cuentaDesde: row[3],
      ordenante: row[4],
      cuentaHasta: row[5],
      destinatario: row[6],
      estado: row[7],
      importe: parseImporte(row[8]),
      concepto: row[10],
    }));
}

export default IngresosRetiradas;
