import { readCSV, Fecha, sliceAfter, parseImporte } from './utils.mjs';

const statements = {};
export function createIngSalsTable(db) {
  db.exec(`
CREATE TABLE IngSals (
  id	INTEGER NOT NULL,
  fechaValor	TEXT NOT NULL,
  fechaOp	TEXT NOT NULL,
  op	TEXT NOT NULL,
  cuentaOrigen	TEXT NOT NULL,
  ordenante	TEXT NOT NULL,
  cuentaDestino	TEXT NOT NULL,
  destinatario	TEXT NOT NULL,
  estado	TEXT,
  importe	REAL NOT NULL,
  divisa	TEXT,
  concepto	TEXT,
  PRIMARY KEY(id AUTOINCREMENT)
) STRICT;
`);
  statements.selectAllIngSal = db.prepare(
    'SELECT * FROM ingSals ORDER BY id,fechaValor'
  );
  statements.insertIngSal = db.prepare(`INSERT INTO IngSals (
	fechaValor,
	fechaOp,
	op,	
	cuentaOrigen,	
	ordenante,
	cuentaDestino,
	destinatario,
	estado,
	importe,
	divisa,	
	concepto
) VALUES (
 	$fechaValor,	
	$fechaOp,	
	$op,
	$cuentaOrigen,
	$ordenante,	
	$cuentaDestino,	
	$destinatario,
	$estado,
	$importe,	
	$divisa,
	$concepto
)
`);
}
const cuentas = {
  ES3400830001160038501071: 'Renta4',
  ES8000810063260001646768: 'Sabadell',
};
const replaceCuenta = (field) => cuentas[field] ?? field;
const aliases = [
  ['BARREIRO', 'Satyam'],
  ['CABUT', 'Roxana'],
];

const replaceNombre = (field) => {
  for (const [nombre, alias] of aliases) {
    if (field.includes(nombre)) return alias;
  }
  return field;
};

// Retiros de R4 por año y promedio mensual:

// Chequeando que las transferencias en un archivo figuran en el otro.
// select * from IngSals left join Movs on Movs.fecha = IngSals.fechaValor
// where Movs.op = "Transf. a" and IngSals.importe != Movs.importe

export async function ingresosRetiradas([file]) {
  if (file) {
    const rows = await readCSV(file);
    sliceAfter(rows, 'FECHA VALOR|FECHA|OPERACIÓN|CUENTA CARGO')
      .reverse()
      .forEach((row) =>
        insertIngSal(
          Fecha.fromSabadell(row[0]).iso,
          Fecha.fromSabadell(row[1]).iso,
          row[2],
          replaceCuenta(row[3]),
          replaceNombre(row[4]),
          replaceCuenta(row[5]),
          replaceNombre(row[6]),
          row[7],
          parseImporte(row[8]),
          row[9],
          row[10]
        )
      );
  }
}

function insertIngSal(
  $fechaValor,
  $fechaOp,
  $op,
  $cuentaOrigen,
  $ordenante,
  $cuentaDestino,
  $destinatario,
  $estado,
  $importe,
  $divisa,
  $concepto
) {
  return statements.insertIngSal.run({
    $fechaValor,
    $fechaOp,
    $op,
    $cuentaOrigen,
    $ordenante,
    $cuentaDestino,
    $destinatario,
    $estado,
    $importe,
    $divisa,
    $concepto,
  });
}

export const getAllIngSals = () => statements.selectAllIngSal.all();
