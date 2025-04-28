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

async function generatePdfBuffer(caseData, summary, notes, status) {
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(14);
  doc.text(caseData.title, 10, y);
  y += 10;

  doc.setFontSize(10);
  y = wrapText(doc, `Descrição: ${caseData?.description ?? ''}`, 10, y, 180);

  y += 10;
  
  y = wrapText(doc, `Status: ${status}`, 10, y, 180);
  y = wrapText(doc, `Data do Acontecimento: ${caseData.caseDate}`, 10, y, 180);
  y = wrapText(doc, `Data de Abertura: ${caseData.openedAt}`, 10, y, 180);
  if (caseData.closedAt) y = wrapText(doc, `Data de Fechamento: ${caseData.closedAt}`, 10, y, 180);

  y += 5;
  doc.setFontSize(12);
  doc.text('Resumo do Caso:', 10, y);
  y = wrapText(doc, caseData?.report?.summary ?? summary, 10, y + 5, 180);

  y += 5;
  doc.text('Observações do Perito:', 10, y);
  y = wrapText(doc, caseData?.report?.notes ?? notes, 10, y + 5, 180);

  // Evidências
  if (caseData.existingEvidences?.length > 0) {
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
        } catch {
          doc.text('Erro ao carregar imagem', 10, y);
          y += 6;
        }
      } else {
        // Outros tipos
        const label =
          ev.type === 'AUDIO' ? 'Áudio'
          : ev.type === 'DOCUMENT' ? 'Documento Word'
          : ev.type === 'PDF' ? 'Documento PDF'
          : 'Outro';

        const fullUrl = ev.signedUrl || ev.contentUrl;
        const wrappedUrl = doc.splitTextToSize(fullUrl, 180);

        doc.text(`${label} disponível em:`, 10, y);
        y += 6;

        doc.setTextColor(0, 0, 255);
        doc.textWithLink(wrappedUrl[0], 10, y, { url: fullUrl });
        y += 6;

        for (let i = 1; i < wrappedUrl.length; i++) {
          doc.text(wrappedUrl[i], 10, y);
          y += 6;
        }
        doc.setTextColor(0, 0, 0);
      }

      y += 5;
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
    const pdfBuffer = await generatePdfBuffer(caseFullData, summary, notes, 'Finalizado');

    const timestamp = Date.now();
    const folderName = sanitizeFolderName(caseFullData.title);
    const fileName = `${caseId}-${timestamp}.pdf`;
    const uploadPath = `dossiers/${folderName}/${fileName}`;

    if (!isProduction) {
      const filePath = path.join(__dirname, '..', 'uploads', 'dossiers', folderName, fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
      return { success: true, contentUrl: uploadPath };
    } else {
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
  },
  async getAll() {
    const reports = await prisma.report.findMany({
      include: {
        case: {
          include: {
            evidences: true,
            peritoPrincipal: {
              select: { id: true, name: true }
            },
            caseParticipants: {
              include: {
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = await Promise.all(reports.map(async (report) => {
      const caseInfo = report.case;
      const folderName = sanitizeFolderName(caseInfo.title);
      const fileName = report.contentUrl;
      let finalUrl = null;

      if (isProduction) {
        const { data, error } = await supabase.storage
          .from(process.env.SUPABASE_REPORT_BUCKET)
          .createSignedUrl(fileName, 3600);
        finalUrl = data?.signedUrl || null;
      } else {
        finalUrl = report.contentUrl;
      }

      return {
        id: report.id,
        title: caseInfo.title,
        summary: report.summary,
        case: report.case,
        notes: report.notes,
        contentUrl: finalUrl,
        createdAt: report.createdAt,
        evidencesCount: caseInfo.evidences.length,
        peritoPrincipal: caseInfo.peritoPrincipal?.name,
        caseParticipants: caseInfo.caseParticipants.map(cp => cp.user.name)
      };
    }));

    return { success: true, data: formatted };
  }
};
