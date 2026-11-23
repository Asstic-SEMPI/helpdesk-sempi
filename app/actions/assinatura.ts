'use server';

import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { enviarEmail } from '@/lib/email/mailer';
import {
  CARGOS_ASSINATURA_SEMPI,
  SETORES_ASSINATURA_SEMPI,
} from '@/types';

const COOKIE_OTP = 'sempi_sig_otp';
const COOKIE_SESSION = 'sempi_sig_session';
const OTP_TTL_SECONDS = 600; // 10 minutos
const SESSION_TTL_SECONDS = 1800; // 30 minutos
const MAX_OTP_ATTEMPTS = 5;

interface OtpPayload {
  email: string;
  codeHash: string;
  exp: number;
  attempts: number;
}

interface SessionPayload {
  email: string;
  verifiedAt: number;
  exp: number;
}

function getSecretKey(): string {
  return (
    process.env.SIGNATURE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'sempi-signature-secret-key'
  );
}

function getAllowedDomains(): string[] {
  const raw = process.env.SIGNATURE_ALLOWED_DOMAINS;
  if (!raw || !raw.trim()) {
    return ['mulher.rj.gov.br'];
  }
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSecretKey())
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken<T>(token: string | undefined): T | null {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSecretKey())
    .update(data)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Valida se o nome completo informado corresponde ao titular do e-mail institucional autenticado,
 * evitando que um servidor gere assinaturas em nome de terceiros.
 */
function validarCorrespondenciaNomeEmail(nome: string, email: string): boolean {
  const connectors = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
  const nomePalavras = normalizeText(nome)
    .split(/[^a-z]+/)
    .filter((w) => w.length > 0 && !connectors.has(w));

  if (nomePalavras.length < 2) {
    return false;
  }

  const localPartRaw = email.split('@')[0] || '';
  const localParts = normalizeText(localPartRaw)
    .split(/[._-]+/)
    .map((part) => part.replace(/\d+/g, ''))
    .filter(Boolean);

  if (localParts.length === 0) {
    return false;
  }

  const partMatchesWord = (part: string, word: string): boolean => {
    if (part.length === 1) {
      return word.startsWith(part);
    }
    return word.startsWith(part) || part.startsWith(word);
  };

  if (localParts.length >= 2) {
    const primeiraParte = localParts[0];
    const ultimaParte = localParts[localParts.length - 1];

    const primeiroCasa = nomePalavras.some((w) => partMatchesWord(primeiraParte, w));
    const ultimoCasa = nomePalavras.some((w) => partMatchesWord(ultimaParte, w));

    return primeiroCasa && ultimoCasa;
  }

  const parteUnica = localParts[0];
  return nomePalavras.some(
    (w) => w.length >= 3 && (parteUnica.includes(w) || w.includes(parteUnica))
  );
}

/**
 * Solicita um código OTP de 6 dígitos para validação do e-mail institucional.
 */
export async function solicitarCodigoAssinatura(emailRaw: string) {
  try {
    const email = (emailRaw || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Informe um endereço de e-mail institucional válido.',
      };
    }

    const domain = email.split('@')[1];
    const allowedDomains = getAllowedDomains();
    if (!allowedDomains.includes(domain)) {
      return {
        success: false,
        error: `Apenas e-mails institucionais da SEMPI (${allowedDomains.map((d) => `@${d}`).join(', ')}) podem gerar assinatura oficial.`,
      };
    }

    const codigo = crypto.randomInt(100000, 1000000).toString();
    const now = Date.now();
    const payload: OtpPayload = {
      email,
      codeHash: sha256Hex(codigo),
      exp: now + OTP_TTL_SECONDS * 1000,
      attempts: 0,
    };

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_OTP, signToken(payload), getCookieOptions(OTP_TTL_SECONDS));

    const envio = await enviarEmail({
      para: email,
      assunto: `[SEMPI] Código de verificação para Assinatura Digital: ${codigo}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #003B73; padding: 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px;">Verificação de E-mail Institucional</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Gerador de Assinatura Digital • SEMPI</p>
          </div>
          <div style="padding: 24px; background: #ffffff;">
            <p>Olá,</p>
            <p>Recebemos uma solicitação de acesso ao <strong>Gerador de Assinatura Digital da SEMPI</strong> para o e-mail <strong>${email}</strong>.</p>
            <p>Utilize o código de verificação abaixo para confirmar sua identidade:</p>
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px; text-align: center; margin: 22px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #003B73;">${codigo}</span>
            </div>
            <p style="font-size: 13px; color: #475569;">Este código expira em <strong>10 minutos</strong>. Caso você não tenha feito esta solicitação, ignore este e-mail.</p>
            <p style="font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 24px;">
              Secretaria de Estado da Mulher e de Políticas Inclusivas (SEMPI) • ASSTIC
            </p>
          </div>
        </div>
      `,
    });

    if (!envio.success) {
      return {
        success: false,
        error:
          'Não foi possível enviar o e-mail com o código de verificação no momento. Tente novamente em instantes ou contate a ASSTIC.',
      };
    }

    return { success: true, email };
  } catch (error: unknown) {
    console.error('Erro ao solicitar código de assinatura:', error);
    return {
      success: false,
      error: 'Erro interno ao enviar código de verificação.',
    };
  }
}

