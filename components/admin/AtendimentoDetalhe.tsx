'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Tag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Paperclip,
  History,
  ExternalLink,
  MessageSquare,
  Loader2,
  FileText,
  Download,
} from 'lucide-react';
import { STATUS_CONFIG, formatarDataHora } from '@/lib/utils';
import {
  atualizarAtendimentoTecnico,
  obterUrlDownloadAnexo,
} from '@/app/actions/tickets';
import type { Ticket, TicketInteraction, TicketAttachment, AuditLog, Profile, TicketStatus } from '@/types';

interface AtendimentoDetalheProps {
  ticket: Ticket;
  interacoes: TicketInteraction[];
  anexos: TicketAttachment[];
  logs: AuditLog[];
  tecnicos: Profile[];
}

export function AtendimentoDetalhe({
  ticket,
  interacoes,
  anexos,
  logs,
  tecnicos,
}: AtendimentoDetalheProps) {
  const router = useRouter();

  const [statusAtual, setStatusAtual] = useState<TicketStatus>(ticket.status);
  const [tecnicoId, setTecnicoId] = useState<string>(ticket.tecnico_responsavel_id || '');
  const [procedimento, setProcedimento] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const statusInfo = STATUS_CONFIG[statusAtual] || {
    label: statusAtual,
    badgeClass: 'bg-slate-100 text-slate-700',
  };

  const handleSalvarAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setMensagemSucesso(null);

    const res = await atualizarAtendimentoTecnico({
      ticketId: ticket.id,
      novoStatus: statusAtual,
      tecnicoId: tecnicoId || undefined,
      procedimento: procedimento.trim() || undefined,
      emailSolicitante: ticket.email_solicitante || undefined,
    });

    setSalvando(false);

    if (res.success) {
      setProcedimento('');
      setMensagemSucesso('Atualização de atendimento registrada e notificação enviada com sucesso!');
      router.refresh();
      setTimeout(() => setMensagemSucesso(null), 4000);
    } else {
      setErro(res.error || 'Erro ao atualizar atendimento.');
    }
  };

  const handleBaixarAnexo = async (storagePath: string) => {
    const url = await obterUrlDownloadAnexo(storagePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Não foi possível obter o link de download.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo / Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/chamados"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-[#003B73]">
                {ticket.protocolo}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Aberto em {formatarDataHora(ticket.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/acompanhar/${ticket.tracking_token}`}
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-[#003B73]" />
            <span>Ver Tela do Solicitante</span>
          </Link>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Detalhes, Resposta e Linha do Tempo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Detalhes da Solicitação */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0B1E3B] flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-[#003B73]" />
              Descrição do Problema
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 text-sm whitespace-pre-line leading-relaxed">
              {ticket.descricao}
            </div>

            {/* Anexos vinculados */}
            {anexos.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Anexos ({anexos.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip className="w-4 h-4 text-[#003B73] flex-shrink-0" />
                        <span className="text-slate-800 font-medium truncate">
                          {anexo.file_name}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          ({Math.round(anexo.file_size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => handleBaixarAnexo(anexo.storage_path)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#003B73] transition-colors ml-2"
                        title="Download Anexo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Formulário de Ação Técnica */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-[#0B1E3B] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-4 h-4 text-[#003B73]" />
              Registrar Procedimento / Atualizar Estado
            </h2>

            {mensagemSucesso && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{mensagemSucesso}</span>
              </div>
            )}

            {erro && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSalvarAtendimento} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Alterar Status */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Novo Status do Chamado
                  </label>
                  <select
                    value={statusAtual}
                    onChange={(e) => setStatusAtual(e.target.value as TicketStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:bg-white"
                  >
                    <option value="CRIADO">CRIADO (Aberto)</option>
                    <option value="EM_ATENDIMENTO">EM ATENDIMENTO (Notifica início por e-mail)</option>
                    <option value="AGUARDANDO_CONFIRMACAO">
                      AGUARDANDO CONFIRMAÇÃO (Notifica validação por e-mail)
                    </option>
                    <option value="REABERTO">REABERTO</option>
                    <option value="CONCLUIDO">CONCLUIDO (Encerrado)</option>
                  </select>
                </div>

                {/* Atribuir Técnico */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Técnico Responsável
                  </label>
                  <select
                    value={tecnicoId}
                    onChange={(e) => setTecnicoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:bg-white"
                  >
                    <option value="">Nenhum / Desatribuir</option>
                    {tecnicos.map((tec) => (
                      <option key={tec.id} value={tec.id}>
                        {tec.nome} ({tec.cargo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Procedimento Realizado */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Procedimento Técnico Adotado / Observações
                </label>
                <textarea
                  rows={4}
                  value={procedimento}
                  onChange={(e) => setProcedimento(e.target.value)}
                  placeholder="Ex: Realizada troca do cabo de rede no ponto 14 e restabelecida a conectividade do terminal..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Notificação automática por e-mail para:</span>
                <span className="font-bold text-[#003B73]">
                  {ticket.email_solicitante || 'Sem e-mail cadastrado'}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2.5 bg-[#003B73] hover:bg-[#0B1E3B] text-white font-semibold rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Salvar e Notificar por E-mail</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Histórico de Interações */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0B1E3B] flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-[#003B73]" />
              Diálogo e Interações ({interacoes.length})
            </h2>

            {interacoes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">
                Nenhum procedimento ou réplica registrada até o momento.
              </p>
            ) : (
              <div className="space-y-3">
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
                      <div className="flex items-center justify-between font-semibold mb-1.5">
                        <span className="flex items-center gap-1.5">
                          {isSolicitante ? (
                            <span className="text-rose-700">Solicitante (Validação / Réplica)</span>
                          ) : (
                            <span className="text-[#003B73]">
                              Técnico: {item.actor?.nome || 'Equipe TI'}
                            </span>
                          )}
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

        {/* Coluna 3: Dados do Solicitante e Auditoria */}
        <div className="space-y-6">
          {/* Card Solicitante */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#003B73]" />
              Dados do Solicitante
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nome Completo</span>
                <span className="font-bold text-[#0B1E3B] text-sm">
                  {ticket.nome_solicitante}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">E-mail</span>
                <span className="font-semibold text-[#003B73] flex items-center gap-1.5 mt-0.5 break-all">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  {ticket.email_solicitante || 'Não informado'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Unidade / Departamento</span>
                <span className="font-medium text-slate-800">
                  {ticket.departamento}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Categoria</span>
                <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-[#003B73] border border-slate-200 font-semibold mt-1">
                  {ticket.categoria}
                </span>
              </div>
            </div>
          </div>

          {/* Trilha de Auditoria (Audit Logs) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[#003B73]" />
              Tracklog Imutável ({logs.length})
            </h3>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-[#003B73] font-mono font-semibold">{log.action}</span>
                    <span className="text-slate-400">
                      {formatarDataHora(log.created_at)}
                    </span>
                  </div>
                  <div className="text-slate-600 flex items-center justify-between">
                    <span>Ator: {log.actor?.nome || log.actor_type}</span>
                    <span className="text-slate-400 text-[10px]">
                      IP: {log.ip_address || '127.0.0.1'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
