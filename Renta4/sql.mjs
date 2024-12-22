import { DatabaseSync } from 'node:sqlite';

const dbFile = './R4.db';
await fs.remove(dbFile);
const db = new DatabaseSync(dbFile);

// Execute SQL statements from strings.
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

export function beginTransaction(option = '') {
  db.exec(`begin ${option} transaction`);
}

export function commitTransaction() {
  db.exec('commit transaction');
}

export function rollbackTransaction() {
  db.exec('rollback transaction');
}

const insertMovStmt = db.prepare(
  'INSERT INTO Movs (fecha, op, fondo, importe, saldo) VALUES ($fecha, $op, $fondo, $importe, $saldo)'
);
export const insertMov = ($fecha, $op, $fondo, $importe, $saldo) => {
  return insertMovStmt.run({ $fecha, $op, $fondo, $importe, $saldo });
};

const selectAllMovsStmt = db.prepare('SELECT * FROM Movs ORDER BY id,fecha');
export const getAllMovs = () => selectAllMovsStmt.all();

const insertIngSalStmt = db.prepare(`INSERT INTO IngSals (
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
export const insertIngSal = (
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
) =>
  insertIngSalStmt.run({
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

const selectAllIngSalStmt = db.prepare(
  'SELECT * FROM ingSals ORDER BY id,fechaValor'
);
export const getAllIngSals = () => selectAllIngSalStmt.all();
