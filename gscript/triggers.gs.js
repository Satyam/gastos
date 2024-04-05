/*
The functions in this file are configured to respond to installable trigger
set in the Tirggers tab in the appScript editor.
*/

function listFiles() {
  const folders = DriveApp.getFoldersByName('Gastos');
  const textFiles = [];
  while (folders.hasNext()) {
    const folder = folders.next();
    const files = folder.getFilesByType(MimeType.PLAIN_TEXT);
    while (files.hasNext()) {
      textFiles.push(files.next());
      // Logger.log(file.getId() + ' - ' + file.getName() + ' - ' + file.getSize())
    }
  }
  return textFiles;
}

// Installed as callback for onOpen trigger.
function AddMenu() {
  ui.createMenu('Mi Menu')
    .addItem('Mostrar Archivos', 'mostrarArchivos')
    .addItem('Generar Salida', 'generarSalida')
    .addItem('Generar Alquileres', 'generarAlquileres')
    .addToUi();
}
// Installed as callback for onOpen trigger.
function mostrarArchivos() {
  const h = sh.historico;
  sSheet.setActiveSheet(h);
  h.getRange(1, h.getLastColumn() || 1).activateAsCurrentCell();
  sSheet.toast('Buscando archivos en Gastos', 'Cargando...');
  ui.showModalDialog(
    HtmlService.createTemplateFromFile('fileSelect').evaluate(),
    'Seleccionar Archivo'
  );
}
