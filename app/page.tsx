import React from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  PlusCircle,
  ShieldCheck,
  Zap,
  CheckCircle,
  Lock,
  ArrowRight,
  Headphones,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-[#003B73] selection:text-white">
      {/* Header Institucional */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#003B73] flex items-center justify-center text-white shadow-md">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#0B1E3B] tracking-tight block">
                Helpdesk TI • SEMPI
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Gestão e Suporte de Tecnologia da Informação
              </span>
            </div>
          </div>

          <Link
            href="/admin/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
          >
            <Lock className="w-3.5 h-3.5 text-[#003B73]" />
            <span>Acesso Equipe TI</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#003B73] text-xs font-semibold mb-6">
          <Headphones className="w-3.5 h-3.5" />
          <span>Central de Atendimento ao Usuário</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1E3B] tracking-tight leading-tight mb-5">
          Suporte Técnico ágil e integrado para a{' '}
          <span className="text-[#003B73]">SEMPI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Abra chamados para problemas de rede, sistemas, hardware ou e-mail. Receba confirmações e acompanhe cada etapa da resolução diretamente na sua caixa de entrada.
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href="/abrir-chamado"
            className="w-full sm:w-auto px-8 py-4 bg-[#003B73] hover:bg-[#0B1E3B] text-white font-bold rounded-xl text-base shadow-lg shadow-[#003B73]/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Abrir Chamado de TI</span>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003B73] flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0B1E3B] text-base mb-1">Abertura Rápida</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selecione sua unidade da SEMPI, informe o problema e anexe imagens ou relatórios em poucos cliques.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003B73] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0B1E3B] text-base mb-1">Acompanhamento por E-mail</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Você recebe na hora o protocolo e um link exclusivo protegido para acompanhar o atendimento sem precisar de senha.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0B1E3B] text-base mb-1">Validação do Solicitante</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Após a ação técnica, você valida se o serviço foi concluído com sucesso ou solicita reabertura se necessário.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI</span>
          <span>Assessoria de Tecnologia da Informação e Comunicação (ASSTIC)</span>
        </div>
      </footer>
    </div>
  );
}
