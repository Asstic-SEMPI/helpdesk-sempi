import React from 'react';
import { notFound } from 'next/navigation';
import { obterChamadoPorToken } from '@/app/actions/tickets';
import { AcompanharChamadoView } from '@/components/publico/AcompanharChamadoView';
import Link from 'next/link';
import { LifeBuoy, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AcompanharChamadoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dados = await obterChamadoPorToken(token);

  if (!dados) {
    notFound();
  }

  const { ticket, interacoes, anexos } = dados;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#003B73] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Página Inicial</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003B73] flex items-center justify-center text-white shadow-xs">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#0B1E3B] block leading-tight">Helpdesk TI</span>
              <span className="text-[10px] text-slate-500 font-medium">SEMPI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <AcompanharChamadoView
          ticket={ticket}
          interacoes={interacoes}
          anexos={anexos}
          token={token}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI • Acompanhamento Seguro
      </footer>
    </div>
  );
}
