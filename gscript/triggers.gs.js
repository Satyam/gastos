/*
The functions in this file are configured to respond to installable trigger
set in the Tirggers tab in the appScript editor.
*/
function AddMenu() {
  ui.createMenu('Mi Menu')
    .addItem('Mostrar Archivos', 'mostrarArchivos')
    .addItem('Generar Salida', 'generarSalida')
    .addItem('Generar Alquileres', 'generarAlquileres')
    .addToUi();
}
