const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { storeFile } = require('../utils/fileStorage');

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

    const participants = Array.isArray(req.body.participants)
      ? req.body.participants
      : [req.body.participants].filter(Boolean);

    const evidences = [];

    for (let file of req.files || []) {
      const url = await storeFile(file, title); // passa o title
      evidences.push({
        type: file.mimetype.startsWith('image/') ? 'IMAGE'
             : file.mimetype.startsWith('audio/') ? 'AUDIO'
             : file.mimetype === 'application/pdf' ? 'DOCUMENT'
             : 'OTHER',
        contentUrl: url
      });
    }    

    var obj = {
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
    }

    const createdCase = await prisma.case.create(obj);

    return createdCase;
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
  
    await prisma.caseParticipant.deleteMany({
      where: { caseId }
    });
  
    await prisma.evidence.deleteMany({
      where: { caseId }
    });
  
    await prisma.case.delete({
      where: { id: caseId }
    });
  
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
    if (existing.peritoPrincipalId !== userId) return { success: false, reason: 'unauthorized' };
  
    const participants = Array.isArray(req.body.participants)
      ? req.body.participants
      : [req.body.participants].filter(Boolean);
  
    const evidencesToRemove = JSON.parse(req.body.evidencesToRemove || '[]');
  
    // Apaga os arquivos físicos
    for (let id of evidencesToRemove) {
      const evidence = existing.evidences.find(e => e.id === id);
      if (evidence) {
        const filePath = path.join(__dirname, '..', evidence.contentUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
  
    const newEvidences = [];
    for (let file of req.files || []) {
      const url = await storeFile(file, title);
      newEvidences.push({
        type: file.mimetype.startsWith('image/') ? 'IMAGE'
          : file.mimetype.startsWith('audio/') ? 'AUDIO'
          : file.mimetype === 'application/pdf' ? 'DOCUMENT'
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
            user: { select: { id: true } }
          }
        },
        peritoPrincipal: {
          select: { id: true }
        }
      }
    });
  
    if (!caso) {
      throw new Error('Caso não encontrado');
    }
  
    return {
      id: caso.id,
      title: caso.title,
      description: caso.description,
      status: caso.status,
      caseDate: caso.caseDate.toISOString().split('T')[0],
      openedAt: caso.openedAt.toISOString().split('T')[0],
      closedAt: caso.closedAt ? caso.closedAt.toISOString().split('T')[0] : null,
      peritoPrincipalId: caso.peritoPrincipal?.id ?? '',
      participants: caso.caseParticipants.map(cp => cp.user.id),
      existingEvidences: caso.evidences.map(ev => ({
        id: ev.id,
        type: ev.type,
        contentUrl: ev.contentUrl
      })),
      newEvidences: [] 
    };
  }
  
};

module.exports = CaseService;
