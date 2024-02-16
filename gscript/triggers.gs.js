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

function mostrarArchivos() {
  const files = listFiles();

  sSheet.toast('Buscando archivos en Gastos', 'Cargando...');
  const htmlOutput = HtmlService.createHtmlOutput(`<!DOCTYPE html>
<html>
  <head>
    <base target="_top" />
    <style>
      table {
        width: 100%;
      }
      td {
        padding: 1rem;
      }
      .size {
        text-align: right;
      }
      .date {
        text-align: center;
      }
    </style>
  </head>
  <body>
    <table>
      <tr>
        <th>Nombre</th>
        <th>Tamaño (bytes)</th>
        <th>Fecha de creación</th>
      </tr>
      ${files
        .map(
          (file) => `
      <tr>
        <td>
          <a href="#${file.getId()}" onclick="send()">${file.getName()}</a>
        </td>
        <td class="size">${file.getSize()}</td>
        <td class="date">${file.getDateCreated().toLocaleDateString()}</td>
      </tr>
      `
        )
        .join('\n')}
    </table>
    <script>
      document.querySelectorAll('a').forEach((aEl) =>
        aEl.addEventListener('click', (ev) => {
          ev.preventDefault();
          google.script.run
            .withSuccessHandler(() => google.script.host.close())
            .procesarArchivo(
              ev.currentTarget.getAttribute('href').substring(1)
            );
        })
      );
    </script>
  </body>
</html>
`);
  ui.showModalDialog(htmlOutput, 'Seleccionar Archivo');
}
