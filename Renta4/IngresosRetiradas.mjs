import { readCSV, Fecha } from './utils.mjs';

export async function IngresosRetiradas(file) {
  console.log('Ingresos Retiradas', file);
  const rows = await readCSV(file);
  const l = rows.length;
  let i;
  for (i = 0; i < l && rows[i][0] !== 'FECHA VALOR'; i++);
  const movs = rows.slice(i + 1).reverse();
  return movs.map((row) => ({
    fecha: Fecha.fromSabadell(row[1]),
    op: row[2],
    cuentaDesde: row[3],
    ordenante: row[4],
    cuentaHasta: row[5],
    destinatario: row[6],
    estado: row[7],
    importe: parseFloat(row[8]),
    concepto: row[10],
  }));
}

export default IngresosRetiradas;
