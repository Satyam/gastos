#!/usr/bin/env zx

// file:///usr/share/libreoffice/help/en-US/text/shared/guide/start_parameters.html?&DbPAR=SHARED&System=UNIX
// file:///usr/share/libreoffice/help/en-US/text/shared/guide/convertfilters.html?DbPAR=SHARED#bm_id541554406270299
// https://help.libreoffice.org/latest/en-GB/text/shared/guide/csv_params.html?&DbPAR=SHARED&System=UNIX
/*
soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ./csv *.xls

*/
import SaldoEnDivisa from './SaldoEnDivisa.mjs';
import IngresosRetiradas from './IngresosRetiradas.mjs';

cd('downloads');
await $`soffice --convert-to "csv:Text - txt - csv (StarCalc):9,34,76,1,,0,,,,,,-1" --outdir ../csv *.xls`;
cd('..');
for (const file of await glob('csv/*.csv')) {
  if (file.includes('Saldo en Divisa')) await SaldoEnDivisa(file);
  if (file.includes('ingresosRetiradas')) await IngresosRetiradas(file);
}
