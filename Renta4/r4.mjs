#!/usr/bin/env zx

// file:///usr/share/libreoffice/help/en-US/text/shared/guide/start_parameters.html?&DbPAR=SHARED&System=UNIX
// file:///usr/share/libreoffice/help/en-US/text/shared/guide/convertfilters.html?DbPAR=SHARED#bm_id541554406270299
// https://help.libreoffice.org/latest/en-GB/text/shared/guide/csv_params.html?&DbPAR=SHARED&System=UNIX
/*
soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ./csv *.xls

*/
import { Fecha } from './utils.mjs';
import { readSaldoEnDivisa, processSaldoEnDivisa } from './SaldoEnDivisa.mjs';
import IngresosRetiradas from './IngresosRetiradas.mjs';

// await $`soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ./csv ./downloads/*.xls`;

let ingresosRetiradas;
const files = await glob('csv/*.csv');
for (const file of files.sort()) {
  if (file.includes('Saldo en Divisa')) {
    await readSaldoEnDivisa(file);
  }
  if (file.includes('ingresosRetiradas')) {
    ingresosRetiradas = await IngresosRetiradas(file);
  }
}
const saldoEnDivisa = processSaldoEnDivisa();

console.table(saldoEnDivisa);
