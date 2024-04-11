const BIG_FONT = 16;
const BKG_BAND = 'lightgrey';
const ESTIMATE = 'lightpink';
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
};

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
