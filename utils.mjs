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
