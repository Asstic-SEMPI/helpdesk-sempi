'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { enviarEmail } from '@/lib/email/mailer';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import type { TicketStatus, TicketCategory } from '@/types';

// Helper para obter IP e User-Agent
async function getClientMetadata() {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get('x-real-ip') || '127.0.0.1';
  const userAgent = headersList.get('user-agent') || 'Desconhecido';
  return { ip, userAgent };
}

// 1. Criar Chamado Público (usando E-mail como canal de comunicação do solicitante)
export async function criarChamado(formData: FormData) {
  try {
    const nome_solicitante = formData.get('nome_solicitante') as string;
    const email_solicitante = (formData.get('email_solicitante') as string || '').trim().toLowerCase();
    const departamento = formData.get('departamento') as string;
    const categoria = formData.get('categoria') as TicketCategory;
    const descricao = formData.get('descricao') as string;
    const arquivo = formData.get('arquivo') as File | null;

    if (!nome_solicitante || !email_solicitante || !departamento || !categoria || !descricao) {
      return { success: false, error: 'Preencha todos os campos obrigatórios.' };
    }

    if (!email_solicitante.includes('@') || !email_solicitante.includes('.')) {
      return { success: false, error: 'Por favor, informe um endereço de e-mail válido.' };
    }

    if (arquivo && arquivo.size > 3 * 1024 * 1024) {
      return { success: false, error: 'O anexo não pode ultrapassar 3 MB.' };
    }

    // Inserir ticket no banco (usamos o campo telefone existente como fallback seguro de schema)
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        nome_solicitante,
        telefone: email_solicitante.slice(0, 20), // compatibilidade com constraint legada varchar(20)
        departamento,
        categoria,
        descricao,
        status: 'CRIADO',
      })
      .select('*')
      .single();

    if (ticketError || !ticket) {
      return { success: false, error: `Erro ao abrir chamado: ${ticketError?.message}` };
    }

    const { ip, userAgent } = await getClientMetadata();

    // Salvar auditoria de criação contendo o email completo do solicitante no new_state
    const ticketCompleto = {
      ...ticket,
      email_solicitante,
    };

    await supabaseAdmin.from('audit_logs').insert({
      ticket_id: ticket.id,
      actor_type: 'SOLICITANTE',
      action: 'ABERTURA_CHAMADO',
      ip_address: ip,
      user_agent: userAgent,
      new_state: ticketCompleto,
    });

    // Upload de anexo se houver
    if (arquivo && arquivo.size > 0) {
      const sanitizedName = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${ticket.id}/${Date.now()}_${sanitizedName}`;
      const buffer = Buffer.from(await arquivo.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from('ticket-attachments')
        .upload(storagePath, buffer, {
          contentType: arquivo.type,
          upsert: false,
        });

      if (!uploadError) {
        await supabaseAdmin.from('ticket_attachments').insert({
          ticket_id: ticket.id,
          file_name: arquivo.name,
          storage_path: storagePath,
          mime_type: arquivo.type || 'application/octet-stream',
          file_size: arquivo.size,
        });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailNotificacaoTI = process.env.EMAIL_TI_NOTIFICACOES || 'ti.asstic@gmail.com, andersonesribeiro@hotmail.com, lgtec3@gmail.com, comeex7@gmail.com';
    const linkAcompanhamento = `${appUrl}/acompanhar/${ticket.tracking_token}`;
    const linkPainelAdmin = `${appUrl}/admin/chamados/${ticket.id}`;

    // Aguardar os disparos de e-mail antes de finalizar a Server Action
    // No ambiente serverless da Vercel, floating promises (.catch solto) são congeladas e cortadas pelo runtime
    try {
      await Promise.allSettled([
        enviarEmail({
          para: email_solicitante,
          assunto: `[Helpdesk TI] Confirmação de Abertura - Chamado ${ticket.protocolo}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #0284c7, #2563eb); padding: 24px; color: #ffffff;">
                <h1 style="margin: 0; font-size: 20px;">Helpdesk TI • Chamado Registrado</h1>
                <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Seu chamado foi recebido com sucesso pela equipe técnica.</p>
              </div>
              
              <div style="padding: 24px; background: #ffffff;">
                <p>Olá, <strong>${nome_solicitante}</strong>,</p>
                <p>Seu chamado foi cadastrado e está na fila de atendimento da equipe de TI.</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0 0 8px;"><strong>Protocolo:</strong> <span style="font-family: monospace; color: #0284c7; font-size: 16px; font-weight: bold;">${ticket.protocolo}</span></p>
                  <p style="margin: 0 0 8px;"><strong>Departamento:</strong> ${departamento}</p>
                  <p style="margin: 0 0 8px;"><strong>Categoria:</strong> ${categoria}</p>
                  <p style="margin: 0;"><strong>Descrição:</strong> ${descricao}</p>
                </div>

                <p>Você pode acompanhar o status e interagir com o suporte através do link exclusivo abaixo:</p>
                
                <p style="text-align: center; margin: 24px 0;">
                  <a href="${linkAcompanhamento}" style="background: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Acompanhar Atendimento
                  </a>
                </p>

                <p style="font-size: 12px; color: #64748b;">Todas as atualizações do técnico serão notificadas neste e-mail.</p>
              </div>
            </div>
          `,
        }),
        enviarEmail({
          para: emailNotificacaoTI,
          assunto: `[Novo Chamado ${ticket.protocolo}] ${categoria} - ${departamento}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
              <h2 style="color: #0284c7;">Novo Chamado de TI Aberto</h2>
              <p><strong>Protocolo:</strong> ${ticket.protocolo}</p>
              <p><strong>Solicitante:</strong> ${nome_solicitante} (${email_solicitante})</p>
              <p><strong>Departamento / Secretaria:</strong> ${departamento}</p>
              <p><strong>Categoria:</strong> ${categoria}</p>
              <p><strong>Descrição:</strong></p>
              <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">${descricao}</div>
              <br/>
              <p>
                <a href="${linkPainelAdmin}" style="background: #0284c7; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Atender no Painel TI
                </a>
              </p>
            </div>
          `,
        })
      ]);
    } catch (emailErr) {
      console.error('Falha geral no envio de emails de abertura:', emailErr);
    }

    return {
      success: true,
      protocolo: ticket.protocolo,
      tracking_token: ticket.tracking_token,
      ticketId: ticket.id,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao processar chamado.' };
  }
}

// 2. Buscar chamado por Token (Público)
export async function obterChamadoPorToken(token: string) {
  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, tecnico_responsavel:tecnico_responsavel_id(nome, cargo, email)')
      .eq('tracking_token', token)
      .single();

    if (error || !ticket) return null;

    // Buscar e-mail do solicitante a partir dos logs de auditoria
    const { data: logAbertura } = await supabaseAdmin
      .from('audit_logs')
      .select('new_state')
      .eq('ticket_id', ticket.id)
      .eq('action', 'ABERTURA_CHAMADO')
      .single();

    const emailSolicitante = logAbertura?.new_state?.email_solicitante || ticket.telefone;

    const [interacoesRes, anexosRes] = await Promise.all([
      supabaseAdmin
        .from('ticket_interactions')
        .select('*, actor:actor_id(nome, cargo)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true }),
    ]);

    return {
      ticket: {
        ...ticket,
        email_solicitante: emailSolicitante,
      },
      interacoes: interacoesRes.data || [],
      anexos: anexosRes.data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar chamado por token:', error);
    return null;
  }
}

// 3. Validação do Solicitante (Confirmar ou Recusar/Reabrir)
export async function validarChamadoPeloSolicitante({
  trackingToken,
  aprovado,
  motivoRecusa,
  arquivoRecusa,
}: {
  trackingToken: string;
  aprovado: boolean;
  motivoRecusa?: string;
  arquivoRecusa?: FormData | null;
}) {
  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, tecnico_responsavel:tecnico_responsavel_id(nome, email)')
      .eq('tracking_token', trackingToken)
      .single();

    if (error || !ticket) {
      return { success: false, error: 'Chamado não encontrado.' };
    }

    if (ticket.status !== 'AGUARDANDO_CONFIRMACAO') {
      return {
        success: false,
        error: 'Este chamado não está pendente de validação.',
      };
    }

    const { ip, userAgent } = await getClientMetadata();
    const oldState = { ...ticket };

    if (aprovado) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('tickets')
        .update({
          status: 'CONCLUIDO',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id)
        .select('*')
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await supabaseAdmin.from('ticket_interactions').insert({
        ticket_id: ticket.id,
        actor_type: 'SOLICITANTE',
        mensagem: 'Atendimento confirmado e aprovado pelo solicitante via e-mail/sistema. Chamado concluído com sucesso.',
      });

      await supabaseAdmin.from('audit_logs').insert({
        ticket_id: ticket.id,
        actor_type: 'SOLICITANTE',
        action: 'CONFIRMACAO_CONCLUSAO',
        ip_address: ip,
        user_agent: userAgent,
        old_state: oldState,
        new_state: updated,
      });

      revalidatePath(`/acompanhar/${trackingToken}`);
      revalidatePath(`/admin/chamados/${ticket.id}`);
      return { success: true, novoStatus: 'CONCLUIDO' };
    } else {
      if (!motivoRecusa || motivoRecusa.trim().length === 0) {
        return { success: false, error: 'Informe detalhadamente o motivo da não validação.' };
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('tickets')
        .update({
          status: 'REABERTO',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id)
        .select('*')
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      const { data: interacao } = await supabaseAdmin
        .from('ticket_interactions')
        .insert({
          ticket_id: ticket.id,
          actor_type: 'SOLICITANTE',
          mensagem: `[REABERTO PELO SOLICITANTE]: ${motivoRecusa}`,
        })
        .select('*')
        .single();

      if (arquivoRecusa) {
        const file = arquivoRecusa.get('arquivo') as File | null;
        if (file && file.size > 0 && file.size <= 3 * 1024 * 1024) {
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `${ticket.id}/${Date.now()}_${sanitizedName}`;
          const buffer = Buffer.from(await file.arrayBuffer());

          const { error: uploadError } = await supabaseAdmin.storage
            .from('ticket-attachments')
            .upload(storagePath, buffer, {
              contentType: file.type,
              upsert: false,
            });

          if (!uploadError) {
            await supabaseAdmin.from('ticket_attachments').insert({
              ticket_id: ticket.id,
              interaction_id: interacao?.id || null,
              file_name: file.name,
              storage_path: storagePath,
              mime_type: file.type || 'application/octet-stream',
              file_size: file.size,
            });
          }
        }
      }

      await supabaseAdmin.from('audit_logs').insert({
        ticket_id: ticket.id,
        actor_type: 'SOLICITANTE',
        action: 'REABERTURA_CHAMADO',
        ip_address: ip,
        user_agent: userAgent,
        old_state: oldState,
        new_state: updated,
      });

      // Notificar técnico responsável ou equipe TI
      const emailDestino = ticket.tecnico_responsavel?.email || process.env.EMAIL_TI_NOTIFICACOES || 'ti.asstic@gmail.com, andersonesribeiro@hotmail.com, lgtec3@gmail.com, comeex7@gmail.com';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      try {
        await enviarEmail({
          para: emailDestino,
          assunto: `[Chamado Reaberto] ${ticket.protocolo} - ${ticket.departamento}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #e11d48;">O chamado ${ticket.protocolo} foi reaberto pelo solicitante</h2>
              <p><strong>Solicitante:</strong> ${ticket.nome_solicitante}</p>
              <p><strong>Motivo da recusa/esclarecimento:</strong></p>
              <div style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 12px; margin: 10px 0;">
                ${motivoRecusa}
              </div>
              <p>
                <a href="${appUrl}/admin/chamados/${ticket.id}" style="background: #e11d48; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Acessar Chamado
                </a>
              </p>
            </div>
          `,
        });
      } catch (err) {
        console.error('Erro envio email reabertura:', err);
      }

      revalidatePath(`/acompanhar/${trackingToken}`);
      revalidatePath(`/admin/chamados/${ticket.id}`);
      return { success: true, novoStatus: 'REABERTO' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao registrar validação.' };
  }
}

// 4. Ações Administrativas / Técnicos
export async function listarChamadosAdmin(filtros?: {
  status?: string;
  categoria?: string;
  busca?: string;
  tecnicoId?: string;
}) {
  try {
    let query = supabaseAdmin
      .from('tickets')
      .select('*, tecnico_responsavel:tecnico_responsavel_id(nome, email, cargo)')
      .order('created_at', { ascending: false });

    if (filtros?.status && filtros.status !== 'TODOS') {
      query = query.eq('status', filtros.status);
    }
    if (filtros?.categoria && filtros.categoria !== 'TODAS') {
      query = query.eq('categoria', filtros.categoria);
    }
    if (filtros?.tecnicoId && filtros.tecnicoId !== 'TODOS') {
      if (filtros.tecnicoId === 'SEM_TECNICO') {
        query = query.is('tecnico_responsavel_id', null);
      } else {
        query = query.eq('tecnico_responsavel_id', filtros.tecnicoId);
      }
    }
    if (filtros?.busca && filtros.busca.trim().length > 0) {
      const b = filtros.busca.trim();
      query = query.or(
        `protocolo.ilike.%${b}%,nome_solicitante.ilike.%${b}%,departamento.ilike.%${b}%,descricao.ilike.%${b}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao listar chamados:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Erro listar chamados:', error);
    return [];
  }
}

