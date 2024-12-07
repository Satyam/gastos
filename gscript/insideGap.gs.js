/**
 * Produces a tab `within` showing whether expenses come
 * after the credit card is due and before the rent comes in.
 * It helps in making the estimation of how much money to have
 * in reserve before the rent comes.
 * It also provides info to build the 'estimados' sheet
 */

class InsideGap {
  constructor(ultimoAnyo) {
    this.ultimoAnyo = ultimoAnyo;
    // `headings` comes from `tablas.gs`
    this.hash = headings.reduce((hash, [heading, frecuencia]) => {
      if (heading.startsWith('-')) return hash;
      return {
        [heading]: {
          frecuencia,
          within: 0,
          total: 0,
          importe: 0,
          $within: 0,
          $total: 0,
          $importe: 0,
          $dia: 0,
        },
        ...hash,
      };
    }, {});
  }
  add(inside, heading, fecha, importe) {
    // drop the anual payment from the statistics so it counts only the monthly 'copagos'
    if (heading === HEADINGS.SANITAS && importe < -1000) return;
    const hh = this.hash[heading];
    const dentro = this.ultimoAnyo.compare(fecha) < 0;
    hh.total += 1;
    if (dentro) hh.$total += 1;
    if (inside && importe < 0) {
      hh.within += 1;
      hh.importe += importe;
      if (dentro) {
        hh.$within += 1;
        hh.$importe += importe;
        hh.$dia += fecha.d;
      }
    }
  }
  show() {
    const hdgs = Object.keys(this.hash);
    const titles = [
      'Heading',
      'frecuencia',
      'within',
      'total',
      'importe',
      'promedio',
      '$within',
      '$total',
      '$importe',
      '$promedio',
      '$dia',
    ];

    sh.within.getRange(1, 1, 1, titles.length).setValues([titles]);

    sh.within.getRange(2, 1, hdgs.length, titles.length).setValues(
      hdgs.map((heading) => {
        const {
          frecuencia,
          within,
          total,
          importe,
          $within,
          $total,
          $importe,
          $dia,
        } = this.hash[heading];
        return [
          heading,
          frecuencia,
          within,
          total,
          importe,
          within ? importe / within : 0,
          $within,
          $total,
          $importe,
          $within ? $importe / $within : 0,
          $within ? $dia / $within : 0,
        ];
      })
    );
  }
}
