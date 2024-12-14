import { readCSV } from './utils.mjs';

export async function SaldoEnDivisa(file) {
  console.log('Saldo En Divisa', file);
  // console.table(await readCSV(file));
}

export default SaldoEnDivisa;
