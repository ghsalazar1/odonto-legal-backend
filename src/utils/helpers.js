function sanitizeFolderName(name) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .trim();
  }
  
  module.exports = { sanitizeFolderName };