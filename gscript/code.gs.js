const BIG_FONT = 16;
const BKG_BAND = 'lightgrey';
const ESTIMATE = 'gold';
const NUMBER_FORMAT = '#,0.00';

// Estos se tienen que corresponder con los de la solapa `Encabezados`
const HEADINGS = {
  VARIOS: 'Varios',
  COMUNIDAD_GG: 'Comunidad GG',
  IBI_GG: 'IBI GG',
  CONTADOR_AGUA_GG: 'Alquiler contador agua GG',
  CATALANA: 'Catalana Occidente',
  ALQUILER_GG: 'Pago alquiler GG',
  TARJETA: 'Tarjeta de Crédito',
  CLASES_ROXY: 'Clases Roxy',
  ANTES_TARJETA: 'Saldo antes tarjeta',
  ANTES_ALQUILER: 'Saldo antes alquiler',
};

const sSheet = SpreadsheetApp.getActiveSpreadsheet();

const sh = {
  historico: sSheet.getSheetByName('Histórico'),
  conocidos: sSheet.getSheetByName('Conocidos'),
  totales: sSheet.getSheetByName('Totales'),
  headings: sSheet.getSheetByName('Encabezados'),
  desconocidos: sSheet.getSheetByName('Desconocidos'),
  alquileres: sSheet.getSheetByName('Alquileres'),
};

const ui = SpreadsheetApp.getUi();

function getUseComma(emptyCell) {
  return emptyCell
    .setNumberFormat('#.#')
    .setValue(1.1)
    .getDisplayValue()
    .includes(',');
}

function formatCurrency(n) {
  return Number(n).toFixed(2);
}

// short for `dedent` to de-indent template strings
function d(s, ...args) {
  if (Array.isArray(s))
    return d(s.map((s1, i) => s1 + (args[i] ?? '')).join(''), ...args);
  let nTrim = 0;
  return s
    .replace(/^[ \t]*\n/, '')
    .split('\n')
    .map((l, i) => {
      const s1 = l.trimStart();
      if (i) {
        return l.length - s1.length <= nTrim ? s1 : l.slice(nTrim);
      }
      nTrim = l.length - s1.length;
      return s1;
    })
    .join('\n');
}
function l(s, ...args) {
  if (Array.isArray(s)) {
    return l(s.map((s1, i) => s1 + (args[i] ?? '')).join(''), ...args);
  }
  return s
    .trim()
    .split('\n')
    .map((subs) => subs.trim())
    .join('\n');
}

function changeColor(prev, next) {
  const p = Math.abs(prev),
    n = Math.abs(next);
  const change = Math.round(9 * (1 - Math.min(p, n) / Math.max(p, n)));
  return change ? (prev < next ? blues[change] : reds[change]) : '#ffffff';
}

const reds = [
  '#fff5f0',
  '#fee0d2',
  '#fcbba1',
  '#fc9272',
  '#fb6a4a',
  '#ef3b2c',
  '#cb181d',
  '#a50f15',
  '#67000d',
];

const blues = [
  '#f7fbff',
  '#deebf7',
  '#c6dbef',
  '#9ecae1',
  '#6baed6',
  '#4292c6',
  '#2171b5',
  '#08519c',
  '#08306b',
];
