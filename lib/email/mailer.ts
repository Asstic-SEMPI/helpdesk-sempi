import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

const user = process.env.SMTP_USER || process.env.GMAIL_USER;
const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
const emailRemetente = process.env.EMAIL_FROM || user;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: isSecure,
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false, // Necessário para certificados internos/governamentais
  },
});

interface EnviarEmailParams {
  para: string;
  assunto: string;
  html: string;
}

export async function enviarEmail({ para, assunto, html }: EnviarEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"Helpdesk TI - SEMPI" <${emailRemetente}>`,
      to: para,
      subject: assunto,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao disparar e-mail via SMTP Zimbra:', error);
    return { success: false, error };
  }
}