export async function obterChamadoAdminPorId(ticketId: string) {
  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, tecnico_responsavel:tecnico_responsavel_id(id, nome, cargo, email)')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) return null;

    // Buscar e-mail do solicitante registrado na auditoria
    const { data: logAbertura } = await supabaseAdmin
      .from('audit_logs')
      .select('new_state')
      .eq('ticket_id', ticket.id)
      .eq('action', 'ABERTURA_CHAMADO')
      .single();

    const emailSolicitante = logAbertura?.new_state?.email_solicitante || ticket.telefone;

    const [interacoesRes, anexosRes, logsRes] = await Promise.all([
      supabaseAdmin
        .from('ticket_interactions')
        .select('*, actor:actor_id(nome, cargo)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('audit_logs')
        .select('*, actor:actor_id(nome, cargo)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false }),
    ]);

    return {
      ticket: {
        ...ticket,
        email_solicitante: emailSolicitante,
      },
      interacoes: interacoesRes.data || [],
      anexos: anexosRes.data || [],
      logs: logsRes.data || [],
    };
  } catch (error) {
    console.error('Erro obter chamado admin:', error);
    return null;
  }
}

// 5. Atualizar Chamado / Procedimento Técnico e Notificar por E-mail
export async function atualizarAtendimentoTecnico({
  ticketId,
  novoStatus,
  tecnicoId,
  procedimento,
  emailSolicitante,
}: {
  ticketId: string;
  novoStatus?: TicketStatus;
  tecnicoId?: string;
  procedimento?: string;
  emailSolicitante?: string;
}) {
  try {
    const { data: ticketAntigo, error: errAntigo } = await supabaseAdmin
      .from('tickets')
      .select('*, tecnico_responsavel:tecnico_responsavel_id(nome, email)')
      .eq('id', ticketId)
      .single();

    if (errAntigo || !ticketAntigo) {
      return { success: false, error: 'Chamado não encontrado.' };
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (novoStatus) updates.status = novoStatus;
    if (tecnicoId !== undefined) updates.tecnico_responsavel_id = tecnicoId || null;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { ip, userAgent } = await getClientMetadata();

    // Se houve procedimento registrado, adiciona às interações
    if (procedimento && procedimento.trim().length > 0) {
      await supabaseAdmin.from('ticket_interactions').insert({
        ticket_id: ticketId,
        actor_id: tecnicoId || null,
        actor_type: 'TECNICO',
        mensagem: procedimento.trim(),
      });
    }

    // Registrar auditoria
    await supabaseAdmin.from('audit_logs').insert({
      ticket_id: ticketId,
      actor_id: tecnicoId || null,
      actor_type: 'TECNICO',
      action: `STATUS_${novoStatus || 'ATUALIZADO'}`,
      ip_address: ip,
      user_agent: userAgent,
      old_state: ticketAntigo,
      new_state: updated,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linkValidacao = `${appUrl}/acompanhar/${ticketAntigo.tracking_token}`;
    const destinoEmail = emailSolicitante || ticketAntigo.telefone;

    // Disparar e-mail ao solicitante sempre que o chamado for movido para AGUARDANDO_CONFIRMACAO
    if (novoStatus === 'AGUARDANDO_CONFIRMACAO' && destinoEmail && destinoEmail.includes('@')) {
      try {
        await enviarEmail({
          para: destinoEmail,
          assunto: `[Ação Necessária] Seu chamado ${ticketAntigo.protocolo} aguarda validação`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; color: #ffffff;">
                <h1 style="margin: 0; font-size: 20px;">Atendimento Concluído pela Equipe TI</h1>
                <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">O chamado aguarda a sua validação para encerramento.</p>
              </div>
              
              <div style="padding: 24px; background: #ffffff;">
                <p>Olá, <strong>${ticketAntigo.nome_solicitante}</strong>,</p>
                <p>O técnico de TI concluiu o procedimento referente ao chamado <strong>${ticketAntigo.protocolo}</strong>.</p>
                
                <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0 0 6px; font-weight: bold; color: #6d28d9;">Procedimento Realizado:</p>
                  <p style="margin: 0; color: #334155;">${procedimento || 'Procedimento executado conforme solicitação técnica.'}</p>
                </div>

                <p>Por favor, acesse a página de validação para confirmar se o problema foi solucionado ou solicitar reabertura:</p>
                
                <p style="text-align: center; margin: 24px 0;">
                  <a href="${linkValidacao}" style="background: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Validar Atendimento Agora
                  </a>
                </p>
              </div>
            </div>
          `,
        });
      } catch (err) {
        console.error('Erro envio email validacao solicitante:', err);
      }
    }

    // Disparar e-mail informativo se status for alterado para EM_ATENDIMENTO
    if (novoStatus === 'EM_ATENDIMENTO' && destinoEmail && destinoEmail.includes('@')) {
      try {
        await enviarEmail({
          para: destinoEmail,
          assunto: `[Em Atendimento] Seu chamado ${ticketAntigo.protocolo} foi iniciado pela TI`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 24px; color: #ffffff;">
                <h1 style="margin: 0; font-size: 20px;">Chamado em Atendimento</h1>
                <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Um técnico iniciou a análise da sua solicitação.</p>
              </div>
              
              <div style="padding: 24px; background: #ffffff;">
                <p>Olá, <strong>${ticketAntigo.nome_solicitante}</strong>,</p>
                <p>Seu chamado <strong>${ticketAntigo.protocolo}</strong> acaba de entrar em atendimento ativo pela equipe técnica de TI.</p>
                
                <p style="text-align: center; margin: 24px 0;">
                  <a href="${linkValidacao}" style="background: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Acompanhar Andamento
                  </a>
                </p>
              </div>
            </div>
          `,
        });
      } catch (err) {
        console.error('Erro envio email em atendimento:', err);
      }
    }

    revalidatePath(`/admin/chamados/${ticketId}`);
    revalidatePath('/admin/chamados');
    revalidatePath(`/acompanhar/${ticketAntigo.tracking_token}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar atendimento.' };
  }
}

// 6. Excluir / Deletar Chamado
export async function excluirChamado(ticketId: string) {
  try {
    const { error } = await supabaseAdmin.from('tickets').delete().eq('id', ticketId);
    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath('/admin/chamados');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir chamado.' };
  }
}

// 7. Obter URL segura para download de anexo
export async function obterUrlDownloadAnexo(storagePath: string) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('ticket-attachments')
      .createSignedUrl(storagePath, 60 * 60);

    if (error || !data) {
      return null;
    }
    return data.signedUrl;
  } catch (e) {
    console.error('Erro ao gerar URL assinada:', e);
    return null;
  }
}
