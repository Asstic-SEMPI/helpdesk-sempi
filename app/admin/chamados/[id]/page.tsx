import React from 'react';
import { notFound } from 'next/navigation';
import { obterChamadoAdminPorId } from '@/app/actions/tickets';
import { listarTecnicos } from '@/app/actions/usuarios';
import { AtendimentoDetalhe } from '@/components/admin/AtendimentoDetalhe';

export const dynamic = 'force-dynamic';

export default async function DetalheChamadoAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dadosChamado, tecnicos] = await Promise.all([
    obterChamadoAdminPorId(id),
    listarTecnicos(),
  ]);

  if (!dadosChamado) {
    notFound();
  }

  const { ticket, interacoes, anexos, logs } = dadosChamado;

  return (
    <AtendimentoDetalhe
      ticket={ticket}
      interacoes={interacoes}
      anexos={anexos}
      logs={logs}
      tecnicos={tecnicos}
    />
  );
}
