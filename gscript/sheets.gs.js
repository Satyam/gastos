const sSheet = SpreadsheetApp.getActiveSpreadsheet();

const sh = {
  importado: sSheet.getSheetByName('Importado'),
  historico: sSheet.getSheetByName('Histórico'),
  conocidos: sSheet.getSheetByName('Conocidos'),
  totales: sSheet.getSheetByName('Totales'),
  archivos: sSheet.getSheetByName('Archivos'),
};

const ui = SpreadsheetApp.getUi();
