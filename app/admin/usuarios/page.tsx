import React from 'react';
import { listarTecnicos } from '@/app/actions/usuarios';
import { GestaoUsuarios } from '@/components/admin/GestaoUsuarios';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsuariosAdminPage() {
  const tecnicos = await listarTecnicos();

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1E3B] tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#003B73]" />
            Gestão da Equipe de TI • SEMPI
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastro de técnicos, controle de acesso e permissões administrativas
          </p>
        </div>
      </div>

      <GestaoUsuarios tecnicosIniciais={tecnicos} />
    </div>
  );
}
