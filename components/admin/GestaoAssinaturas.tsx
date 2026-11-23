'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SignatureRequest, SignatureRequestStatus } from '@/types';
import {
  aprovarSolicitacaoAssinatura,
  recusarSolicitacaoAssinatura,
} from '@/app/actions/assinatura';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Building2,
  UserCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';

function formatarDataHora(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_BADGE: Record<
  SignatureRequestStatus,
  { label: string; classes: string }
> = {
  PENDENTE: {
    label: 'Pendente',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  APROVADO: {
    label: 'Aprovado',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  RECUSADO: {
    label: 'Recusado',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

export function GestaoAssinaturas({
  solicitacoes,
}: {
  solicitacoes: SignatureRequest[];
}) {
  const router = useRouter();
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | SignatureRequestStatus>('PENDENTE');
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [recusandoId, setRecusandoId] = useState<string | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filtradas =
    filtroStatus === 'TODOS'
      ? solicitacoes
      : solicitacoes.filter((s) => s.status === filtroStatus);

  const handleAprovar = async (item: SignatureRequest) => {
    setFeedback(null);
    setProcessandoId(item.id);
    const res = await aprovarSolicitacaoAssinatura(item.id);
    setProcessandoId(null);

    if (!res.success) {
      setFeedback({
        type: 'error',
        message: res.error || 'Erro ao aprovar solicitação.',
      });
      return;
    }

    setFeedback({
      type: 'success',
      message:
        res.warning ||
        `Assinatura de ${item.nome} aprovada e link enviado para ${item.email_autenticado}!`,
    });
    router.refresh();
  };

  const handleConfirmarRecusa = async (item: SignatureRequest) => {
    if (!motivoRecusa.trim()) {
      setFeedback({ type: 'error', message: 'Informe o motivo da recusa.' });
      return;
    }

    setFeedback(null);
    setProcessandoId(item.id);
    const res = await recusarSolicitacaoAssinatura(item.id, motivoRecusa);
    setProcessandoId(null);

    if (!res.success) {
      setFeedback({
        type: 'error',
        message: res.error || 'Erro ao recusar solicitação.',
      });
      return;
    }

    setRecusandoId(null);
    setMotivoRecusa('');
    setFeedback({
      type: 'success',
      message: `Solicitação de ${item.nome} recusada e solicitante notificado.`,
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-2 shadow-xs">
        {(['PENDENTE', 'APROVADO', 'RECUSADO', 'TODOS'] as const).map((status) => {
          const active = filtroStatus === status;
          const labels = {
            PENDENTE: 'Pendentes',
            APROVADO: 'Aprovadas',
            RECUSADO: 'Recusadas',
            TODOS: 'Todas',
          };
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {labels[status]}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Lista de Solicitações */}
      {filtradas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm shadow-xs">
          Nenhuma solicitação encontrada para este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((item) => {
            const badge = STATUS_BADGE[item.status];
            const isLoading = processandoId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-[#0B1E3B]">
                        {item.nome}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-700">
                      {item.cargo}
                      {item.id_funcional ? ` • ID: ${item.id_funcional}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {item.setor}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[#003B73]">
                        <Mail className="w-3.5 h-3.5" />
                        {item.email_autenticado}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatarDataHora(item.created_at)}
                      </span>
                    </div>

                    {item.aprovador && item.aprovado_em && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {item.status === 'APROVADO' ? 'Aprovado' : 'Recusado'} por{' '}
                          <strong>{item.aprovador.nome}</strong> em{' '}
                          {formatarDataHora(item.aprovado_em)}
                        </span>
                      </p>
                    )}

                    {item.motivo_recusa && (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <strong>Motivo da recusa:</strong> {item.motivo_recusa}
                      </div>
                    )}
                  </div>

                  {item.status === 'PENDENTE' && (
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleAprovar(item)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Aprovar e Enviar por E-mail</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          setRecusandoId(recusandoId === item.id ? null : item.id);
                          setMotivoRecusa('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Recusar</span>
                      </button>
                    </div>
                  )}
                </div>

                {recusandoId === item.id && item.status === 'PENDENTE' && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={motivoRecusa}
                      onChange={(e) => setMotivoRecusa(e.target.value)}
                      placeholder="Informe o motivo da recusa (ex: servidor não lotado neste setor)..."
                      className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleConfirmarRecusa(item)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Confirmar Recusa
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
