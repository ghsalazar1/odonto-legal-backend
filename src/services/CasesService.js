const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadEvidence, removeEvidenceFile } = require('../utils/uploadEvidence');
const { sanitizeFolderName } = require('../utils/helpers'); 
const { createClient } = require('@supabase/supabase-js');
const ReportService = require('../services/ReportService');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const isProduction = process.env.IS_PRODUCTION === 'true';

const CaseService = {
  async createCase(req) {
    const {
      title,
      description,
      status,
      openedAt,
      closedAt,
      caseDate,
      peritoPrincipalId,
    } = req.body;
  
    // 🔍 Verifica se já existe um caso com o mesmo título
    const existingCase = await prisma.case.findFirst({
      where: {
        title: {
          equals: title,
          mode: 'insensitive'
        }
      }
    });
  
    if (existingCase) {
      return {
        success: false,
        reason: 'title_exists',
        message: 'Já existe um caso com este título.'
      };
    }
  
    const participants = Array.isArray(req.body.participants)
      ? req.body.participants
      : [req.body.participants].filter(Boolean);
  
    const evidences = [];
  
    for (let file of req.files || []) {
      const url = await uploadEvidence(file, sanitizeFolderName(title));
      evidences.push({
        type: file.mimetype.startsWith('image/') ? 'IMAGE'
             : file.mimetype.startsWith('audio/') ? 'AUDIO'
             : file.mimetype === 'application/pdf' ? 'PDF'
             : file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'DOCUMENT'
             : 'OTHER',
        contentUrl: url
      });
    }
  
    const caseData = {
      data: {
        title,
        description,
        status,
        openedAt: new Date(openedAt),
        closedAt: closedAt ? new Date(closedAt) : null,
        caseDate: new Date(caseDate),
        peritoPrincipalId,
        evidences: {
          create: evidences
        },
        caseParticipants: {
          create: participants.map(id => ({ userId: id }))
        }
      },
      include: {
        evidences: true,
        caseParticipants: true
      }
    };
  
    const createdCase = await prisma.case.create(caseData);
    return {
      success: true,
      data: createdCase
    };
  },
  async list(page = 1, limit = 6, search = '') {
    const skip = (page - 1) * limit;

    const filters = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { status: { contains: search, mode: 'insensitive' } },
          ]
        }
      : {};
  
    const [total, cases] = await Promise.all([
      prisma.case.count({ where: filters }),
      prisma.case.findMany({
        where: filters,
        include: {
          peritoPrincipal: {
            select: {id: true, name: true }
          },
          caseParticipants: {
            include: {
              user: {
                select: {id: true, name: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
      })
    ]);
  
    return {
      data: cases.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        caseDate: c.caseDate,
        openedAt: c.openedAt,
        closedAt: c.closedAt,
        avatar: c.avatar,
        peritoPrincipal: c.peritoPrincipal,
        participants: c.caseParticipants.map(cp => cp.user)
      })),
      meta: {
        currentPage: page,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    };    
  },
  async deleteCase(caseId, userId) {
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        evidences: true,
        caseParticipants: true
      }
    });
  
    if (!existingCase) {
      return { success: false, reason: 'not_found', message: "Caso não encontrado." };
    }
  
    if (existingCase.peritoPrincipalId !== userId) {
      return { success: false, reason: 'unauthorized', message: "Somente o perito principal pode excluir o caso." };
    }
  
    // 🧹 Remove todos os arquivos da pasta do caso
    if (isProduction) {
      const folderName = sanitizeFolderName(existingCase.title);
      const { data, error } = await supabase
        .storage
        .from(process.env.SUPABASE_EVIDENCE_BUCKET)
        .list(folderName);
  
      if (data && data.length > 0) {
        const filesToDelete = data.map(item => `${folderName}/${item.name}`);
        const { error: deleteError } = await supabase
          .storage
          .from(process.env.SUPABASE_EVIDENCE_BUCKET)
          .remove(filesToDelete);
  
        if (deleteError) {
          console.error('Erro ao remover arquivos da pasta:', deleteError);
        }
      }
    } else {
      for (const evidence of existingCase.evidences) {
        await removeEvidenceFile(evidence.contentUrl);
      }
    }
  
    await prisma.$transaction([
      prisma.caseParticipant.deleteMany({ where: { caseId } }),
      prisma.evidence.deleteMany({ where: { caseId } }),
      prisma.case.delete({ where: { id: caseId } })
    ]);
  
    return { success: true };
  },
  async updateCase(req, caseId, userId) {
    const {
      title,
      description,
      status,
      openedAt,
      closedAt,
      caseDate,
      peritoPrincipalId
    } = req.body;
  
    const existing = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        evidences: true,
        caseParticipants: true
      }
    });
  
    if (!existing) return { success: false, reason: 'not_found' };
    if (existing.status !== 'Em andamento') return { success: false, reason: 'status_locked' };

    var isParticipant = existing.peritoPrincipalId == userId;
    if(!isParticipant){
      existing.caseParticipants.forEach(participant => {
        if(participant?.userId == userId){
          isParticipant = true;
        }
      });

      if(!isParticipant){
        return { success: false, reason: 'unauthorized' };
      }
    }
  
    // 🔍 Verifica se outro caso já usa esse novo título (exceto o atual)
    const existingWithTitle = await prisma.case.findFirst({
      where: {
        title: {
          equals: title,
          mode: 'insensitive'
        },
        NOT: { id: caseId }
      }
    });
  
    if (existingWithTitle) {
      return {
        success: false,
        reason: 'title_exists',
        message: 'Já existe outro caso com este título.'
      };
    }
  
    const participants = Array.isArray(req.body.participants)
      ? req.body.participants
      : [req.body.participants].filter(Boolean);
  
      const evidencesToRemove = Array.isArray(req.body.evidencesToRemove)
      ? req.body.evidencesToRemove
      : req.body.evidencesToRemove
        ? [req.body.evidencesToRemove]
        : [];
    
  
    // 🧹 Remove arquivos antigos selecionados
    for (let id of evidencesToRemove) {
      const evidence = existing.evidences.find(e => e.id === id);
      if (evidence) {
        await removeEvidenceFile(evidence.contentUrl);
      }
    }
  
    // 📤 Upload de novas evidências na pasta do novo título
    const newEvidences = [];
    for (let file of req.files || []) {
      const url = await uploadEvidence(file, sanitizeFolderName(title)); 
      newEvidences.push({
        type: file.mimetype.startsWith('image/') ? 'IMAGE'
          : file.mimetype.startsWith('audio/') ? 'AUDIO'
          : file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'DOCUMENT'
          : 'OTHER',
        contentUrl: url
      });
    }
  
    await prisma.$transaction([
      prisma.evidence.deleteMany({ where: { id: { in: evidencesToRemove } } }),
      prisma.caseParticipant.deleteMany({ where: { caseId } }),
      prisma.case.update({
        where: { id: caseId },
        data: {
          title,
          description,
          status,
          openedAt: new Date(openedAt),
          closedAt: closedAt ? new Date(closedAt) : null,
          caseDate: new Date(caseDate),
          peritoPrincipalId,
          evidences: { create: newEvidences },
          caseParticipants: {
            create: participants.map(id => ({ userId: id }))
          }
        }
      })
    ]);
  
    return { success: true };
  },  
  async getById(caseId) {
    const caso = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        evidences: {
          select: { id: true, type: true, contentUrl: true }
        },
        caseParticipants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: {
                  select: {
                    description: true
                  }
                }
              }
            }
          }
        },
        peritoPrincipal: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: {
              select: {
                description: true
              }
            }
          }
        }
      }
    });    
  
    if (!caso) {
      throw new Error('Caso não encontrado');
    }
  
    const evidencesWithUrls = await Promise.all(
      caso.evidences.map(async (ev) => {
        if (isProduction) {
          // 🔐 Gera URL assinada no Supabase
          const { data, error } = await supabase
            .storage
            .from(process.env.SUPABASE_EVIDENCE_BUCKET)
            .createSignedUrl(ev.contentUrl, 60 * 60); // 1h
  
          if (error) {
            console.error(`Erro ao gerar URL da evidência ID ${ev.id}:`, error);
          }
  
          return {
            id: ev.id,
            type: ev.type,
            contentUrl: ev.contentUrl,
            signedUrl: data?.signedUrl ?? null
          };
        } else {
          // 💻 Ambiente local — usa o path direto
          return {
            id: ev.id,
            type: ev.type,
            contentUrl: ev.contentUrl,
            signedUrl: ev.contentUrl // já é o path acessível pelo frontend (ex: /uploads/evidences/...)
          };
        }
      })
    );
  
    return {
      id: caso.id,
      title: caso.title,
      description: caso.description,
      status: caso.status,
      caseDate: caso.caseDate.toISOString().split('T')[0],
      openedAt: caso.openedAt.toISOString().split('T')[0],
      closedAt: caso.closedAt ? caso.closedAt.toISOString().split('T')[0] : null,
      peritoPrincipal: {
        id: caso.peritoPrincipal?.id ?? '',
        name: caso.peritoPrincipal?.name ?? '',
        role: caso.peritoPrincipal?.role?.description ?? '',
        avatar: caso.peritoPrincipal?.avatar ?? null
      },
      participants: caso.caseParticipants.map(cp => ({
        id: cp.user.id,
        name: cp.user.name,
        role: cp.user.role?.description ?? '',
        avatar: cp.user.avatar ?? null
      })),
      existingEvidences: evidencesWithUrls,
      newEvidences: []
    };
    
  },
  async finalizeCase(caseId, userId, { summary, notes }) {
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
  
    if (!existingCase) return { success: false, reason: 'not_found', message: 'Caso não encontrado.' };
    if (existingCase.status !== 'Em andamento') return { success: false, message: 'Apenas casos em andamento podem ter o dossiê gerado.' };
    if (existingCase.peritoPrincipalId !== userId) return { success: false, message: 'Apenas o perito principal pode finalizar o caso.' };
  
    const now = new Date();
    const _report = await ReportService.finalizeCaseAndGenerateDossier(caseId, summary, notes);

    if(_report?.success){
      const contentUrl = _report?.contentUrl;
      const updated = await prisma.case.update({
        where: { id: caseId },
        data: {
          status: 'Finalizado',
          closedAt: now,
          report: {
            create: {
              summary,
              notes,
              contentUrl
            }
          }
        },
        include: { report: true }
      });

      return { success: true, data: updated };

    }
    else{
      throw new Error(_report?.message ?? 'Não foi possível gerar o pdf do caso.');
    }
  }
  
  
};

module.exports = CaseService;
