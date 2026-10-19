import { supabaseAdmin } from '@/lib/supabase/admin';
import { enviarEmail } from '@/lib/email/mailer';

export interface ResultadoRotinaValidacao {
  lembretesEnviados: number;
  aprovadosAutomaticamente: number;
  detalhes: Array<{
    protocolo: string;
    acao: 'LEMBRETE_3_DIAS' | 'APROVACAO_5_DIAS';
    destinatario?: string;
  }>;
}

/**
 * Rotina que processa chamados em AGUARDANDO_CONFIRMACAO:
 * 1. Envia lembrete no 3º dia corrido (após 72h) informando que restam 2 dias para conclusão automática.
 * 2. Conclui e aprova automaticamente no 5º dia corrido (após 120h) caso o solicitante não tenha interagido.
 */
export async function processarChamadosPendentesValidacao(): Promise<ResultadoRotinaValidacao> {
  const agora = new Date();
  const agoraMs = agora.getTime();
  const UMA_HORA_MS = 60 * 60 * 1000;
  const UM_DIA_MS = 24 * UMA_HORA_MS;

  const resultado: ResultadoRotinaValidacao = {
    lembretesEnviados: 0,
    aprovadosAutomaticamente: 0,
    detalhes: [],
  };

  // Buscar todos os chamados com status AGUARDANDO_CONFIRMACAO
  const { data: tickets, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('status', 'AGUARDANDO_CONFIRMACAO');

  if (error || !tickets || tickets.length === 0) {
    return resultado;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helpdesk-sempi.vercel.app';

  for (const ticket of tickets) {
    // 1. Obter o momento exato em que o chamado entrou em AGUARDANDO_CONFIRMACAO
    const { data: logEntrada } = await supabaseAdmin
      .from('audit_logs')
      .select('created_at')
      .eq('ticket_id', ticket.id)
      .eq('action', 'STATUS_AGUARDANDO_CONFIRMACAO')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const dataEntradaStr = logEntrada?.created_at || ticket.updated_at || ticket.created_at;
    const dataEntrada = new Date(dataEntradaStr);
    const decorridoMs = agoraMs - dataEntrada.getTime();

    const decorridoDias = decorridoMs / UM_DIA_MS;
    const linkValidacao = `${appUrl}/acompanhar/${ticket.tracking_token}`;
    const destinoEmail = ticket.telefone?.includes('@') ? ticket.telefone : null;

    // REGRA 2: Se passaram 5 dias corridos (>= 120 horas) -> APROVAÇÃO AUTOMÁTICA
    if (decorridoDias >= 5) {
      const oldState = { ...ticket };

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('tickets')
        .update({
          status: 'CONCLUIDO',
          updated_at: agora.toISOString(),
        })
        .eq('id', ticket.id)
        .select('*')
        .single();

      if (!updateError && updated) {
        // Registrar interação no histórico
        await supabaseAdmin.from('ticket_interactions').insert({
          ticket_id: ticket.id,
          actor_type: 'SISTEMA',
          mensagem: 'Chamado aprovado e concluído automaticamente pelo sistema por decurso de prazo de 5 dias corridos sem manifestação do solicitante.',
        });

        // Registrar auditoria imutável
        await supabaseAdmin.from('audit_logs').insert({
          ticket_id: ticket.id,
          actor_type: 'SISTEMA',
          action: 'APROVACAO_AUTOMATICA_5_DIAS',
          ip_address: '127.0.0.1 (cron/sistema)',
          user_agent: 'Sistema Helpdesk SEMPI - Rotina Automática',
          old_state: oldState,
          new_state: updated,
        });

        // Notificar o solicitante sobre a aprovação automática
        if (destinoEmail) {
          try {
            await enviarEmail({
              para: destinoEmail,
              assunto: `[Concluído Automaticamente] Seu chamado ${ticket.protocolo} foi encerrado`,
              html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 20px;">Chamado Concluído Automaticamente</h1>
                    <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Validação aprovada por decurso de prazo (5 dias corridos).</p>
                  </div>
                  
                  <div style="padding: 24px; background: #ffffff;">
                    <p>Olá, <strong>${ticket.nome_solicitante}</strong>,</p>
                    <p>O seu chamado <strong>${ticket.protocolo}</strong> foi concluído automaticamente pelo sistema, conforme informado anteriormente, em razão do prazo de 5 dias corridos sem solicitação de reabertura.</p>
                    
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <p style="margin: 0 0 8px;"><strong>Protocolo:</strong> <span style="font-family: monospace; color: #059669; font-weight: bold;">${ticket.protocolo}</span></p>
                      <p style="margin: 0 0 8px;"><strong>Departamento:</strong> ${ticket.departamento}</p>
                      <p style="margin: 0;"><strong>Status Atual:</strong> <span style="color: #059669; font-weight: bold;">CONCLUÍDO</span></p>
                    </div>

                    <p>Caso no futuro você venha a necessitar de um novo suporte técnico, sinta-se à vontade para registrar um novo chamado em nossa central de atendimento.</p>
                    
                    <p style="text-align: center; margin: 24px 0;">
                      <a href="${linkValidacao}" style="background: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Visualizar Histórico Completo
                      </a>
                    </p>

                    <p style="font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 24px;">
                      Mensagem automática enviada pelo Sistema Helpdesk TI da SEMPI.
                    </p>
                  </div>
                </div>
              `,
            });
          } catch (mailErr) {
            console.error(`Erro ao enviar email de conclusao automatica para ${ticket.protocolo}:`, mailErr);
          }
        }

        resultado.aprovadosAutomaticamente++;
        resultado.detalhes.push({
          protocolo: ticket.protocolo,
          acao: 'APROVACAO_5_DIAS',
          destinatario: destinoEmail || undefined,
        });
      }

      continue; // Passa para o próximo ticket
    }

    // REGRA 3: Se passaram pelo menos 3 dias corridos (>= 72 horas) e menos de 5 dias (< 120 horas)
    // Encaminhar lembrete informando que restam 2 dias, caso ainda não tenha sido enviado
    if (decorridoDias >= 3 && decorridoDias < 5) {
      // Verificar se já enviamos o lembrete de 3 dias para este ticket
      const { data: lembreteJaEnviado } = await supabaseAdmin
        .from('audit_logs')
        .select('id')
        .eq('ticket_id', ticket.id)
        .eq('action', 'LEMBRETE_VALIDACAO_3_DIAS')
        .limit(1)
        .maybeSingle();

      if (!lembreteJaEnviado && destinoEmail) {
        try {
          await enviarEmail({
            para: destinoEmail,
            assunto: `[Lembrete] Faltam 2 dias para a conclusão do seu chamado ${ticket.protocolo}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 24px; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 20px;">Lembrete de Validação de Chamado</h1>
                  <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Faltam 2 dias corridos para o encerramento automático.</p>
                </div>
                
                <div style="padding: 24px; background: #ffffff;">
                  <p>Olá, <strong>${ticket.nome_solicitante}</strong>,</p>
                  <p>Este é um lembrete de que o procedimento técnico do chamado <strong>${ticket.protocolo}</strong> foi concluído e aguarda sua validação.</p>
                  
                  <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 6px; font-weight: bold; color: #b45309;">Atenção ao Prazo Restante:</p>
                    <p style="margin: 0; color: #78350f; font-size: 14px;">
                      Restam apenas <strong>2 dias corridos</strong> para a validação. Caso você não confirme a solução nem solicite a reabertura, o sistema aprovará e concluirá o chamado automaticamente.
                    </p>
                  </div>

                  <p>Por favor, acesse o link abaixo para testar e validar o atendimento agora:</p>
                  
                  <p style="text-align: center; margin: 24px 0;">
                    <a href="${linkValidacao}" style="background: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Validar Atendimento Agora
                    </a>
                  </p>

                  <p style="font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 24px;">
                    Mensagem automática enviada pelo Sistema Helpdesk TI da SEMPI.
                  </p>
                </div>
              </div>
            `,
          });

          // Registrar envio do lembrete para não reenviar repetidamente
          await supabaseAdmin.from('audit_logs').insert({
            ticket_id: ticket.id,
            actor_type: 'SISTEMA',
            action: 'LEMBRETE_VALIDACAO_3_DIAS',
            ip_address: '127.0.0.1 (cron/sistema)',
            user_agent: 'Sistema Helpdesk SEMPI - Rotina Automática',
            old_state: { decorridoDias, dataEntrada: dataEntradaStr },
            new_state: { lembreteEnviadoEm: agora.toISOString() },
          });

          resultado.lembretesEnviados++;
          resultado.detalhes.push({
            protocolo: ticket.protocolo,
            acao: 'LEMBRETE_3_DIAS',
            destinatario: destinoEmail,
          });
        } catch (lembreteErr) {
          console.error(`Erro ao enviar lembrete de 3 dias para ${ticket.protocolo}:`, lembreteErr);
        }
      }
    }
  }

  return resultado;
}
