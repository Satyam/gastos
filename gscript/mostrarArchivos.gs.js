function mostrarArchivos() {
  sSheet.setActiveSheet(sh.historico);
  sSheet.toast('Buscando archivos en Gastos', 'Cargando...');
  ui.showModalDialog(
    HtmlService.createTemplateFromFile('fileSelect').evaluate(),
    'Seleccionar Archivo'
  );
}
