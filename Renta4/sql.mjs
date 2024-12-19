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

const insertMovStmt = db.prepare(
  'INSERT INTO Movs (fecha, op, fondo, importe, saldo) VALUES (?, ?, ?, ?, ?)'
);
export const insertMov = (fecha, op, fondo, importe, saldo) =>
  insertMovStmt.run(fecha, op, fondo, importe, saldo);

const selectAllMovsStmt = db.prepare('SELECT * FROM Movs ORDER BY id,fecha');
export const getAllMovs = () => selectAllMovsStmt.all();
