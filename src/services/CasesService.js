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
      const url = await storeFile(file);
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
  }
};

module.exports = CaseService;
