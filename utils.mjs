import { Console } from 'node:console';
export const readAllLines = async (fname) => {
  const fileContents = await fs.readFile(fname, 'latin1');
  return fileContents
    .trim()
    .split('\n')
    .map((s) => s.trim());
};

export const readConocidos = async (fname) => {
  const fileContents = await readAllLines(fname);
  return fileContents
    .filter((l) => !l.startsWith('-'))
    .map((row) => {
      const [r, s] = row.split(',');
      return [r.trim(), (s ?? r).trim()];
    });
};

export const logger = (fname) => new Console(fs.createWriteStream(fname));

export class Fecha {
  constructor(y, m, d = 1) {
    if (y instanceof Date) {
      const [y1, m1, d1] = y.toISOString().split('T')[0].split('-');
      this.y = parseInt(y1, 10);
      this.m = parseInt(m1, 10);
      this.d = parseInt(d1, 10);
    } else {
      this.y = parseInt(y, 10);
      this.m = parseInt(m, 10);
      this.d = parseInt(d, 10);
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
  static fromSabadell(fecha) {
    const [d, m, y] = fecha.split('/');
    return new Fecha(y, m, d);
  }
}
