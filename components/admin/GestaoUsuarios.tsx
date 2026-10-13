'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Mail,
  User,
  X,
} from 'lucide-react';
import {
  criarUsuarioTecnico,
  atualizarUsuarioTecnico,
  excluirUsuarioTecnico,
} from '@/app/actions/usuarios';
import type { Profile, UserRole } from '@/types';

export function GestaoUsuarios({
  tecnicosIniciais,
}: {
  tecnicosIniciais: Profile[];
}) {
  const router = useRouter();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Profile | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Técnico de Suporte');
  const [role, setRole] = useState<UserRole>('TECNICO');
  const [senha, setSenha] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const abrirNovo = () => {
    setEditando(null);
    setNome('');
    setEmail('');
    setCargo('Técnico de Suporte');
    setRole('TECNICO');
    setSenha('');
    setIsActive(true);
    setErro(null);
    setModalAberto(true);
  };

  const abrirEdicao = (tec: Profile) => {
    setEditando(tec);
    setNome(tec.nome);
    setEmail(tec.email);
    setCargo(tec.cargo || 'Técnico de Suporte');
    setRole(tec.role);
    setSenha('');
    setIsActive(tec.is_active);
    setErro(null);
    setModalAberto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    if (editando) {
      const res = await atualizarUsuarioTecnico(editando.id, {
        nome,
        cargo,
        role,
        is_active: isActive,
        novaSenha: senha.trim() ? senha.trim() : undefined,
      });
      setSalvando(false);
      if (res.success) {
        setModalAberto(false);
        setMensagemSucesso('Técnico atualizado com sucesso!');
        router.refresh();
        setTimeout(() => setMensagemSucesso(null), 3000);
      } else {
        setErro(res.error || 'Erro ao atualizar.');
      }
    } else {
      if (!senha || senha.length < 6) {
        setErro('A senha inicial deve ter pelo menos 6 caracteres.');
        setSalvando(false);
        return;
      }

      const res = await criarUsuarioTecnico({
        nome,
        email,
        cargo,
        role,
        senhaInicial: senha,
      });
      setSalvando(false);
      if (res.success) {
        setModalAberto(false);
        setMensagemSucesso('Novo técnico cadastrado com sucesso!');
        router.refresh();
        setTimeout(() => setMensagemSucesso(null), 3000);
      } else {
        setErro(res.error || 'Erro ao cadastrar.');
      }
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!confirm(`Remover acesso do técnico ${nome}? Esta ação é irreversível.`)) {
      return;
    }
    const res = await excluirUsuarioTecnico(id);
    if (res.success) {
      setMensagemSucesso('Técnico removido com sucesso.');
      router.refresh();
      setTimeout(() => setMensagemSucesso(null), 3000);
    } else {
      alert(`Erro: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Botão de Criação e Mensagens */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {mensagemSucesso ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{mensagemSucesso}</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Cadastre membros da equipe para triagem e resolução de chamados
          </div>
        )}

        <button
          onClick={abrirNovo}
          className="px-4 py-2 bg-[#003B73] hover:bg-[#0B1E3B] text-white font-medium rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 w-fit cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Técnico</span>
        </button>
      </div>

      {/* Grid de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tecnicosIniciais.map((tec) => (
          <div
            key={tec.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#003B73] font-bold flex items-center justify-center text-sm">
                    {tec.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0B1E3B] text-sm">{tec.nome}</h3>
                    <p className="text-xs text-slate-500">{tec.cargo || 'Técnico'}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    tec.role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {tec.role}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{tec.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      tec.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{tec.is_active ? 'Ativo no Sistema' : 'Acesso Inativo'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => abrirEdicao(tec)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-[#003B73]" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => handleExcluir(tec.id, tec.nome)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer"
                title="Excluir Usuário"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-[#0B1E3B] text-base">
                {editando ? 'Editar Usuário Técnico' : 'Novo Técnico de Suporte'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                  />
                </div>
              </div>

              {!editando && (
                <div>
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                    E-mail Institucional
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tecnico@orgao.gov.br"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Técnico de Suporte"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                  >
                    <option value="TECNICO">Técnico de TI</option>
                    <option value="ADMIN">Administrador / Gestor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                  {editando ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required={!editando}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                  />
                </div>
              </div>

              {editando && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#003B73] focus:ring-[#003B73]"
                  />
                  <label htmlFor="isActive" className="text-slate-700 font-medium">
                    Usuário com acesso ativo
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-[#003B73] hover:bg-[#0B1E3B] text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editando ? 'Salvar Alterações' : 'Cadastrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
