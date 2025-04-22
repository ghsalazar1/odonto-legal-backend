const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const isProduction = process.env.IS_PRODUCTION === 'true';

// Função para "higienizar" o nome do caso (sem acento, espaço, etc)
function sanitizeFolderName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9-_]/g, '-') // só letras, números, hífens e _
    .replace(/-+/g, '-')             // evita múltiplos hifens
    .toLowerCase()
    .trim();
}

async function uploadEvidence(file, caseTitle) {
  const fileExt = file.originalname.split('.').pop();
  const sanitizedTitle = sanitizeFolderName(caseTitle);
  const fileName = `${Date.now()}-${sanitizedTitle}.${fileExt}`;
  const storagePath = `${sanitizedTitle}/${fileName}`; // caminho no Supabase

  if (isProduction) {
    // 📤 Envio para Supabase com pasta por título
    const { error } = await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Erro ao fazer upload no Supabase:', error);
      throw error;
    }

    return storagePath;
    
  } else {
    // 💾 Armazenamento local (dev)
    const localDir = path.join(__dirname, '..', 'uploads', 'evidences', sanitizedTitle);
    await fs.mkdir(localDir, { recursive: true });

    const filePath = path.join(localDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    return `/uploads/evidences/${sanitizedTitle}/${fileName}`;
  }
}

async function removeEvidenceFile(filePathOrUrl) {
  if (isProduction) {
    const bucketPathParts = filePathOrUrl.split('/');
    const folderAndFile = bucketPathParts.slice(-2).join('/'); // pasta/arquivo
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([folderAndFile]);

    if (error) {
      console.error('Erro ao remover do Supabase:', error);
    }
  } else {
    const fullPath = path.join(__dirname, '..', filePathOrUrl);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      console.warn('Erro ao remover arquivo local:', err.message);
    }
  }
}

module.exports = {
  uploadEvidence,
  removeEvidenceFile
};
