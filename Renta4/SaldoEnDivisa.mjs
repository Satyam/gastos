import { readCSV, Fecha, sliceAfter, parseImporte } from './utils.mjs';

const statements = {};
export function createMovsTable(db) {
  db.exec(`
    CREATE TABLE Movs (
      id	INTEGER NOT NULL,
      fecha	TEXT NOT NULL,
      op	TEXT NOT NULL,
      fondo	TEXT,
      importe	REAL NOT NULL,
      saldo	REAL,
      PRIMARY KEY(id AUTOINCREMENT)
    ) STRICT
  `);
  statements.insertMov = db.prepare(
    'INSERT INTO Movs (fecha, op, fondo, importe, saldo) VALUES ($fecha, $op, $fondo, $importe, $saldo)'
  );
  statements.selectAllMovs = db.prepare('SELECT * FROM Movs ORDER BY id,fecha');
}

const ops = [
  ['CAMPAÑA FONCUENTA'],
  ['COMPRA DE', 'Compra'],
  ['INTERESES'],
  ['RETENCION A CUENTA', 'Retención'],
  ['TRANSF. EMITIDA A', 'Transf. a'],
  ['TRANSF. RECIBIDA DE', 'Transf. de'],
  ['VENTA DE', 'Venta'],
  ['COMISION EMITIDA', 'Comisión'],
];

export async function saldoEnDivisa(files) {
  const ms = {};
  for (const file of files) {
    const m = await readSaldoEnDivisa(file);
    ms[m[0].fecha?.iso ?? m[1].fecha.iso] = m;
  }
  processSaldoEnDivisa(
    Object.keys(ms)
      .toSorted()
      .reduce((movs, m) => movs.concat(ms[m]), [])
  );
}

async function readSaldoEnDivisa(file) {
  const rows = await readCSV(file);
  return sliceAfter(rows, 'FECHA|CONCEPTO|MOVIMIENTOS|SALDO').map((mov) => {
    return {
      fecha: mov[0] ? Fecha.fromSabadell(mov[0]) : null,
      concepto: mov[1],
      importe: parseImporte(mov[2]),
      saldo: parseImporte(mov[3]),
    };
  });
}

function processSaldoEnDivisa(movs) {
  let saldo = 0;
  let lastFecha = '2000-01-01';

  for (const mov of movs) {
    switch (mov.concepto) {
      case 'SALDO ANTERIOR':
        if (mov.saldo) {
          throw new Error(
            `Saldo anterior inesperado cerca de ${lastFecha}: ${mov.saldo}`
          );
        }
        continue;
      case 'SALDO FINAL':
        if (mov.saldo !== saldo) {
          throw new Error(
            `Saldo final inesperado después de ${lastFecha}: ${mov.saldo}`
          );
        }
        continue;
      case 'ASIENTO DE APERTURA':
        if (mov.saldo !== saldo) {
          throw new Error(
            `Asiento de apertura inesperado después de ${lastFecha}: ${mov.saldo}`
          );
        }
        continue;
      default:
        const f = mov.fecha.iso;
        if (lastFecha > f) {
          throw new Error(`Fechas desordenadas ${lastFecha} - ${f}`);
        }
        lastFecha = f;
        if (saldo + mov.importe - mov.saldo > 0.01) {
          throw new Error(
            `Saldo en ${mov.concepto} de ${f} no da \nSaldo ant:${saldo}, importe: ${mov.importe} no da ${mov.saldo}`
          );
        }
        saldo = mov.saldo;
        const c = mov.concepto;
        let op = null,
          fondo = '';
        ops.forEach(([o, r]) => {
          if (c.startsWith(o)) {
            op = r ?? o;
            fondo = c.replace(o, '').trim();
          }
        });
        if (fondo.includes('BARREIRO')) fondo = 'Satyam';
        if (fondo.includes('ROXANA')) fondo = 'Roxana';
        if (!op) console.error('operación desconocida', c);

        insertMov(f, op, fondo, mov.importe, saldo);
    }
  }
}

function insertMov($fecha, $op, $fondo, $importe, $saldo) {
  return statements.insertMov.run({ $fecha, $op, $fondo, $importe, $saldo });
}

export const getAllMovs = () => statements.selectAllMovs.all();
