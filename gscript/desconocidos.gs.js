class Desconocidos {
  constructor() {
    this.hash = {};
  }

  add(concepto, fecha, importe) {
    let dh = this.hash[concepto];
    if (!dh) {
      this.hash[concepto] = dh = {
        cant: 0,
        importe: 0,
        fechas: [],
      };
      dh.cant += 1;
      dh.importe += importe;
      dh.fechas.push(fecha.toString());
    }
  }
  show() {
    sh.desconocidos.clear();
    const desc = Object.entries(this.hash);
    if (desc.length) {
      sh.desconocidos
        .getRange(1, 1, desc.length + 1, 4)
        .setValues([
          ['Concepto', 'Ocurrencias', 'Total', 'Fechas'],
          ...desc.map(([concepto, info]) => [
            concepto,
            info.cant,
            info.importe,
            info.fechas.join(' , '),
          ]),
        ])
        .sort([
          { column: 3, ascending: false },
          { column: 2, ascending: false },
        ]);
    }
  }
}
