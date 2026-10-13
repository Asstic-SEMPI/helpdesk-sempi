'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function listarTecnicos() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao listar técnicos:', error);
    return [];
  }
  return data;
}

export async function criarUsuarioTecnico(formData: {
  nome: string;
  email: string;
  cargo: string;
  role: 'ADMIN' | 'TECNICO';
  senhaInicial: string;
}) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.senhaInicial,
      email_confirm: true,
      user_metadata: {
        nome: formData.nome,
        cargo: formData.cargo,
        role: formData.role,
      },
    });

    if (error) {
      return { success: false, error: `Falha ao criar usuário: ${error.message}` };
    }

    // Como o trigger on_auth_user_created sincroniza com profiles, garantimos ou atualizamos
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: data.user.id,
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
        role: formData.role,
        is_active: true,
      });

    if (profileError) {
      console.warn('Alerta ao upsert no profile:', profileError);
    }

    revalidatePath('/admin/usuarios');
    return { success: true, userId: data.user.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado ao criar técnico.' };
  }
}

export async function atualizarUsuarioTecnico(
  id: string,
  dados: {
    nome: string;
    cargo: string;
    role: 'ADMIN' | 'TECNICO';
    is_active: boolean;
    novaSenha?: string;
  }
) {
  try {
    if (dados.novaSenha && dados.novaSenha.trim().length >= 6) {
      const { error: passErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: dados.novaSenha.trim(),
      });
      if (passErr) {
        return { success: false, error: `Erro ao trocar senha: ${passErr.message}` };
      }
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        nome: dados.nome,
        cargo: dados.cargo,
        role: dados.role,
        is_active: dados.is_active,
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: `Erro ao atualizar perfil: ${error.message}` };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar dados do usuário.' };
  }
}

export async function excluirUsuarioTecnico(id: string) {
  try {
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authErr) {
      return { success: false, error: `Erro ao deletar usuário: ${authErr.message}` };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao remover técnico.' };
  }
}

export async function obterPerfilAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}
