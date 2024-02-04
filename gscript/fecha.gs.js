class Fecha {
  constructor(y, m, d = 1) {
    if (y instanceof Fecha) {
      this.y = y.y;
      this.m = y.m;
      this.d = y.d;
    } else if (y instanceof Date) {
      const [y1, m1, d1] = y.toISOString().split('T')[0].split('-');
      this.y = parseInt(y1, 10);
      this.m = parseInt(m1, 10);
      this.d = parseInt(d1, 10);
    } else {
      this.y = parseInt(y, 10);
      this.m = parseInt(m, 10);
      this.d = parseInt(d, 10);
    }
    this._normalize();
  }
  _normalize() {
    while (this.m > 12) {
      this.y++;
      this.m -= 12;
    }
    while (this.m < 1) {
      this.y;
      this.m += 12;
    }
  }
  get yyyy() {
    return String(this.y).padStart(4, '0');
  }
  get mm() {
    return String(this.m).padStart(2, '0');
  }
  get dd() {
    return String(this.d).padStart(2, '0');
  }
  get ym() {
    return `${this.yyyy}-${this.mm}`;
  }
  toString() {
    return `${this.yyyy}-${this.mm}-${this.dd}`;
  }
  addMonths(m) {
    this.m += m;
    this._normalize();
  }
  addYears(y) {
    this.y += y;
  }
  nextMonth() {
    return new Fecha(this.y, this.m + 1);
  }
  nextYear() {
    return new Fecha(this.y + 1, this.m);
  }
  loopUntil(cb, y, m) {
    if (y instanceof Fecha) {
      m = y.m;
      y = y.y;
    }
    for (
      const f = new Fecha(this);
      f.y < y || (f.y == y && f.m <= m);
      f.addMonths(1)
    ) {
      cb(f);
    }
  }
  static fromSabadell(fecha) {
    const [d, m, y] = fecha.split('/');
    return new Fecha(y, m, d);
  }
}
