const fs = require('fs');
const path = require('path');

async function storeFile(file) {

  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const filePath = path.join(uploadDir, file.originalname);
  fs.writeFileSync(filePath, file.buffer);

  return `/uploads/${file.originalname}`;
}

module.exports = { storeFile };
