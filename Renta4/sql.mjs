import { DatabaseSync } from 'node:sqlite';

const dbFile = './R4.db';

let _db = null;
export async function initDb() {
  if (_db) return _db;
  await fs.remove(dbFile);
  _db = new DatabaseSync(dbFile);
  return _db;
}

// Execute SQL statements from strings.

export function beginTransaction(option = '') {
  _db && _db.exec(`begin ${option} transaction`);
}

export function commitTransaction() {
  _db && _db.exec('commit transaction');
}

export function rollbackTransaction() {
  _db && _db.exec('rollback transaction');
}