/**
 * Valida o código OTP digitado e cria a sessão autenticada do servidor.
 */
export async function verificarCodigoAssinatura(codigoRaw: string) {
  try {
    const codigo = (codigoRaw || '').trim();
    if (!/^\d{6}$/.test(codigo)) {
      return {
        success: false,
        error: 'Informe o código numérico de 6 dígitos enviado para o seu e-mail.',
      };
    }

    const cookieStore = await cookies();
    const otpCookie = cookieStore.get(COOKIE_OTP)?.value;
    const payload = verifyToken<OtpPayload>(otpCookie);

    if (!payload) {
      return {
        success: false,
        error: 'Sessão de verificação inválida ou não solicitada. Solicite um novo código.',
      };
    }

    const now = Date.now();
    if (now > payload.exp) {
      cookieStore.delete(COOKIE_OTP);
      return {
        success: false,
        error: 'O código expirou. Solicite um novo código de verificação.',
      };
    }

    if (payload.attempts >= MAX_OTP_ATTEMPTS) {
      cookieStore.delete(COOKIE_OTP);
      return {
        success: false,
        error: 'Número máximo de tentativas excedido. Solicite um novo código.',
      };
    }

    const providedHash = Buffer.from(sha256Hex(codigo), 'hex');
    const expectedHash = Buffer.from(payload.codeHash, 'hex');
    const isMatch =
      providedHash.length === expectedHash.length &&
      crypto.timingSafeEqual(providedHash, expectedHash);

    if (!isMatch) {
      const nextAttempts = payload.attempts + 1;
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        cookieStore.delete(COOKIE_OTP);
        return {
          success: false,
          error: 'Código incorreto. Limite de tentativas atingido; solicite um novo código.',
        };
      }

      const remainingSeconds = Math.max(1, Math.ceil((payload.exp - now) / 1000));
      cookieStore.set(
        COOKIE_OTP,
        signToken({ ...payload, attempts: nextAttempts }),
        getCookieOptions(remainingSeconds)
      );

      return {
        success: false,
        error: `Código incorreto. Restam ${MAX_OTP_ATTEMPTS - nextAttempts} tentativa(s).`,
      };
    }

    cookieStore.delete(COOKIE_OTP);

    const sessionPayload: SessionPayload = {
      email: payload.email,
      verifiedAt: now,
      exp: now + SESSION_TTL_SECONDS * 1000,
    };

    cookieStore.set(
      COOKIE_SESSION,
      signToken(sessionPayload),
      getCookieOptions(SESSION_TTL_SECONDS)
    );

    return { success: true, email: payload.email };
  } catch (error: unknown) {
    console.error('Erro ao verificar código de assinatura:', error);
    return {
      success: false,
      error: 'Erro interno ao validar o código.',
    };
  }
}

/**
 * Retorna a sessão autenticada atual do gerador de assinatura, se válida.
 */
export async function obterSessaoAssinatura(): Promise<{
  authenticated: boolean;
  email: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_SESSION)?.value;
    const payload = verifyToken<SessionPayload>(token);

    if (!payload || Date.now() > payload.exp) {
      return { authenticated: false, email: null };
    }

    return { authenticated: true, email: payload.email };
  } catch {
    return { authenticated: false, email: null };
  }
}

/**
 * Encerra a sessão de geração de assinatura e limpa os cookies.
 */
export async function encerrarSessaoAssinatura() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESSION);
  cookieStore.delete(COOKIE_OTP);
  return { success: true };
}

/**
 * Valida a coerência entre nome e e-mail institucional, verifica listas oficiais de
 * cargo/setor, registra auditoria por e-mail e libera a assinatura final com logo oficial.
 */
