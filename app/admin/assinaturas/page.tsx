import React from 'react';
import type { Metadata } from 'next';
import { PenTool } from 'lucide-react';
import { listarSolicitacoesAssinaturaAdmin } from '@/app/actions/assinatura';
import { GestaoAssinaturas } from '@/components/admin/GestaoAssinaturas';

export const metadata: Metadata = {
  title: 'Assinaturas Digitais',
};

export const dynamic = 'force-dynamic';

export default async function AssinaturasAdminPage() {
  const solicitacoes = await listarSolicitacoesAssinaturaAdmin();

  const total = solicitacoes.length;
  const pendentes = solicitacoes.filter((s) => s.status === 'PENDENTE').length;
  const aprovadas = solicitacoes.filter((s) => s.status === 'APROVADO').length;
  const recusadas = solicitacoes.filter((s) => s.status === 'RECUSADO').length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1E3B] tracking-tight flex items-center gap-2.5">
            <PenTool className="w-6 h-6 text-[#003B73]" />
            Aprovação de Assinaturas Digitais
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Liberação de solicitações feitas com e-mail setorial ou nome diferente do endereço de e-mail
          </p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total</span>
          <p className="text-2xl font-extrabold text-[#0B1E3B] mt-1">{total}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-700">Pendentes</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{pendentes}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700">Aprovadas</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{aprovadas}</p>
        </div>
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-rose-700">Recusadas</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{recusadas}</p>
        </div>
      </div>

      <GestaoAssinaturas solicitacoes={solicitacoes} />
    </div>
  );
}
