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

// console.table(getAllMovs());
// console.table(getAllIngSals());
// console.table(getAllResumenes());

// Retiros de R4 por año y promedio mensual:
// console.table(
//   db
//     .prepare(
//       `
//       select
//         year as "Año",
// 		    format('%10.2f', valorInicial) as "Valor Inicial",
//         format('%10.2f', sum(importe)) as "Retiro Anual",
//         format('%10.2f', sum(importe) / 12) as "Promedio Mensual"
//       from IngSals right join ResumenAnual on (strftime('%Y',fechaValor) == year)
//       GROUP by year
//     `
//     )
//     .all()
// );

db.exec(`
  create view RetencionesPorAño as
  select year, Retención, TransfSalida from (
    select strftime('%Y', fecha) as year, sum(importe) as Retención from movs where op == 'Retención' group by year
  ) join (
    select strftime('%Y', fecha) as year, sum(importe) as TransfSalida from movs where op == 'Transf. a' group by year
  ) using (year)
`);

db.exec(`
  create view RetirosPorAño as
  select strftime('%Y',fechaValor) as year, sum(importe) as Retiro from ingSals group by year
`);
db.exec(`
  create view ResumenAnualPlus as
  select RA1.*, RA2.valorInicial as valorSiguiente
    from ResumenAnual as RA1
    left join ResumenAnual as RA2
    on (RA1.year +1 == RA2.year)
`);

db.function(
  'fmtCurrency',
  new Function(`val`, `return val.toFixed(2).padStart(10, ' ')`)
);
console.table(
  db
    .prepare(
      `
select year as Año,
	format('%10.2f',valorInicial) as 'Valor Inicial',
	format('%10.2f%%',(resultadoAnual /valorInicial) * 100) as Rentabilidad ,
	iif(Retiro, format('%10.2f',Retiro),'') as Retiro,
	iif(Retiro, format('%10.2f',Retiro / 12),'') 'Retiro Promedio Mensual',
	iif(Retención, format('%10.2f',Retención),'') as 'Retención' ,
	iif(Retención, format('%10.2f%%',Retención / reembolsos * 100),'') as 'Retención %' ,
	format('%10.2f',reembolsos)as Reembolsos,
	format('%10.2f',aportaciones) as Aportaciones
  --	Retiro - TransfSalida - aportaciones as 'Debe ser 0 o null',
  --	format('%10.2f',valorSiguiente - valorInicial) as difValor,
  --	format('%10.2f',valorSiguiente - valorInicial - resultadoAnual) as difresult,
  --	format('%10.2f%%',(resultadoAnual /valorInicial) * 100) as rentabilidad ,
  --	format('%10.2f',reembolsos / 12) as reembolsoPromedioMensual,
  --	format('%10.2f%%',Retención / reembolsos * 100) as 'Retención %' ,
  from ResumenAnualPlus 
  left join RetencionesPorAño using (year) 
  left join RetirosPorAño using (year)
`
    )
    .all()
);

// select * ,
// 	Retiro - TransfSalida - aportaciones as 'Debe ser 0 o null',
// 	format('%10.2f',valorSiguiente - valorInicial) as difValor,
// 	format('%10.2f',valorSiguiente - valorInicial - resultadoAnual) as difresult,
// 	format('%10.2f%%',(resultadoAnual /valorInicial) * 100) as rentabilidad ,
// 	format('%10.2f',reembolsos / 12) as reembolsoPromedioMensual,
// 	format('%10.2f%%',Retención / reembolsos * 100) as 'Retención %'

// from ResumenAnualPlus
// left join RetencionesPorAño using (year)
// left join RetirosPorAño using (year)

// select
//   year as "Año",
//   format('%10.2f', RA.valorInicial) as "Valor Inicial",
//   format('%10.2f', RA.valorSiguiente) as "Valor Siguiente",
//   format('%10.2f', Retiro) as "Retiro Anual",
//   format('%10.2f', Retiro / 12) as "Promedio Mensual"
// from
//   (select strftime('%Y',fechaValor) as year, sum(importe) as Retiro from ingSals group by year) as I
// right join
//   ( select RA1.*, RA2.valorInicial as valorSiguiente
//     from ResumenAnual as RA1
//     left join ResumenAnual as RA2
//     on (RA1.year +1 == RA2.year)
//   ) as RA
// using (year) order by year
