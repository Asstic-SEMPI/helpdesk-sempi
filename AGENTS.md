<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 📘 Contexto do Projeto e Histórico de Desenvolvimento

## 1. Visão Geral do Sistema
O **Sistema de Gestão de Chamados de TI (Helpdesk TI)** foi construído para a Secretaria de Estado da Mulher e de Políticas Inclusivas (SEMPI) com o objetivo de receber, triar, atender, auditar e concluir solicitações de TI de forma ágil, segura e sem atrito cadastral para o cidadão/servidor.

- **Stack:** Next.js (App Router, Server Actions, TypeScript), Tailwind CSS, Lucide React.
- **Identidade Visual:** Design institucional limpo, profissional e moderno mesclando **Branco e Azul Marinho** (`#003B73` / `#0B1E3B`).
- **Banco de Dados & Storage:** Supabase (PostgreSQL 15+, Supabase Storage bucket `ticket-attachments` privado).
- **Autenticação:** Supabase Auth via Admin API (`auth.admin.createUser`) e Server Actions (`signInWithPassword`) gravando cookies HTTP-only de sessão.
- **Notificações:** Servidor de E-mail Institucional Zimbra (`10.11.28.5` / `helpdesk.asstic@mulher.rj.gov.br`) na porta 587 (STARTTLS) com Nodemailer para:
  - Confirmação de abertura para o solicitante com link de acompanhamento;
  - Alerta de nova solicitação para a equipe de TI;
  - Notificação de início de atendimento (`EM_ATENDIMENTO`);
  - Notificação de procedimento e solicitação de validação (`AGUARDANDO_CONFIRMACAO`);
  - Notificação de reabertura de chamado pelo solicitante.

---

## 2. O Que Foi Feito e Como Foi Feito

### A. Autenticação e Correção de Login
- Implementação de Server Action em [`app/actions/auth.ts`](file:///Users/rogercandez/Documents/Sistema%20Helpdesk%20Sempi/app/actions/auth.ts) com `signInWithPassword` e persistência de cookies via `@supabase/ssr`.
- Sincronização e provisionamento do usuário Admin no Supabase Auth e tabela `public.profiles`.

### B. Transição de Canal de Contato: E-mail Institucional Zimbra
- O formulário público em `/abrir-chamado` solicita o **E-mail** do solicitante com validação de formato.
- O solicitante recebe um e-mail imediato de confirmação com seu número de protocolo e link exclusivo.
- Toda transição de status realizada pelo técnico dispara automaticamente e-mail formatado para a caixa de entrada do solicitante.
- O serviço [`lib/email/mailer.ts`](file:///Users/rogercandez/Documents/Sistema%20Helpdesk%20Sempi/lib/email/mailer.ts) foi configurado para o servidor SMTP Zimbra institucional (`10.11.28.5:587`, STARTTLS e certificados internos aceitos), autenticando com `helpdesk.asstic@mulher.rj.gov.br`.

### C. Dropdowns Padronizados (Categoria & Unidades SEMPI)
- **Categoria do Chamado:** Dropdown estilizado com placeholder inicial e opções: `Softwares`, `SEI`, `Internet / Wifi`, `Rede (Acesso, Senhas, Usuarios)`, `Hardware (Monitor, Teclado, Impressora)` e `Emails`.
- **Unidade / Departamento:** Dropdown padronizado com as 51 unidades oficiais da SEMPI em `types/index.ts` (`DEPARTAMENTOS_SEMPI`):
  - `SEMPI/ASSAPI`, `SEMPI/ASSCOM`, `SEMPI/ASSESP`, `SEMPI/ASSINT`, `SEMPI/ASSJUR`, `SEMPI/ASSP`, `SEMPI/ASSPLAN`, `SEMPI/ASSTIC`, etc.

### D. Redesign Institucional (Branco e Azul Marinho)
- Substituição da estética dark/neon por uma identidade governamental sóbria e elegante:
  - Fundo limpo e cards brancos (`bg-white` com bordas sutis `border-slate-200`).
  - Azul marinho institucional (`#003B73` e `#0B1E3B`) nos cabeçalhos, botões principais, sidebar e títulos.
  - Indicadores e badges de status em alto contraste e fácil leitura.

### E. Módulos e Rotas
1. **Público:**
   - `/`: Landing page moderna com atalhos rápidos e apresentação do suporte da SEMPI.
   - `/abrir-chamado`: Formulário público completo com dropdowns de departamentos da SEMPI e categorias, e-mail do solicitante e anexo até 3 MB.
   - `/acompanhar/[token]`: Tela protegida anti-IDOR via token criptográfico com histórico de atendimento, download seguro de anexos e botões de validação (Aprovar / Reabrir).
2. **Painel Administrativo da TI:**
   - `/admin/login`: Autenticação dos operadores e gestores via Server Action e cookies.
   - `/admin/chamados`: Listagem geral com cards de métricas em tempo real, filtros dinâmicos e exclusão.
   - `/admin/chamados/[id]`: Tela de atendimento completo do técnico com alteração de status, procedimentos técnicos, envio automático de e-mail e linha do tempo de auditoria.
   - `/admin/usuarios`: CRUD completo da equipe de TI via Supabase Admin API.

---

## 3. Credenciais de Administrador
- **E-mail:** `ti.asstic@gmail.com`
- **Senha:** `SEVIT1501`
- **Perfil / Role:** `ADMIN`
- **Acesso ao painel:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 4. Diretrizes para Próximas Interações
- Para rodar scripts de manutenção ou seeds com variáveis de ambiente: `node --env-file=.env.local scripts/<script>.mjs`.
- Configurações do SMTP Zimbra estão definidas em `.env.local` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- A lista de departamentos da SEMPI está centralizada em `types/index.ts` como constante `DEPARTAMENTOS_SEMPI`.
