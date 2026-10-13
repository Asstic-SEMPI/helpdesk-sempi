'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  Mail,
  Building2,
  Tag,
  FileText,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  TICKET_CATEGORIES,
  DEPARTAMENTOS_SEMPI,
  type TicketCategory,
} from '@/types';
import { criarChamado } from '@/app/actions/tickets';

export function FormularioAberturaChamado() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [emailSolicitante, setEmailSolicitante] = useState('');
  const [departamento, setDepartamento] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [protocoloCriado, setProtocoloCriado] = useState<string | null>(null);
  const [trackingTokenCriado, setTrackingTokenCriado] = useState<string | null>(null);

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > 3 * 1024 * 1024) {
        alert('O arquivo selecionado excede o limite máximo permitido de 3 MB.');
        return;
      }
      setArquivo(f);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departamento) {
      setErro('Por favor, selecione a unidade / departamento.');
      return;
    }

    if (!categoria) {
      setErro('Por favor, selecione a categoria do problema.');
      return;
    }

    setEnviando(true);
    setErro(null);

    const formData = new FormData();
    formData.append('nome_solicitante', nome.trim());
    formData.append('email_solicitante', emailSolicitante.trim());
    formData.append('departamento', departamento.trim());
    formData.append('categoria', categoria);
    formData.append('descricao', descricao.trim());
    if (arquivo) {
      formData.append('arquivo', arquivo);
    }

    const res = await criarChamado(formData);
    setEnviando(false);

    if (res.success && res.protocolo && res.tracking_token) {
      setProtocoloCriado(res.protocolo);
      setTrackingTokenCriado(res.tracking_token);
    } else {
      setErro(res.error || 'Ocorreu um erro ao abrir seu chamado.');
    }
  };

  if (protocoloCriado && trackingTokenCriado) {
    const urlAcompanhamento = `${window.location.origin}/acompanhar/${trackingTokenCriado}`;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Chamado Registrado com Sucesso
          </span>
          <h2 className="text-3xl font-extrabold text-[#0B1E3B] mt-3">
            Protocolo: <span className="font-mono text-[#003B73]">{protocoloCriado}</span>
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Enviamos uma confirmação para <strong className="text-slate-800">{emailSolicitante}</strong>. Todas as atualizações e procedimentos do técnico serão enviados diretamente para sua caixa de entrada.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
            Link Exclusivo de Acompanhamento (Sem Senha):
          </span>
          <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-[#003B73] break-all shadow-sm">
            <span>{urlAcompanhamento}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
          <button
            onClick={() => router.push(`/acompanhar/${trackingTokenCriado}`)}
            className="w-full sm:w-auto px-6 py-3 bg-[#003B73] hover:bg-[#0B1E3B] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Acessar Painel do Chamado</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E3B] tracking-tight">
          Abertura de Chamado de TI
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Informe seus dados e o problema com precisão para que a equipe de suporte atenda rapidamente.
        </p>
      </div>

      {erro && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome do Solicitante */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Nome Completo do Solicitante *
          </label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Pereira da Silva"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>

        {/* E-mail e Departamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              E-mail *
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={emailSolicitante}
                onChange={(e) => setEmailSolicitante(e.target.value)}
                placeholder="solicitante@orgao.gov.br"
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-transparent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Departamento como Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Unidade / Departamento *
            </label>
            <div className="relative">
              <Building2 className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                required
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Selecione a unidade...
                </option>
                {DEPARTAMENTOS_SEMPI.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Categoria do Chamado */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Categoria do Problema *
          </label>
          <div className="relative">
            <Tag className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Selecione a categoria do chamado...
              </option>
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Descrição Detalhada */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Descrição do Problema ou Necessidade *
          </label>
          <textarea
            required
            rows={5}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que está acontecendo com o máximo de detalhes possível (mensagens de erro, patrimônio do equipamento, etc.)..."
            className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-transparent transition-all shadow-sm leading-relaxed"
          />
        </div>

        {/* Upload de Anexo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Anexo (Foto do erro, documento ou print) - Opcional, até 3 MB
          </label>
          <div className="relative border-2 border-dashed border-slate-300 hover:border-[#003B73] rounded-xl p-4 text-center transition-all bg-slate-50/50 hover:bg-slate-50">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleArquivoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {arquivo ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="w-4 h-4 text-[#003B73] flex-shrink-0" />
                  <span className="text-slate-800 font-medium truncate">{arquivo.name}</span>
                  <span className="text-slate-500">
                    ({Math.round(arquivo.size / 1024)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArquivo(null);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 text-slate-500">
                <Paperclip className="w-5 h-5 text-slate-400 mb-1.5" />
                <span className="text-xs font-medium text-slate-700">
                  Clique ou arraste um arquivo aqui (PDF, PNG, JPG)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Tamanho máx. 3 MB</span>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3.5 px-6 bg-[#003B73] hover:bg-[#0B1E3B] text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {enviando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registrando Chamado...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Enviar Chamado de TI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
