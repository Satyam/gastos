#!/usr/bin/env zx
import 'zx/globals';
// file:///usr/share/libreoffice/help/en-US/text/shared/guide/start_parameters.html?&DbPAR=SHARED&System=UNIX
// file:///usr/share/libreoffice/help/en-US/text/shared/guide/convertfilters.html?DbPAR=SHARED#bm_id541554406270299
// https://help.libreoffice.org/latest/en-GB/text/shared/guide/csv_params.html?&DbPAR=SHARED&System=UNIX
/*
soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ./csv *.xls

*/
import { initDb } from './sql.mjs';
import {
  createMovsTable,
  saldoEnDivisa,
  getAllMovs,
} from './SaldoEnDivisa.mjs';
import {
  createIngSalsTable,
  ingresosRetiradas,
  getAllIngSals,
} from './IngresosRetiradas.mjs';
import { createResumenTable, resumen, getAllResumenes } from './resumen.mjs';

// await $`soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ./csv ./downloads/*.xls`;

const db = await initDb();
createMovsTable(db);
createIngSalsTable(db);
createResumenTable(db);

const files = await glob('csv/*.csv');
await saldoEnDivisa(
  files.filter((file) => file.endsWith('Saldo en Divisa.csv'))
);
await ingresosRetiradas(
  files.filter((file) => file.endsWith('Operaciones.csv'))
);
await resumen(files.filter((file) => file.endsWith('Resumen.csv')));

console.table(getAllMovs());
console.table(getAllIngSals());
console.table(getAllResumenes());

// Retiros de R4 por año y promedio mensual:
console.table(
  db
    .prepare(
      `
      select 
        strftime('%Y',fechaValor) as "Año", 
        format('%10.2f', sum(importe)) as "Retiro Anual", 
        format('%10.2f', sum(importe) / 12) as "Promedio Mensual"
      from IngSals
      GROUP by "Año"
    `
    )
    .all()
);
// const retenciones = {};
// for (const mov of saldoEnDivisa) {
//   const f = mov.fecha;
//   if (!(f in retenciones)) {
//     retenciones[f] = {};
//   }
//   if (mov.concepto.startsWith('VENTA DE ')) {
//     const fondo = mov.concepto.substring('VENTA DE '.length);
//     if (!(fondo in retenciones[f])) {
//       retenciones[f][fondo] = {};
//     }
//     retenciones[f][fondo].venta = mov.importe;
//   }
//   if (mov.concepto.startsWith('RETENCION A CUENTA ')) {
//     const fondo = mov.concepto.substring('RETENCION A CUENTA '.length);
//     if (!(fondo in retenciones[f])) {
//       retenciones[f][fondo] = {};
//     }
//     retenciones[f][fondo].retencion = mov.importe;
//   }
// }

// for (const [f, resto] of Object.entries(retenciones)) {
//   for (const [fondo, ops] of Object.entries(resto)) {
//     if (ops.retencion && ops.venta) {
//       console.log(
//         f,
//         fondo,
//         ((ops.retencion / ops.venta) * 100).toFixed(2),
//         ops.venta,
//         ops.retencion
//       );
//     }
//   }
// }
// console.log(JSON.stringify(retenciones, null, 2));
