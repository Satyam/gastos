import { readCSV, parseImporte } from './utils.mjs';

const tableName = 'ResumenAnual';
const statements = {};

export function createResumenTable(db) {
  db.exec(`
    CREATE TABLE ${tableName} (
      year	INTEGER NOT NULL UNIQUE,
      valorInicial	REAL,
      aportaciones	REAL,
      reembolsos	REAL,
      plusvalia	REAL,
      PRIMARY KEY(year)
    );
  `);
  statements.insertResumen = db.prepare(`
    INSERT INTO ${tableName} 
      (year,	valorInicial,	aportaciones,	reembolsos	,	plusvalia) VALUES 
      ($year,	$valorInicial,	$aportaciones,	$reembolsos	,	$plusvalia)
    `);
  statements.selectAllResumenes = db.prepare(
    `SELECT * FROM ${tableName} ORDER BY year`
  );
  statements.selectByYear = db.prepare(
    `select * from ${tableName} where year = ?`
  );
}

const headings = [
  'Resultados',
  'Situación al inicio del año',
  'Aportaciones en el año',
  'Reembolsos (incluida retención)',
  'Resultado en el año',
  'Resultado acumulado desde (Euros)',
];
const fieldNames = [
  '$year',
  '$valorInicial',
  '$aportaciones',
  '$reembolsos',
  '$plusvalia',
  // Por el momento voy a ignorar este campo porque no entiendo realmente qué significa
  // '$resultadoAcumulado',
];

export async function resumen(files) {
  const res = {};
  for (const file of files) {
    let i = -1;
    const rows = await readCSV(file);
    const tmp = [];
    for (const row of rows) {
      const hdg = row[0];
      switch (i) {
        case -1:
          if (hdg === 'RESUMEN DE RESULTADOS') i++;
          break;
        case 0:
          if (hdg === headings[i]) {
            tmp[i] = [];
            for (const f of row.slice(1)) {
              tmp[i].push(parseInt(f.replace('Año', ''), 10));
            }
            i++;
          } else {
            throw new Error(`File ${file} no contiene fila Resultados`);
          }
          break;
        default:
          if (hdg === headings[i]) {
            tmp[i] = [];
            for (const f of row.slice(1)) {
              tmp[i].push(parseImporte(f));
            }
            i++;
          } else {
            throw new Error(`File ${file} no contiene fila ${headings[i]}`);
          }
          break;
      }
    }
    if (i < 0) {
      throw new Error(
        `File ${file}, no se encuentra encabezado 'RESUMEN DE RESULTADOS'`
      );
    }
    if (i !== 6) {
      throw new Error(
        `File ${file}, llegó hasta el resgistro '${headings[i - 1]}'`
      );
    }
    if (tmp.some((r) => r.length !== 5)) {
      throw new Error(`File ${file}, le faltan columnas`);
    }
    // console.table(tmp);
    for (let nCol = tmp[0].length - 1; nCol >= 0; nCol--) {
      const y = tmp[0][nCol];
      if (!res[y]) res[y] = {};
      const r = res[y];
      for (let nRow = 0; nRow < fieldNames.length; nRow++) {
        const fieldName = fieldNames[nRow];
        if (r[fieldName]) {
          if (Math.abs(r[fieldName] - tmp[nRow][nCol]) > 0.01) {
            throw new Error(
              `File ${file}, campo ${headings[nRow]} del año ${y} no coincide`
            );
          }
        } else {
          r[fieldName] = tmp[nRow][nCol];
        }
      }
    }
  }
  for (const row of Object.values(res)) {
    insertResumen(...Object.values(row));
  }
}

function insertResumen(
  $year,
  $valorInicial,
  $aportaciones,
  $reembolsos,
  $plusvalia
) {
  return statements.insertResumen.run({
    $year,
    $valorInicial,
    $aportaciones,
    $reembolsos,
    $plusvalia,
  });
}

export const getAllResumenes = () => statements.selectAllResumenes.all();
