'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CARGOS_ASSINATURA_SEMPI,
  SETORES_ASSINATURA_SEMPI,
} from '@/types';
import {
  solicitarCodigoAssinatura,
  verificarCodigoAssinatura,
  encerrarSessaoAssinatura,
  validarELiberarAssinatura,
} from '@/app/actions/assinatura';
import {
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Download,
  Copy,
  AlertCircle,
  Loader2,
  RotateCcw,
  Lock,
  LogOut,
} from 'lucide-react';

const LOGO_URL = '/Secretaria-da-Mulher-e-Poliiticas-inclusivas_Horizontal.png';

const SCALE = 2;
const MIN_WIDTH = 636;
const ACCENT_BAR_WIDTH = 7;
const ACCENT_BAR_GAP = 16;
const PADDING_LEFT = 16;
const PADDING_RIGHT = 20;
const CONTENT_START_X = PADDING_LEFT + ACCENT_BAR_WIDTH + ACCENT_BAR_GAP;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 16;

const COLOR_PURPLE = '#6d28d9';
const COLOR_DARK_BLUE = '#0a3d6b';
const FONT_STACK = "Calibri, 'Segoe UI', Arial, Helvetica, sans-serif";

function slugifyFilename(text: string) {
  const clean = (text || 'assinatura')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `assinatura_${clean || 'servidor'}.png`;
}

