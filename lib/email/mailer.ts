import nodemailer from 'nodemailer';

interface EnviarEmailParams {
  para: string;
  assunto: string;
  html: string;
}

// Mapeamento de fallback para evitar falha de resolução DNS em ambientes serverless da Vercel
const KNOWN_HOST_IPS: Record<string, string> = {
  'smtp-relay.brevo.com': '1.179.117.1',
};

// Criar o transporter com pool de conexões e timeouts resilientes
function getTransporter() {
  const envHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!envHost || !user || !pass) {
    return null;
  }

  // Se o host for o smtp-relay do Brevo, conectamos diretamente pelo IP com SNI/servername
  // para blindar contra 'DNS lookup timed out' nas funções serverless da Vercel
  const host = KNOWN_HOST_IPS[envHost] || envHost;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    // Timeouts rigorosos para serverless na Vercel não congelar
    connectionTimeout: 10000, // 10s para estabelecer conexão TCP
    greetingTimeout: 8000,    // 8s para o servidor SMTP responder com o banner
    socketTimeout: 15000,     // 15s de inatividade do socket
    dnsTimeout: 5000,         // 5s para DNS
    tls: {
      servername: envHost,
      rejectUnauthorized: false,
    },
  });
}

export async function enviarEmail({ para, assunto, html }: EnviarEmailParams) {
  try {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const emailRemetente = process.env.EMAIL_FROM || user || 'helpdeskti.sempi@outlook.com';

    const transporter = getTransporter();
    if (!transporter) {
      console.warn('[Mailer] Configurações de SMTP incompletas no ambiente.');
      return { success: false, error: 'Provedor SMTP não configurado' };
    }

    const info = await transporter.sendMail({
      from: `"Helpdesk TI - SEMPI" <${emailRemetente}>`,
      to: para,
      subject: assunto,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Mailer] Erro ao disparar e-mail:', error?.message || error);
    // Retorna erro controlado sem quebrar o fluxo da aplicação
    return { success: false, error: error?.message || error };
  }
}
