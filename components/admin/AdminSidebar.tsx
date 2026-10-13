'use client';

import React from 'react';
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
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

export function AdminSidebar({ perfil }: { perfil?: any }) {
  const pathname = usePathname();

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
    <aside className="w-64 bg-[#0B1E3B] border-r border-[#00274D] text-slate-200 flex flex-col h-screen sticky top-0 shadow-lg">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#142B4E] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#003B73] border border-blue-400/30 flex items-center justify-center text-white shadow-md">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight text-white tracking-wide">
            Helpdesk TI
          </h1>
          <span className="text-xs text-blue-300 font-medium">SEMPI • Suporte</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-[#003B73] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-[#142B4E]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Acesso Público
        </div>
        <Link
          href="/abrir-chamado"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-[#142B4E] transition-all"
        >
          <div className="flex items-center gap-3">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Novo Chamado</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </Link>
      </nav>

      {/* Profile & Logout */}
      <div className="p-4 border-t border-[#142B4E] bg-[#07152B]">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-[#003B73] border border-blue-400/40 flex items-center justify-center font-bold text-sm text-white">
            {perfil?.nome ? perfil.nome.charAt(0).toUpperCase() : 'TI'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {perfil?.nome || 'Operador de TI'}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-blue-200">
              <ShieldCheck className="w-3 h-3 text-blue-300" />
              <span>{perfil?.role === 'ADMIN' ? 'Gestor / Admin' : 'Técnico'}</span>
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
      </div>
    </aside>
  );
}
