const stripQuotesRx = /^"(.*)"$/;

export async function readCSV(file) {
  const saldos = await fs.readFile(file, 'utf8');
  return saldos
    .split('\n')
    .filter((row) => row.trim().length)
    .map((row) =>
      row.split('\t').map((field) => field.replace(stripQuotesRx, '$1'))
    );
}

export function sliceAfter(rows, pattern) {
  const l = rows.length;
  for (let i = 0; i < l; i++) {
    if (rows[i].join('|').startsWith(pattern)) {
      return rows.slice(i + 1);
    }
  }
  throw new Error(`Pattern [${pattern}] not found`);
}

export function parseImporte(s) {
  return parseFloat(s.replace(',', '.'));
}

export class Fecha {
  constructor(y, m, d = 1) {
    if (y instanceof Fecha) {
      this.y = y.y;
      this.m = y.m;
      this.d = y.d;
    } else if (y instanceof Date) {
      this.y = y.getFullYear();
      this.m = y.getMonth() + 1;
      this.d = y.getDate();
    } else if (typeof m === 'undefined' && typeof y === 'string') {
      const m = Fecha._regexp.exec(y);
      if (m) {
        this.y = parseInt(m[1], 10);
        this.m = parseInt(m[2], 10);
        this.d = parseInt(m[3], 10);
      } else {
        throw new TypeError(`Unable to parse date from string: ${y}`);
      }
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
  get [Symbol.toStringTag]() {
    return `${this.yyyy}-${this.mm}-${this.dd}`;
  }
  toDate() {
    return new Date(this.y, this.m - 1, this.d);
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
  loopUntilMonth(cb, y, m) {
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
  compare(f) {
    if (f instanceof Date) f = new Fecha(f);
    let diff = this.y - f.y;
    if (diff) return diff;
    diff = this.m - f.m;
    if (diff) return diff;
    return this.d - f.d;
  }
  static fromSabadell(fecha) {
    const [d, m, y] = fecha.split('/');
    return new Fecha(y, m, d);
  }
  static ymToString(ym) {
    const [y, m] = ym.split('-');
    return `'${Fecha._meses[m - 1]} / ${y}`;
  }
}

Fecha._regexp = /(\d{2,4})\D?(\d{1,2})\D?(\d{1,2})/;
Fecha._meses = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Oct',
  'Nov',
  'Dic',
];
