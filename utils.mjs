import { Console } from 'node:console';
export const readAllLines = async (fname) => {
  const fileContents = await fs.readFile(fname, 'latin1');
  return fileContents.trim().split('\n');
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

export const ymKey = (date) => date.slice(0, 7);

export const parseSabadellDate = (ds) =>
  ds.replace(/(\d+)\/(\d+)\/(\d+)/, (_, d, m, y) => joinDate(y, m, d));

export const splitDate = (date) => date.split('-').map((p) => parseInt(p, 10));

export const joinDate = (y, m, d = 1) =>
  [
    String(y).padStart(4, '0'),
    String(m).padStart(2, '0'),
    String(d).padStart(2, '0'),
  ].join('-');
export const logger = (fname) => new Console(fs.createWriteStream(fname));