export async function validarELiberarAssinatura(params: {
  nome: string;
  cargo: string;
  idFuncional: string;
  setor: string;
  aceitouTermo: boolean;
}) {
  try {
    const sessao = await obterSessaoAssinatura();
    if (!sessao.authenticated || !sessao.email) {
      return {
        success: false,
        error: 'Sua sessão de verificação expirou. Confirme novamente seu e-mail institucional.',
      };
    }

    const nome = (params.nome || '').trim().replace(/\s+/g, ' ');
    const cargo = (params.cargo || '').trim();
    const idFuncional = (params.idFuncional || '').trim();
    const setor = (params.setor || '').trim();

    if (!params.aceitouTermo) {
      return {
        success: false,
        error: 'É necessário confirmar a declaração de veracidade dos dados para gerar a assinatura.',
      };
    }

    const nomePartes = nome.split(' ').filter((p) => p.length > 0);
    if (nomePartes.length < 2) {
      return {
        success: false,
        error: 'Informe seu nome completo (nome e sobrenome).',
      };
    }

    if (!(CARGOS_ASSINATURA_SEMPI as readonly string[]).includes(cargo)) {
      return {
        success: false,
        error: 'Selecione um cargo válido na lista oficial.',
      };
    }

    if (!(SETORES_ASSINATURA_SEMPI as readonly string[]).includes(setor)) {
      return {
        success: false,
        error: 'Selecione um setor válido na lista oficial.',
      };
    }

    if (!validarCorrespondenciaNomeEmail(nome, sessao.email)) {
      return {
        success: false,
        error: `O nome informado ("${nome}") não corresponde ao titular do e-mail autenticado (${sessao.email}). Utilize o seu e-mail institucional individual ou, caso utilize e-mail setorial, abra um chamado na ASSTIC.`,
      };
    }

    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'desconhecido';
    const userAgent = headersList.get('user-agent') || 'desconhecido';
    const dataHora = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const emailNotificacaoTI =
      process.env.EMAIL_TI_NOTIFICACOES ||
      'ti.asstic@gmail.com, andersonesribeiro@hotmail.com, lgtec3@gmail.com, comeex7@gmail.com';

    await Promise.allSettled([
      enviarEmail({
        para: emailNotificacaoTI,
        assunto: `[Auditoria Assinatura Digital] ${nome} (${setor})`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #003B73; padding: 20px 24px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 18px;">Auditoria • Emissão de Assinatura Digital</h1>
              <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Registro automático de emissão validada</p>
            </div>
            <div style="padding: 24px; background: #ffffff;">
              <p>Uma assinatura digital institucional foi validada e liberada no portal:</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 6px;"><strong>Nome:</strong> ${nome}</p>
                <p style="margin: 0 0 6px;"><strong>Cargo / Função:</strong> ${cargo}</p>
                <p style="margin: 0 0 6px;"><strong>ID Funcional:</strong> ${idFuncional || 'Não informado'}</p>
                <p style="margin: 0 0 6px;"><strong>Setor:</strong> ${setor}</p>
                <p style="margin: 0 0 6px;"><strong>E-mail Autenticado:</strong> ${sessao.email}</p>
                <p style="margin: 0 0 6px;"><strong>Data/Hora:</strong> ${dataHora}</p>
                <p style="margin: 0 0 6px;"><strong>IP:</strong> ${ip}</p>
                <p style="margin: 0; font-size: 12px; color: #475569;"><strong>User-Agent:</strong> ${userAgent}</p>
              </div>
            </div>
          </div>
        `,
      }),
      enviarEmail({
        para: sessao.email,
        assunto: `[SEMPI] Confirmação de geração de Assinatura Digital`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #003B73; padding: 20px 24px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 18px;">Assinatura Digital Emitida</h1>
              <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Notificação de segurança • SEMPI</p>
            </div>
            <div style="padding: 24px; background: #ffffff;">
              <p>Olá, <strong>${nome}</strong>,</p>
              <p>Confirmamos que uma assinatura institucional da SEMPI foi gerada utilizando sua conta autenticada (<strong>${sessao.email}</strong>) em <strong>${dataHora}</strong>.</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
                <p style="margin: 0 0 4px;"><strong>Cargo:</strong> ${cargo}${idFuncional ? ` - ID: ${idFuncional}` : ''}</p>
                <p style="margin: 0;"><strong>Setor:</strong> ${setor}</p>
              </div>
              <p style="font-size: 13px; color: #475569;">Caso você não reconheça esta emissão, entre em contato imediatamente com a equipe de TI (ASSTIC).</p>
            </div>
          </div>
        `,
      }),
    ]);

    return {
      success: true,
      dadosValidados: {
        nome,
        cargo,
        idFuncional,
        setor,
        email: sessao.email,
      },
    };
  } catch (error: unknown) {
    console.error('Erro ao validar e liberar assinatura:', error);
    return {
      success: false,
      error: 'Erro interno ao validar os dados da assinatura.',
    };
  }
}
