'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building,
  Tag,
  Paperclip,
  Loader2,
  FileText,
  ThumbsUp,
  RotateCcw,
  Download,
  Mail,
} from 'lucide-react';
import { STATUS_CONFIG, formatarDataHora } from '@/lib/utils';
import {
  validarChamadoPeloSolicitante,
  obterUrlDownloadAnexo,
} from '@/app/actions/tickets';
import type { Ticket, TicketInteraction, TicketAttachment } from '@/types';

export function AcompanharChamadoView({
  ticket,
  interacoes,
  anexos,
  token,
}: {
  ticket: Ticket;
  interacoes: TicketInteraction[];
  anexos: TicketAttachment[];
  token: string;
}) {
  const router = useRouter();

  const [aprovando, setAprovando] = useState(false);
  const [reabrindo, setReabrindo] = useState(false);
  const [modoRecusa, setModoRecusa] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [arquivoRecusa, setArquivoRecusa] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const statusInfo = STATUS_CONFIG[ticket.status] || {
    label: ticket.status,
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: '',
  };

  const handleConfirmarSolucao = async () => {
    if (!confirm('Deseja confirmar que o atendimento resolveu seu problema e encerrar o chamado?')) {
      return;
    }
    setAprovando(true);
    setErro(null);

    const res = await validarChamadoPeloSolicitante({
      trackingToken: token,
      aprovado: true,
    });

    setAprovando(false);
    if (res.success) {
      setMensagemSucesso('Atendimento aprovado com sucesso! O chamado foi concluído.');
      router.refresh();
    } else {
      setErro(res.error || 'Erro ao confirmar atendimento.');
    }
  };

  const handleRecusarSolucao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoRecusa.trim()) {
      setErro('Por favor, descreva por qual motivo o problema ainda persiste.');
      return;
    }

    setReabrindo(true);
    setErro(null);

    let formData: FormData | null = null;
    if (arquivoRecusa) {
      formData = new FormData();
      formData.append('arquivo', arquivoRecusa);
    }

    const res = await validarChamadoPeloSolicitante({
      trackingToken: token,
      aprovado: false,
      motivoRecusa: motivoRecusa.trim(),
      arquivoRecusa: formData,
    });

    setReabrindo(false);
    if (res.success) {
      setModoRecusa(false);
      setMotivoRecusa('');
      setArquivoRecusa(null);
      setMensagemSucesso('O chamado foi reaberto e a equipe de TI foi notificada.');
      router.refresh();
    } else {
      setErro(res.error || 'Erro ao reabrir chamado.');
    }
  };

  const handleBaixarAnexo = async (storagePath: string) => {
    const url = await obterUrlDownloadAnexo(storagePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Erro ao gerar link de download.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo do Chamado */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Protocolo de Atendimento
            </span>
            <h1 className="font-mono text-3xl font-extrabold text-[#003B73] mt-0.5">
              {ticket.protocolo}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Aberto em {formatarDataHora(ticket.created_at)}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span
              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
            <span className="text-[11px] text-slate-500 max-w-xs text-left sm:text-right">
              {statusInfo.desc}
            </span>
          </div>
        </div>

        {/* Informações Resumidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-slate-500 block mb-1">Solicitante</span>
            <span className="text-[#0B1E3B] font-semibold text-sm">
              {ticket.nome_solicitante}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-slate-500 block mb-1">Unidade / Departamento</span>
            <span className="text-slate-700 font-medium">{ticket.departamento}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-slate-500 block mb-1">Categoria</span>
            <span className="text-[#003B73] font-semibold">{ticket.categoria}</span>
          </div>
        </div>
      </div>

      {/* Alerta de Ação Solicitada (Se estiver em AGUARDANDO_CONFIRMACAO) */}
      {ticket.status === 'AGUARDANDO_CONFIRMACAO' && (
        <div className="bg-blue-50 border-2 border-[#003B73]/30 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#003B73] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#0B1E3B]">
                O atendimento técnico foi concluído!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                A equipe de TI realizou o procedimento e solicita a sua validação. O seu problema foi solucionado com sucesso?
              </p>

              {erro && (
                <div className="mt-3 p-3 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 text-xs">
                  {erro}
                </div>
              )}

              {mensagemSucesso && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs">
                  {mensagemSucesso}
                </div>
              )}

              {!modoRecusa ? (
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <button
                    onClick={handleConfirmarSolucao}
                    disabled={aprovando}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {aprovando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                    <span>Sim, problema resolvido! (Concluir)</span>
                  </button>

                  <button
                    onClick={() => setModoRecusa(true)}
                    className="px-5 py-2.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>Não, ainda tenho problemas (Reabrir)</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecusarSolucao} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-rose-800 mb-1">
                      Descreva detalhadamente o que ainda não está funcionando: *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={motivoRecusa}
                      onChange={(e) => setMotivoRecusa(e.target.value)}
                      placeholder="Ex: O sistema ainda apresenta a mensagem de erro ao tentar salvar..."
                      className="w-full p-3 bg-white border border-rose-300 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Novo anexo complementar (opcional, até 3 MB):
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) =>
                        setArquivoRecusa(e.target.files ? e.target.files[0] : null)
                      }
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={reabrindo}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {reabrindo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Confirmar Reabertura</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoRecusa(false)}
                      className="px-4 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Descrição Original do Chamado */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-[#0B1E3B] flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-[#003B73]" />
          Descrição Original
        </h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 text-sm whitespace-pre-line leading-relaxed">
          {ticket.descricao}
        </div>

        {/* Anexos */}
        {anexos.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Anexos Enviados
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="w-4 h-4 text-[#003B73] flex-shrink-0" />
                    <span className="text-slate-800 font-medium truncate">
                      {anexo.file_name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBaixarAnexo(anexo.storage_path)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#003B73] transition-colors ml-2"
                    title="Baixar Anexo"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Linha do Tempo e Procedimentos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-[#0B1E3B] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-[#003B73]" />
          Histórico de Atendimento e Respostas Técnicas
        </h2>

        {interacoes.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">
            A equipe de TI iniciará o atendimento em breve. Você será notificado por e-mail a cada etapa.
          </p>
        ) : (
          <div className="space-y-4 pt-2">
            {interacoes.map((item) => {
              const isSolicitante = item.actor_type === 'SOLICITANTE';
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    isSolicitante
                      ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className={isSolicitante ? 'text-rose-700' : 'text-[#003B73]'}>
                      {isSolicitante ? 'Você (Solicitante)' : 'Equipe de Suporte TI'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {formatarDataHora(item.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm">{item.mensagem}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
