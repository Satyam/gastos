function leerArchivo() {
  sSheet.setActiveSheet(sh.historico);
  ui.showModalDialog(
    HtmlService.createTemplateFromFile('fileSelect').evaluate(),
    'Seleccionar Archivo'
  );
}
