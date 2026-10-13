import React from 'react';
import { obterPerfilAtual } from '@/app/actions/usuarios';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await obterPerfilAtual();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Se o perfil existir, exibe a sidebar; na tela de login a sidebar não é exibida */}
      {perfil && <AdminSidebar perfil={perfil} />}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-50">
        {children}
      </main>
    </div>
  );
}
