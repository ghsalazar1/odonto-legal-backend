const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const { jsPDF } = require('jspdf');
const path = require('path');
const fs = require('fs');
const { sanitizeFolderName } = require('../utils/helpers');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const isProduction = process.env.IS_PRODUCTION === 'true';

function wrapText(doc, text, x, y, maxWidth) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * 10;
}

async function loadImageBuffer(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return 'data:image/jpeg;base64,' + base64;
}

async function generatePdfBuffer(caseData, summary, notes) {
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(14);
  doc.text(caseData.title, 10, y);
  y += 10;

  doc.setFontSize(10);
  y = wrapText(doc, `Status: ${caseData.status}`, 10, y, 180);
  y = wrapText(doc, `Data do Acontecimento: ${caseData.caseDate}`, 10, y, 180);
  y = wrapText(doc, `Data de Abertura: ${caseData.openedAt}`, 10, y, 180);
  if (caseData.closedAt) y = wrapText(doc, `Data de Fechamento: ${caseData.closedAt}`, 10, y, 180);

  y += 5;
  doc.setFontSize(12);
  doc.text('Resumo do Caso:', 10, y);
  y = wrapText(doc, summary, 10, y + 5, 180);

  y += 5;
  doc.text('Observações do Perito:', 10, y);
  y = wrapText(doc, notes, 10, y + 5, 180);

  // Adiciona evidências
  if (caseData.existingEvidences && caseData.existingEvidences.length > 0) {
    y += 10;
    doc.setFontSize(12);
    doc.text('Evidências:', 10, y);
    y += 5;

    for (const ev of caseData.existingEvidences) {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }

      doc.setFontSize(10);
      doc.text(`Tipo: ${ev.type}`, 10, y);
      y += 6;

      if (ev.type === 'TEXT') {
        y = wrapText(doc, ev.textData || '(Sem conteúdo)', 10, y, 180);
      } else if (ev.type === 'IMAGE' && ev.signedUrl) {
        try {
          const imageData = await loadImageBuffer(ev.signedUrl);
          doc.addImage(imageData, 'JPEG', 10, y, 80, 60);
          y += 65;
        } catch (err) {
          doc.text('Erro ao carregar imagem', 10, y);
          y += 6;
        }
      } else {
        // Outros tipos: AUDIO, DOCUMENT, PDF, OTHER
        const label =
          ev.type === 'AUDIO' ? 'Áudio'
          : ev.type === 'DOCUMENT' ? 'Documento Word'
          : ev.type === 'PDF' ? 'Documento PDF'
          : 'Outro';

        doc.text(`${label} disponível em:`, 10, y);
        y += 6;
        doc.setTextColor(0, 0, 255);
        doc.textWithLink(ev.signedUrl || ev.contentUrl, 10, y, { url: ev.signedUrl || ev.contentUrl });
        doc.setTextColor(0, 0, 0);
        y += 10;
      }
    }
  }

  return doc.output('arraybuffer');
}

module.exports = {
  async finalizeCaseAndGenerateDossier(caseId, summary, notes) {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        report: true,
        evidences: true,
      }
    });

    if (!caseData) return { success: false, message: 'Caso não encontrado.' };
    if (caseData.status !== 'Em andamento') return { success: false, message: 'Somente casos em andamento podem gerar dossiê.' };
    if (!caseData.report && (!summary || !notes)) return { success: false, message: 'O caso precisa de resumo e notas do perito.' };

    const caseFullData = await require('./CasesService').getById(caseId);
    const pdfBuffer = await generatePdfBuffer(caseFullData, summary, notes);

    const timestamp = Date.now();
    const folderName = sanitizeFolderName(caseFullData.title);
    const fileName = `${caseId}-${timestamp}.pdf`;

    if (!isProduction) {
      const filePath = path.join(__dirname, '..', 'uploads', 'dossiers', folderName, fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
      return { success: true, contentUrl: filePath };
    } else {
      const uploadPath = `dossiers/${folderName}/${fileName}`;

      const { error } = await supabase.storage
        .from(process.env.SUPABASE_REPORT_BUCKET)
        .upload(uploadPath, Buffer.from(pdfBuffer), {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) {
        console.error('Erro ao enviar PDF para Supabase:', error);
        return { success: false, message: 'Erro ao salvar o dossiê no armazenamento.' };
      }

      return { success: true, contentUrl: uploadPath };
    }
  }
};
