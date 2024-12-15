#!/usr/bin/env zx

// file:///usr/share/libreoffice/help/en-US/text/shared/guide/start_parameters.html?&DbPAR=SHARED&System=UNIX
// file:///usr/share/libreoffice/help/en-US/text/shared/guide/convertfilters.html?DbPAR=SHARED#bm_id541554406270299
// https://help.libreoffice.org/latest/en-GB/text/shared/guide/csv_params.html?&DbPAR=SHARED&System=UNIX
/*
soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ./csv *.xls

*/
import { Fecha } from './utils.mjs';
import SaldoEnDivisa from './SaldoEnDivisa.mjs';
import IngresosRetiradas from './IngresosRetiradas.mjs';

// await $`soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ./csv ./downloads/*.xls`;

let ingresosRetiradas;
let saldoEnDivisa = [];
const files = await glob('csv/*.csv');
for (const file of files.sort()) {
  if (file.includes('Saldo en Divisa')) {
    saldoEnDivisa = saldoEnDivisa.concat(await SaldoEnDivisa(file));
  }
  if (file.includes('ingresosRetiradas')) {
    ingresosRetiradas = await IngresosRetiradas(file);
  }
}

let saldo = 0;
let lastFecha = '2000-01-01';
saldoEnDivisa = saldoEnDivisa.reduce((acc, row) => {
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
console.table(saldoEnDivisa);
