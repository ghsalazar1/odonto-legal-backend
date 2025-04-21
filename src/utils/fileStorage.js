const fs = require('fs');
const path = require('path');

// Tipos de arquivos permitidos
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'audio/mpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
];

// Função para limpar o nome do arquivo
function sanitizeFilename(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-');
}

async function storeFile(file, title = 'caso') {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
  }

  const uploadDir = path.join(__dirname, '../uploads/evidences');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const extension = path.extname(file.originalname);
  const baseName = sanitizeFilename(title);
  const timestamp = Date.now();
  const fileName = `${baseName}-${timestamp}${extension}`;

  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, file.buffer);

  return `/uploads/evidences/${fileName}`;
}

module.exports = { storeFile };
