import { ISO4217 } from './iso4217.mjs';
const rxAllNum = /^\d+$/;

export function numField(row, start, qty) {
  const val = row.substring(start, start + qty);
  if (!rxAllNum.test(val)) {
    throw new Error(
      `numField: Valor desde ${start} hasta ${start + qty} ha de ser numérico`
    );
  }
  return val;
}

export function importe(row, start) {
  const imp = parseInt(numField(row, start + 1, 14), 10) / 100;
  switch (numField(row, start, 1)) {
    case '1':
      return -imp;
    case '2':
      return imp;
    default:
      throw new Error('importe: Clave debe/haber debe ser 1 ó 2');
  }
}

export function libre(row, start, qty) {
  const val = row.substring(start, start + qty);
  if (val.trim().length) {
    throw new Error(
      `Las ${qty} posiciones a partir de ${start} deben estar en blanco, contienen ${val} `
    );
  }
}

export function confirmType(row, code) {
  if (numField(row, 0, 2) !== String(code)) {
    throw new Error(`Código de registro de cabecera debe ser ${code}`);
  }
}

const cCodes = {};
export function currencyCode(num) {
  return cCodes[num];
}

{
  const l = ISO4217.length;

  for (let i = 0; i < l; i++) {
    cCodes[ISO4217[i][3]] = ISO4217[i][2];
  }
}

const _conceptosComunes = {
  '01': 'TALONES - REINTEGROS',
  '02': 'ABONARÉS - ENTREGAS - INGRESOS',
  '03': 'DOMICILIADOS - RECIBOS - LETRAS - PAGOS POR SU CTA.',
  '04': 'GIROS - TRANSFERENCIAS - TRASPASOS - CHEQUES',
  '05': 'AMORTIZACIONES PRÉSTAMOS, CRÉDITOS, ETC.',
  '06': 'REMESAS EFECTOS',
  '07': 'SUSCRIPCIONES - DIV. PASIVOS - CANJES.',
  '08': 'DIV. CUPONES - PRIMA JUNTA - AMORTIZACIONES',
  '09': 'OPERACIONES DE BOLSA Y/O COMPRA /VENTA VALORES',
  10: 'CHEQUES GASOLINA',
  11: 'CAJERO AUTOMÁTICO',
  12: 'TARJETAS DE CRÉDITO - TARJETAS DÉBITO',
  13: 'OPERACIONES EXTRANJERO',
  14: 'DEVOLUCIONES E IMPAGADOS',
  15: 'NÓMINAS - SEGUROS SOCIALES',
  16: 'TIMBRES - CORRETAJE - PÓLIZA',
  17: 'INTERESES - COMISIONES – CUSTODIA - GASTOS E IMPUESTOS',
  98: 'ANULACIONES - CORRECCIONES ASIENTO',
  99: 'VARIOS',
};
export function conceptoComun(row, start) {
  return _conceptosComunes[numField(row, start, 2)];
}
