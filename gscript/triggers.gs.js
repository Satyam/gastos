/*
The functions in this file are configured to respond to installable trigger
set in the Tirggers tab in the appScript editor.
*/

// Installed as callback for onOpen trigger.

function mostrarArchivos() {
  const arch = sh.archivos;
  arch.clear();
  sSheet.toast('Buscando archivos en Gastos', 'Cargando...');
  const files = listFiles();
  const l = files.length;
  arch
    .getRange(1, 1, 1, 5)
    .setValues([['Id', 'Archivo', 'Tamaño', 'Fecha', '👇']])
    .setFontWeight('bold')
    .setFontSize(12);
  arch.getRange(1, 5).setNote('Seleccionar el archivo a importar');
  arch.getRange(1, 5, l + 1, 1).setHorizontalAlignment('center');
  arch
    .getRange(2, 1, l, 4)
    .setValues(
      files.map((file) => [
        file.getId(),
        file.getName(),
        file.getSize(),
        file.getDateCreated(),
      ])
    );
  arch.getRange(2, 5, l, 1).insertCheckboxes();
  arch.hideColumn(arch.getRange(1, 1));
  arch.autoResizeColumns(1, 5);
  sSheet.toast('Listo', '', 1);
}

// Installed as callback for onEdit trigger

function leerArchivo(ev) {
  const r = ev.range;
  if (
    r.getColumn() === 5 &&
    r.getSheet().getSheetId() === sh.archivos.getSheetId() &&
    r.isChecked()
  ) {
    sSheet.toast(
      `Leyendo archivo ${sh.archivos.getRange(r.getRow(), 2).getValue()}`
    );
    const content = DriveApp.getFileById(
      sh.archivos.getRange(r.getRow(), 1).getValue()
    )
      .getBlob()
      .getDataAsString()
      .split('\n');
    sh.archivos
      .getRange(10, 2, content.length, 1)
      .setValues(content.map((c) => [c]));
  }
}