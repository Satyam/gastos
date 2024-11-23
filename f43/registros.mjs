import Fecha from './fecha.mjs';
import {
  numField,
  numValue,
  stringField,
  importe,
  confirmType,
  currencyCode,
  libre,
  conceptoComun,
} from './utils.mjs';

export class CabeceraCuenta {
  static _rxModInfo = /^[123]$/;
  static type = '11';
  constructor(row) {
    try {
      confirmType(row, CabeceraCuenta.type);
      this.entidad = numField(row, 2, 4);
      this.oficina = numField(row, 6, 4);
      this.cuenta = numField(row, 10, 10);
      this.fInicial = new Fecha(numField(row, 20, 6));
      this.fFinal = new Fecha(numField(row, 26, 6));
      this.saldoInicial = importe(row, 32);
      this.divisa = currencyCode(numField(row, 47, 3));
      this.modalidadInfo = numField(row, 50, 1);
      if (!CabeceraCuenta._rxModInfo.test(this.modalidadInfo)) {
        throw new Error(`Modalidad Información debe ser 1, 2 ó 3`);
      }
      this.nombre = stringField(row, 51, 26);
      libre(row, 77, 3);
    } catch (err) {
      throw new Error(`CabeceraCuenta: ${err.message}`);
    }
  }
}

export class PrincipalMovimiento {
  static type = '22';
  constructor(row) {
    try {
      confirmType(row, PrincipalMovimiento.type);
      libre(row, 2, 4);
      this.oficinaOrigen = numField(row, 6, 4);
      this.fechaOperacion = new Fecha(numField(row, 10, 6));
      this.fechaValor = new Fecha(numField(row, 16, 6));
      this.conceptoComun = conceptoComun(row, 22);
      this.conceptoPropio = numField(row, 24, 3);
      this.importe = importe(row, 27);
      this.nroDoc = numField(row, 42, 10);
      this.ref1 = stringField(row, 52, 12);
      this.ref2 = stringField(row, 64, 16);
      this.detalle = '';
    } catch (err) {
      throw new Error(`PrincipalMovimiento: ${err}`);
    }
  }
}

export class ComplementarioConcepto {
  static type = '23';
  constructor(row) {
    try {
      confirmType(row, ComplementarioConcepto.type);
      this.secuencia = numValue(row, 2, 2);
      this.concepto = stringField(row, 4, 76).trim();
    } catch (err) {
      throw new Error(`ComplementarioConcepto: ${err}`);
    }
  }
}

export class FinCuenta {
  static type = '33';
  constructor(row) {
    try {
      confirmType(row, FinCuenta.type);
      this.entidad = numField(row, 2, 4);
      this.oficina = numField(row, 6, 4);
      this.cuenta = numField(row, 10, 10);
      this.numDebe = numValue(row, 20, 5);
      this.totalDebe = numValue(row, 25, 14) / 100;
      this.numHaber = numValue(row, 39, 5);
      this.totalHaber = numValue(row, 44, 14) / 100;
      this.saldoFinal = importe(row, 58);
      this.divisa = currencyCode(numField(row, 73, 3));
      libre(row, 76, 4);
    } catch (err) {
      throw new Error(`FinCuenta: ${err}`);
    }
  }
}
export class FinFichero {
  static type = '88';
  constructor(row, i) {
    try {
      confirmType(row, FinFichero.type);
      if (numField(row, 2, 18) !== ''.padEnd(18, '9')) {
        throw new Error('debe contener todos nueves');
      }
      const num = numValue(row, 20, 6);
      if (num !== i) {
        throw new Error(`Leidos: ${i}, debe haber ${num} registros`);
      }
      libre(row, 26, 54);
    } catch (err) {
      throw new Error(`FinFichero: ${err}`);
    }
  }
}
