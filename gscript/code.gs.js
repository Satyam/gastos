const BIG_FONT = 16;
const BKG_BAND = 'lightgrey';
const ESTIMATE = 'lightpink';
const NUMBER_FORMAT = '#,0.00';
const HEADING_VARIOS = 'Varios';

function getUseComma(emptyCell) {
  return emptyCell
    .setNumberFormat('#.#')
    .setValue(1.1)
    .getDisplayValue()
    .includes(',');
}
