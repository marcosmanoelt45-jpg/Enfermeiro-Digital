import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Sincroniza o array de membros (user_ids) em todas as atividades de uma turma,
// para que o RLS de CaseAssignment permita que membros vejam as atividades da turma.
// Executa como service role para atualizar atividades de qualquer professor.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { turma_id } = body || {};
    if (!turma_id) return Response.json({ error: 'turma_id é obrigatório' }, { status: 400 });

    // Verifica se o usuário é membro ou professor da turma antes de elevar
    const members = await base44.asServiceRole.entities.TurmaMember.filter(
      { turma_id },
      "-updated_date",
      500
    );
    const isMember = members.some((m) => m.user_id === user.id);
    if (!isMember) {
      return Response.json({ error: 'Acesso negado a esta turma' }, { status: 403 });
    }

    const memberIds = members.map((m) => m.user_id).filter(Boolean);

    // Garante que o professor responsável também esteja na lista
    let turma;
    try {
      turma = await base44.asServiceRole.entities.Turma.get(turma_id);
    } catch {}
    if (turma?.teacher_id && !memberIds.includes(turma.teacher_id)) {
      memberIds.push(turma.teacher_id);
    }

    await base44.asServiceRole.entities.CaseAssignment.updateMany(
      { turma_id },
      { $set: { members: memberIds } }
    );

    return Response.json({ ok: true, members: memberIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
