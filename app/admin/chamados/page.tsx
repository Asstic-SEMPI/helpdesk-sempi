import React from 'react';
import { listarChamadosAdmin } from '@/app/actions/tickets';
import { listarTecnicos } from '@/app/actions/usuarios';
import { ChamadosTable } from '@/components/admin/ChamadosTable';
import { Ticket } from 'lucide-react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestão de Chamados',
};

export const dynamic = 'force-dynamic';

export default async function ChamadosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const status = resolvedParams?.status || 'TODOS';
  const categoria = resolvedParams?.categoria || 'TODAS';
  const tecnicoId = resolvedParams?.tecnicoId || 'TODOS';
  const busca = resolvedParams?.busca || '';

  const [chamados, tecnicos] = await Promise.all([
    listarChamadosAdmin({ status, categoria, tecnicoId, busca }),
    listarTecnicos(),
  ]);

  // Contadores para cards de métricas
  const total = chamados.length;
  const abertos = chamados.filter((c) => c.status === 'CRIADO').length;
  const emAndamento = chamados.filter((c) => c.status === 'EM_ATENDIMENTO').length;
  const aguardando = chamados.filter((c) => c.status === 'AGUARDANDO_CONFIRMACAO').length;
  const reabertos = chamados.filter((c) => c.status === 'REABERTO').length;
  const concluidos = chamados.filter((c) => c.status === 'CONCLUIDO').length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1E3B] tracking-tight flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-[#003B73]" />
            Central de Chamados de TI • SEMPI
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Triagem, distribuição de demandas, atendimento técnico e acompanhamento
          </p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total</span>
          <p className="text-2xl font-extrabold text-[#0B1E3B] mt-1">{total}</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-blue-700">Abertos</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{abertos}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-700">Em Atendimento</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{emAndamento}</p>
        </div>
        <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-purple-700">Aguardando Validação</span>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">{aguardando}</p>
        </div>
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-rose-700">Reabertos</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{reabertos}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700">Concluídos</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{concluidos}</p>
        </div>
      </div>

      {/* Tabela Interativa de Chamados */}
      <ChamadosTable
        chamados={chamados}
        tecnicos={tecnicos}
        filtrosAtuais={{ status, categoria, tecnicoId, busca }}
      />
    </div>
  );
}
