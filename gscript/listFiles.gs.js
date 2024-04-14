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
