const sSheet = SpreadsheetApp.getActiveSpreadsheet();

const sh = {
  historico: sSheet.getSheetByName('Histórico'),
  conocidos: sSheet.getSheetByName('Conocidos'),
  totales: sSheet.getSheetByName('Totales'),
  headings: sSheet.getSheetByName('Encabezados'),
  desconocidos: sSheet.getSheetByName('Desconocidos'),
};

const ui = SpreadsheetApp.getUi();
