# 🎫 Sistema de Gestão de Chamados de TI (Helpdesk TI)

Sistema moderno, seguro e sem custos operacionais para recepção, triagem, atendimento, rastreabilidade e encerramento de chamados de TI para secretarias e órgãos públicos.

Desenvolvido para execução em arquitetura **Serverless (Vercel)** integrada a **Supabase (PostgreSQL, Storage e Auth)**, com notificações automáticas via **Gmail (Nodemailer)** e links dinâmicos para **WhatsApp Web**.

---

## 🚀 Tecnologias

- **Framework Web & API:** Next.js 14+ / 15 (App Router, Server Actions, TypeScript)
- **Estilização & UI:** Tailwind CSS, Lucide React
- **Banco de Dados & Storage:** Supabase (PostgreSQL 15+, Supabase Storage com Buckets Privados)
- **Autenticação:** Supabase Auth gerenciado via Admin API no backend (sem auto-cadastro público)
- **Mensageria de E-mail:** Nodemailer utilizando conta Gmail via App Password (Custo Zero)
- **Integração WhatsApp:** Links dinâmicos parametrizados (`wa.me`) com mensagens pré-formatadas

---

## 📌 Principais Recursos

1. **Abertura Pública Descomplicada (QR Code / Link):**
   - Formulário público rápido e responsivo.
   - Categorias predefinidas (Softwares, SEI, Internet/Wifi, Rede, Hardware, Emails).
   - Upload restrito a arquivos de até **3 MB** (PDF, PNG, JPG).
2. **Acompanhamento Seguro por Token Criptográfico (Sem Login para Solicitante):**
   - URL com token de alta entropia UUID v4 (`/acompanhar/[tracking_token]`).
   - Prevenção ativa de IDOR (Insecure Direct Object References).
3. **Ciclo Completo de Atendimento e Validação:**
   - Atribuição para técnicos da equipe.
   - Registro detalhado de procedimentos técnicos adotados.
   - **Validação pelo Solicitante:** O usuário aprova o atendimento ou reabre com novos esclarecimentos e novos anexos.
4. **Gestão Interna de Usuários (Painel TI):**
   - Cadastro de técnicos e gestores diretamente pelo painel administrativo (via `auth.admin.createUser`).
5. **Auditoria e Tracklog Imutável:**
   - Histórico permanente em `audit_logs` registrando data, autor, ação, IP e alterações de estado.