export function GeradorAssinatura({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  // Estado de Autenticação OTP
  const [emailAutenticado, setEmailAutenticado] = useState<string | null>(initialEmail);
  const [emailInput, setEmailInput] = useState('');
  const [etapaOtp, setEtapaOtp] = useState<'EMAIL' | 'CODIGO'>('EMAIL');
  const [codigoInput, setCodigoInput] = useState('');
  const [carregandoOtp, setCarregandoOtp] = useState(false);
  const [erroOtp, setErroOtp] = useState<string | null>(null);
  const [sucessoOtp, setSucessoOtp] = useState<string | null>(null);

  // Estado dos Dados da Assinatura
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [idFuncional, setIdFuncional] = useState('');
  const [setor, setSetor] = useState('');
  const [aceitouTermo, setAceitouTermo] = useState(false);

  // Estado de Validação & Exportação
  const [assinaturaLiberada, setAssinaturaLiberada] = useState(false);
  const [validando, setValidando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [dimensoes, setDimensoes] = useState('636 × 292 px');

  // Canvas e Imagem Oficial
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoErro, setLogoErro] = useState(false);

  // Carrega a imagem oficial somente após a assinatura ser validada
  useEffect(() => {
    if (!assinaturaLiberada) {
      return;
    }

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      setLogoImg(img);
      setLogoErro(false);
    };
    img.onerror = () => {
      setLogoImg(null);
      setLogoErro(true);
    };
    img.src = LOGO_URL;
  }, [assinaturaLiberada, logoImg]);

  const showFeedback = useCallback(
    (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
      setFeedbackBanner({ message, type });
    },
    []
  );

  // Renderização em Canvas 2x
  const renderSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nomeTexto = nome.trim() || 'Nome Completo do Servidor';
    const cargoTexto = cargo.trim() || 'Selecione o Cargo / Função';
    const idTexto = idFuncional.trim();
    const setorTexto = setor.trim() || 'Selecione o Setor';

    const linha2Texto = idTexto ? `${cargoTexto} - ID: ${idTexto}` : cargoTexto;

    const fontNome = `700 28px ${FONT_STACK}`;
    const fontFuncao = `600 19.5px ${FONT_STACK}`;
    const fontSetor = `400 18px ${FONT_STACK}`;

    ctx.save();
    ctx.font = fontNome;
    const widthNome = ctx.measureText(nomeTexto).width;

    ctx.font = fontFuncao;
    const widthFuncao = ctx.measureText(linha2Texto).width;

    ctx.font = fontSetor;
    const widthSetor = ctx.measureText(setorTexto).width;
    ctx.restore();

    const maxTextWidth = Math.max(widthNome, widthFuncao, widthSetor);
    const contentWidth = Math.max(
      MIN_WIDTH - CONTENT_START_X - PADDING_RIGHT,
      Math.ceil(maxTextWidth + 8)
    );
    const logicalWidth = CONTENT_START_X + contentWidth + PADDING_RIGHT;

    // Proporção da imagem oficial (996 x 285 -> ~0.286)
    const maxLogoDrawWidth = Math.min(contentWidth, 560);
    let logoHeight = Math.round(maxLogoDrawWidth * (285 / 996));
    if (assinaturaLiberada && logoImg && logoImg.naturalWidth > 0) {
      const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
      logoHeight = Math.round(maxLogoDrawWidth * ratio);
    }

    const yNome = PADDING_TOP;
    const yFuncao = yNome + 36;
    const ySetor = yFuncao + 26;
    const yDivider = ySetor + 28;
    const yLogo = yDivider + 12;
    const logicalHeight = yLogo + logoHeight + PADDING_BOTTOM;

    canvas.width = Math.round(logicalWidth * SCALE);
    canvas.height = Math.round(logicalHeight * SCALE);
    setDimensoes(`${logicalWidth} × ${logicalHeight} px`);

    ctx.save();
    ctx.scale(SCALE, SCALE);

    // 1. Fundo branco puro
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // 2. Filete vertical bicolor
    const barTop = PADDING_TOP;
    const barTotalHeight = logicalHeight - PADDING_TOP - PADDING_BOTTOM;
    const halfBarHeight = barTotalHeight / 2;

    ctx.fillStyle = COLOR_PURPLE;
    ctx.fillRect(PADDING_LEFT, barTop, ACCENT_BAR_WIDTH, halfBarHeight);

    ctx.fillStyle = COLOR_DARK_BLUE;
    ctx.fillRect(PADDING_LEFT, barTop + halfBarHeight, ACCENT_BAR_WIDTH, halfBarHeight);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // 3. Linha 1: Nome completo
    ctx.fillStyle = nome.trim() ? '#0c67a3' : '#94a3b8';
    ctx.font = fontNome;
    ctx.fillText(nomeTexto, CONTENT_START_X, yNome);

    // 4. Linha 2: Cargo e ID Funcional
    ctx.fillStyle = cargo.trim() ? '#111111' : '#94a3b8';
    ctx.font = fontFuncao;
    ctx.fillText(linha2Texto, CONTENT_START_X, yFuncao);

    // 5. Linha 3: Setor
    ctx.fillStyle = setor.trim() ? '#111111' : '#94a3b8';
    ctx.font = fontSetor;
    ctx.fillText(setorTexto, CONTENT_START_X, ySetor);

    // 6. Divisor horizontal
    ctx.fillStyle = '#111111';
    ctx.fillRect(CONTENT_START_X, yDivider, contentWidth, 2.2);

    // 7. Rodapé com Logotipo Oficial (apenas quando validado)
    if (assinaturaLiberada && logoImg && logoImg.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logoImg, CONTENT_START_X, yLogo, maxLogoDrawWidth, logoHeight);
    } else {
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.fillRect(CONTENT_START_X, yLogo, maxLogoDrawWidth, logoHeight);
      ctx.strokeRect(CONTENT_START_X, yLogo, maxLogoDrawWidth, logoHeight);

      ctx.fillStyle = '#64748b';
      ctx.font = `600 13px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        assinaturaLiberada && logoErro
          ? 'Erro ao carregar logotipo oficial'
          : 'Logotipo oficial SEMPI liberado após validação',
        CONTENT_START_X + maxLogoDrawWidth / 2,
        yLogo + logoHeight / 2
      );
      ctx.restore();

      // Marca d'água diagonal na prévia não validada
      ctx.save();
      ctx.translate(logicalWidth / 2, logicalHeight / 2);
      ctx.rotate(-0.22);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.font = `700 28px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRÉVIA NÃO VALIDADA', 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }, [nome, cargo, idFuncional, setor, assinaturaLiberada, logoImg, logoErro]);

  useEffect(() => {
    if (emailAutenticado) {
      renderSignature();
    }
  }, [emailAutenticado, renderSignature]);

  // Handlers Etapa 1 (OTP)
  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroOtp(null);
    setSucessoOtp(null);
    setCarregandoOtp(true);

    const res = await solicitarCodigoAssinatura(emailInput);
    setCarregandoOtp(false);

    if (!res.success) {
      setErroOtp(res.error || 'Erro ao enviar código.');
      return;
    }

    setEtapaOtp('CODIGO');
    setSucessoOtp(
      `Código de 6 dígitos enviado para ${res.email}. Verifique sua caixa de entrada.`
    );
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroOtp(null);
    setSucessoOtp(null);
    setCarregandoOtp(true);

    const res = await verificarCodigoAssinatura(codigoInput);
    setCarregandoOtp(false);

    if (!res.success) {
      setErroOtp(res.error || 'Código inválido.');
      return;
    }

    setEmailAutenticado(res.email || emailInput.trim().toLowerCase());
    setCodigoInput('');
    setEtapaOtp('EMAIL');
  };

  const handleTrocarEmail = async () => {
    await encerrarSessaoAssinatura();
    setEmailAutenticado(null);
    setAssinaturaLiberada(false);
    setErroValidacao(null);
    setFeedbackBanner(null);
    setEtapaOtp('EMAIL');
    setCodigoInput('');
    setErroOtp(null);
    setSucessoOtp(null);
  };

  // Reseta a liberação sempre que qualquer campo for editado (impede bypass de validação)
  const handleCampoChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    if (assinaturaLiberada) {
      setAssinaturaLiberada(false);
      setFeedbackBanner(null);
    }
    if (erroValidacao) {
      setErroValidacao(null);
    }
  };

  // Handler de Validação e Liberação
  const handleValidarELiberar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);
    setFeedbackBanner(null);
    setValidando(true);

    const res = await validarELiberarAssinatura({
      nome,
      cargo,
      idFuncional,
      setor,
      aceitouTermo,
    });

    setValidando(false);

    if (!res.success) {
      setAssinaturaLiberada(false);
      setErroValidacao(res.error || 'Não foi possível validar sua solicitação.');
      return;
    }

    setAssinaturaLiberada(true);
    showFeedback(
      'Assinatura validada e auditada com sucesso! Agora você pode baixar ou copiar a imagem oficial.',
      'success'
    );
  };

  const podeExportar =
    assinaturaLiberada && !!logoImg && logoImg.complete && logoImg.naturalWidth > 0;

  // Download PNG
  const handleDownload = () => {
    if (!podeExportar || !canvasRef.current) return;
    try {
      renderSignature();
      const canvas = canvasRef.current;
      const filename = slugifyFilename(nome);

      const triggerDownload = (url: string, isBlobUrl: boolean) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          if (isBlobUrl) {
            URL.revokeObjectURL(url);
          }
        }, 1500);

        showFeedback(`Arquivo "${filename}" gerado com sucesso!`, 'success');
      };

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const fallbackUrl = canvas.toDataURL('image/png', 1.0);
            triggerDownload(fallbackUrl, false);
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          triggerDownload(blobUrl, true);
        },
        'image/png',
        1.0
      );
    } catch {
      showFeedback(
        'Não foi possível baixar automaticamente. Clique com o botão direito na imagem acima para salvar.',
        'warning'
      );
    }
  };

  // Copiar para Clipboard
  const handleCopyImage = async () => {
    if (!podeExportar || !canvasRef.current) return;
    try {
      renderSignature();
      const canvas = canvasRef.current;

      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        showFeedback(
          'Seu navegador não permite copiar imagens diretamente. Utilize o botão "Baixar Assinatura (PNG)".',
          'warning'
        );
        return;
      }

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            showFeedback('Não foi possível preparar a imagem para cópia.', 'error');
            return;
          }
          try {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setCopiado(true);
            showFeedback(
              'Assinatura copiada! Agora basta colar (Ctrl+V) nas configurações do seu e-mail.',
              'success'
            );
            setTimeout(() => setCopiado(false), 2500);
          } catch {
            showFeedback(
              'Permissão de cópia bloqueada pelo navegador. Clique em "Baixar Assinatura (PNG)".',
              'warning'
            );
          }
        },
        'image/png',
        1.0
      );
    } catch {
      showFeedback('Não foi possível copiar a imagem. Use o botão de download.', 'warning');
    }
  };

  const handleLimpar = () => {
    setNome('');
    setCargo('');
    setIdFuncional('');
    setSetor('');
    setAceitouTermo(false);
    setAssinaturaLiberada(false);
    setErroValidacao(null);
    setFeedbackBanner(null);
  };

  // ETAPA 1: Autenticação por E-mail Institucional
  if (!emailAutenticado) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-[#003B73] text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0B1E3B]">
                Gerador de Assinatura Digital
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Validação de identidade institucional • SEMPI
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 mb-6 text-xs sm:text-sm text-[#0B1E3B] leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <Lock className="w-4 h-4 text-[#003B73]" />
              <span>Acesso restrito a servidores da SEMPI</span>
            </p>
            <p className="text-slate-600">
              Para proteger o uso do logotipo oficial da Secretaria e evitar o uso indevido de identidade, confirme primeiro seu e-mail institucional (<strong>@mulher.rj.gov.br</strong>).
            </p>
          </div>

          {erroOtp && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{erroOtp}</span>
            </div>
          )}

          {sucessoOtp && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{sucessoOtp}</span>
            </div>
          )}

          {etapaOtp === 'EMAIL' ? (
            <form onSubmit={handleEnviarCodigo} className="space-y-4">
              <div>
                <label
                  htmlFor="inputEmailInstitucional"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  E-mail Institucional <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="inputEmailInstitucional"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nome.sobrenome@mulher.rj.gov.br"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enviaremos um código de 6 dígitos para confirmar que você pertence à secretaria.
                </p>
              </div>

              <button
                type="submit"
                disabled={carregandoOtp}
                className="w-full bg-[#003B73] hover:bg-[#0B1E3B] disabled:opacity-60 text-white font-bold text-sm py-3 px-5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {carregandoOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>
                  {carregandoOtp ? 'Enviando código...' : 'Enviar Código de Verificação'}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerificarCodigo} className="space-y-4">
              <div>
                <label
                  htmlFor="inputCodigoOtp"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Código de Verificação (6 dígitos) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="inputCodigoOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-base font-mono tracking-[0.35em] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={carregandoOtp || codigoInput.length !== 6}
                  className="flex-1 bg-[#003B73] hover:bg-[#0B1E3B] disabled:opacity-60 text-white font-bold text-sm py-3 px-5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {carregandoOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{carregandoOtp ? 'Validando...' : 'Confirmar Código'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEtapaOtp('EMAIL');
                    setCodigoInput('');
                    setErroOtp(null);
                    setSucessoOtp(null);
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Alterar / Reenviar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ETAPA 2: Formulário + Pré-visualização + Exportação
  return (
    <div className="space-y-6">
      {/* Barra de Identidade Autenticada */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            E-mail verificado
          </span>
          <span className="font-mono font-semibold text-[#0B1E3B]">{emailAutenticado}</span>
        </div>

        <button
          type="button"
          onClick={handleTrocarEmail}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold text-slate-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Trocar e-mail</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Coluna Esquerda: Formulário */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[#0B1E3B]">Dados do Servidor</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Preencha os campos para pré-visualizar sua assinatura.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLimpar}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#003B73] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Limpar campos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>

          <form onSubmit={handleValidarELiberar} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label
                htmlFor="inputNome"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nome completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="inputNome"
                required
                value={nome}
                onChange={(e) => handleCampoChange(setNome)(e.target.value)}
                placeholder="Ex: Cleber Lopes Gomes"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] transition-shadow"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Deve corresponder ao titular do e-mail <strong>{emailAutenticado}</strong>.
              </p>
            </div>

            {/* Função / Cargo (Dropdown) */}
            <div>
              <label
                htmlFor="selectCargo"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Função / Cargo <span className="text-rose-500">*</span>
              </label>
              <select
                id="selectCargo"
                required
                value={cargo}
                onChange={(e) => handleCampoChange(setCargo)(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] transition-shadow"
              >
                <option value="">Selecione o cargo...</option>
                {CARGOS_ASSINATURA_SEMPI.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* ID Funcional */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="inputIdFuncional"
                  className="block text-sm font-medium text-slate-700"
                >
                  ID Funcional
                </label>
                <span className="text-xs text-slate-400">Opcional</span>
              </div>
              <input
                type="text"
                id="inputIdFuncional"
                value={idFuncional}
                onChange={(e) => handleCampoChange(setIdFuncional)(e.target.value)}
                placeholder="Ex: 0000000-0"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] transition-shadow"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Se deixado em branco, apenas o cargo será exibido na segunda linha.
              </p>
            </div>

            {/* Setor (Dropdown) */}
            <div>
              <label
                htmlFor="selectSetor"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Setor <span className="text-rose-500">*</span>
              </label>
              <select
                id="selectSetor"
                required
                value={setor}
                onChange={(e) => handleCampoChange(setSetor)(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] transition-shadow"
              >
                <option value="">Selecione o setor...</option>
                {SETORES_ASSINATURA_SEMPI.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Declaração de Veracidade */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aceitouTermo}
                  onChange={(e) => {
                    setAceitouTermo(e.target.checked);
                    if (assinaturaLiberada && !e.target.checked) {
                      setAssinaturaLiberada(false);
                    }
                  }}
                  className="mt-0.5 rounded border-slate-300 text-[#003B73] focus:ring-[#003B73]"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  Declaro que os dados informados são verdadeiros e correspondem ao meu vínculo funcional ativo na SEMPI, ciente do registro de auditoria.
                </span>
              </label>
            </div>

            {erroValidacao && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{erroValidacao}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={validando}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#003B73] hover:bg-[#0B1E3B] disabled:opacity-60 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {validando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {validando
                  ? 'Validando solicitação...'
                  : assinaturaLiberada
                    ? 'Assinatura Validada'
                    : 'Validar e Liberar Assinatura'}
              </span>
            </button>
          </form>
        </section>

        {/* Coluna Direita: Pré-visualização e Exportação */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0B1E3B]">
                  Pré-visualização da Assinatura
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Renderização em alta definição (2x) pronta para uso no e-mail.
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                {dimensoes}
              </span>
            </div>

            {/* Container do Canvas */}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6 flex items-center justify-center">
              <div className="bg-white shadow-md rounded-lg border border-slate-200/80 overflow-hidden max-w-full">
                <canvas
                  ref={canvasRef}
                  className="block max-w-full h-auto"
                  aria-label="Pré-visualização da assinatura institucional"
                />
              </div>
            </div>

            {!assinaturaLiberada && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                <span>
                  Preencha seus dados e clique em <strong>Validar e Liberar Assinatura</strong> para desbloquear o logotipo oficial e os botões de download/cópia.
                </span>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                disabled={!podeExportar}
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#003B73] hover:bg-[#0B1E3B] disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-[0.99] text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Assinatura (PNG)</span>
              </button>

              <button
                type="button"
                disabled={!podeExportar}
                onClick={handleCopyImage}
                className="sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.99] text-slate-700 font-semibold text-sm px-5 py-3 rounded-xl border border-slate-300 shadow-sm transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copiado ? 'Copiada!' : 'Copiar Imagem'}</span>
              </button>
            </div>

            {/* Banner de Feedback */}
            {feedbackBanner && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-4 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium flex items-center gap-2 border ${
                  feedbackBanner.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : feedbackBanner.type === 'warning'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <span>{feedbackBanner.message}</span>
              </div>
            )}
          </div>

          {/* Instruções Rápidas */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              Como inserir no seu e-mail (Gmail, Outlook ou Webmail)
            </h3>
            <ol className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
              <li>
                Clique em <strong>Baixar Assinatura (PNG)</strong> ou em{' '}
                <strong>Copiar Imagem</strong>.
              </li>
              <li>
                Acesse as <strong>Configurações &gt; Assinatura</strong> do seu cliente de e-mail.
              </li>
              <li>
                Cole a imagem diretamente na caixa de assinatura (
                <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 border border-slate-300 rounded">
                  Ctrl+V
                </kbd>
                ) ou insira o arquivo PNG baixado.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
