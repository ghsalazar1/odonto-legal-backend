const validateCaseCreation = (req) => {
  const {
    title,
    description,
    openedAt,
    caseDate,
    peritoPrincipalId,
    participants
  } = req.body;

  const evidences = req.files || [];

  if (!title || !description || !openedAt || !caseDate) {
    return { isValid: false, message: 'Título, descrição e datas são obrigatórios.' };
  }

  const openedDate = new Date(openedAt);
  const caseRealDate = new Date(caseDate);
  const now = new Date();

  if (openedDate > now || caseRealDate > now) {
    return { isValid: false, message: 'Datas não podem ser futuras.' };
  }

  const hasParticipants = Array.isArray(participants) && participants.length > 0;
  const hasPrincipal = !!peritoPrincipalId;

  if (!hasParticipants && !hasPrincipal) {
    return { isValid: false, message: 'Deve haver ao menos um participante ou um perito principal.' };
  }

  if (hasParticipants && peritoPrincipalId && participants.includes(peritoPrincipalId)) {
    return { isValid: false, message: 'Perito principal não pode estar na lista de participantes.' };
  }

  if (evidences.length === 0) {
    return { isValid: false, message: 'É necessário carregar ao menos uma evidência.' };
  }

  for (const file of evidences) {
    if (file.size > 900 * 1024) {
      return { isValid: false, message: `O arquivo "${file.originalname}" excede o tamanho máximo permitido de 900KB.` };
    }
  }

  return { isValid: true };
};

module.exports = {
  validateCaseCreation
};
