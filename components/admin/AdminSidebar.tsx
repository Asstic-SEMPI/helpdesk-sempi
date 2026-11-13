'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Ticket,
  Users,
  LogOut,
  LifeBuoy,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

export function AdminSidebar({ perfil }: { perfil?: any }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Recupera a preferência salva no navegador
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch (_) {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch (_) {}
      return next;
    });
  };

  const navItems = [
    {
      label: 'Chamados',
      href: '/admin/chamados',
      icon: Ticket,
      active: pathname.startsWith('/admin/chamados'),
    },
    {
      label: 'Equipe de TI',
      href: '/admin/usuarios',
      icon: Users,
      active: pathname.startsWith('/admin/usuarios'),
    },
  ];

  return (
    <aside
      className={`bg-[#0B1E3B] border-r border-[#00274D] text-slate-200 flex flex-col h-screen sticky top-0 shadow-lg transition-all duration-300 ease-in-out z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header & Toggle */}
      <div
        className={`border-b border-[#142B4E] flex items-center transition-all ${
          isCollapsed
            ? 'flex-col justify-center p-3 gap-2.5'
            : 'justify-between p-5 gap-3'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-10 h-10 rounded-xl bg-[#003B73] border border-blue-400/30 flex items-center justify-center text-white shadow-md shrink-0"
            title="Helpdesk TI - SEMPI"
          >
            <LifeBuoy className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight text-white tracking-wide truncate">
                Helpdesk TI
              </h1>
              <span className="text-xs text-blue-300 font-medium truncate block">
                SEMPI • Suporte
              </span>
            </div>
          )}
        </div>

        {/* Botão de Expandir / Encolher */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expandir menu lateral' : 'Encolher menu lateral'}
          aria-label={isCollapsed ? 'Expandir menu lateral' : 'Encolher menu lateral'}
          className={`rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-[#142B4E] transition-all cursor-pointer ${
            isCollapsed ? 'w-8 h-8 flex items-center justify-center' : 'shrink-0'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1.5 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {!isCollapsed ? (
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Principal
          </div>
        ) : (
          <div className="my-2 border-t border-[#142B4E]/60" />
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                isCollapsed
                  ? 'justify-center w-full h-11'
                  : 'gap-3 px-3.5 py-2.5'
              } ${
                item.active
                  ? 'bg-[#003B73] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-[#142B4E]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {!isCollapsed ? (
          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Acesso Público
          </div>
        ) : (
          <div className="my-4 border-t border-[#142B4E]" />
        )}

        <Link
          href="/abrir-chamado"
          target="_blank"
          title={isCollapsed ? 'Novo Chamado (Acesso Público)' : undefined}
          className={`flex items-center rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-[#142B4E] transition-all ${
            isCollapsed
              ? 'justify-center w-full h-11'
              : 'justify-between px-3.5 py-2.5'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <PlusCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Novo Chamado</span>}
          </div>
          {!isCollapsed && <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />}
        </Link>
      </nav>

      {/* Profile & Logout */}
      <div className={`border-t border-[#142B4E] bg-[#07152B] transition-all ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 rounded-full bg-[#003B73] border border-blue-400/40 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {perfil?.nome ? perfil.nome.charAt(0).toUpperCase() : 'TI'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {perfil?.nome || 'Operador de TI'}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-blue-200">
                  <ShieldCheck className="w-3 h-3 text-blue-300 shrink-0" />
                  <span className="truncate">
                    {perfil?.role === 'ADMIN' ? 'Gestor / Admin' : 'Técnico'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await logoutAction();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-400/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair do Painel</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="w-10 h-10 rounded-full bg-[#003B73] border border-blue-400/40 flex items-center justify-center font-bold text-sm text-white shrink-0 cursor-default"
              title={`${perfil?.nome || 'Operador de TI'} (${perfil?.role === 'ADMIN' ? 'Gestor / Admin' : 'Técnico'})`}
            >
              {perfil?.nome ? perfil.nome.charAt(0).toUpperCase() : 'TI'}
            </div>

            <button
              onClick={async () => {
                await logoutAction();
              }}
              title="Sair do Painel"
              aria-label="Sair do Painel"
              className="w-10 h-10 flex items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
