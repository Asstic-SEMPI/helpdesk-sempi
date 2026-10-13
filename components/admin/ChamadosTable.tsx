'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Eye,
  Trash2,
  ExternalLink,
  Building,
} from 'lucide-react';
import { STATUS_CONFIG, formatarDataHora } from '@/lib/utils';
import { excluirChamado } from '@/app/actions/tickets';
import { TICKET_CATEGORIES, DEPARTAMENTOS_SEMPI, type Profile } from '@/types';

interface ChamadosTableProps {
  chamados: any[];
  tecnicos: Profile[];
  filtrosAtuais: {
    status: string;
    categoria: string;
    tecnicoId: string;
    busca: string;
  };
}

export function ChamadosTable({
  chamados,
  tecnicos,
  filtrosAtuais,
}: ChamadosTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [busca, setBusca] = useState(filtrosAtuais.busca);
  const [status, setStatus] = useState(filtrosAtuais.status);
  const [categoria, setCategoria] = useState(filtrosAtuais.categoria);
  const [tecnicoId, setTecnicoId] = useState(filtrosAtuais.tecnicoId);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const aplicarFiltros = (novosFiltros: {
    b?: string;
    s?: string;
    c?: string;
    t?: string;
  }) => {
    const params = new URLSearchParams();
    const finalBusca = novosFiltros.b !== undefined ? novosFiltros.b : busca;
    const finalStatus = novosFiltros.s !== undefined ? novosFiltros.s : status;
    const finalCat = novosFiltros.c !== undefined ? novosFiltros.c : categoria;
    const finalTec = novosFiltros.t !== undefined ? novosFiltros.t : tecnicoId;

    if (finalBusca) params.set('busca', finalBusca);
    if (finalStatus && finalStatus !== 'TODOS') params.set('status', finalStatus);
    if (finalCat && finalCat !== 'TODAS') params.set('categoria', finalCat);
    if (finalTec && finalTec !== 'TODOS') params.set('tecnicoId', finalTec);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleExcluir = async (id: string, protocolo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o chamado ${protocolo}? Esta ação é irreversível.`)) {
      return;
    }
    setDeletandoId(id);
    const res = await excluirChamado(id);
    setDeletandoId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert(`Erro: ${res.error}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                aplicarFiltros({ b: busca });
              }
            }}
            placeholder="Buscar por protocolo, solicitante, departamento..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              aplicarFiltros({ s: e.target.value });
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] cursor-pointer"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="CRIADO">Aberto (Criado)</option>
            <option value="EM_ATENDIMENTO">Em Atendimento</option>
            <option value="AGUARDANDO_CONFIRMACAO">Aguardando Validação</option>
            <option value="REABERTO">Reaberto</option>
            <option value="CONCLUIDO">Concluído</option>
          </select>

          {/* Categoria */}
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              aplicarFiltros({ c: e.target.value });
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] max-w-[180px] truncate cursor-pointer"
          >
            <option value="TODAS">Todas as Categorias</option>
            {TICKET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Técnico */}
          <select
            value={tecnicoId}
            onChange={(e) => {
              setTecnicoId(e.target.value);
              aplicarFiltros({ t: e.target.value });
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] max-w-[170px] truncate cursor-pointer"
          >
            <option value="TODOS">Todos os Técnicos</option>
            <option value="SEM_TECNICO">Sem Técnico Atribuído</option>
            {tecnicos.map((tec) => (
              <option key={tec.id} value={tec.id}>
                {tec.nome}
              </option>
            ))}
          </select>

          <button
            onClick={() => aplicarFiltros({ b: busca })}
            className="px-4 py-2 bg-[#003B73] hover:bg-[#0B1E3B] text-white font-medium rounded-xl text-sm transition-all shadow-xs cursor-pointer"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Protocolo</th>
                <th className="py-3.5 px-4">Solicitante</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Técnico</th>
                <th className="py-3.5 px-4">Abertura</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chamados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum chamado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                chamados.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || {
                    label: item.status,
                    badgeClass: 'bg-slate-100 text-slate-700',
                  };

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Protocolo */}
                      <td className="py-4 px-4 font-mono font-bold text-[#003B73]">
                        {item.protocolo}
                      </td>

                      {/* Solicitante & Depto */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.nome_solicitante}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{item.departamento}</span>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200 max-w-[180px] truncate">
                          {item.categoria}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Técnico Responsável */}
                      <td className="py-4 px-4 text-slate-700">
                        {item.tecnico_responsavel ? (
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-[#003B73] border border-blue-200 flex items-center justify-center font-bold text-[10px]">
                              {item.tecnico_responsavel.nome.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[130px] font-medium">
                              {item.tecnico_responsavel.nome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Não atribuído
                          </span>
                        )}
                      </td>

                      {/* Data de Abertura */}
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatarDataHora(item.created_at)}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/chamados/${item.id}`}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-[#003B73] hover:text-white text-slate-700 transition-all border border-slate-200"
                            title="Atender / Ver Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/acompanhar/${item.tracking_token}`}
                            target="_blank"
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200"
                            title="Ver tela pública do solicitante"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleExcluir(item.id, item.protocolo)}
                            disabled={deletandoId === item.id}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-all border border-slate-200 disabled:opacity-40 cursor-pointer"
                            title="Excluir Chamado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
