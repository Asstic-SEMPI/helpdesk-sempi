# 📄 `IMPLEMENTACAO.md`

```markdown
# 🛠️ Guia de Implementação Passo a Passo para o Agente (Antigravity IDE)

Este documento instrui o agente do **Antigravity IDE** a construir e configurar o projeto de forma autônoma e completa.

---

## ETAPA 1: Script SQL Consolidado (Executar no Supabase)

Execute o script abaixo no **SQL Editor** do Supabase para criar a estrutura relacional, triggers, bucket e auditoria:

```sql
-- 1. Extensões
create extension if not exists "pgcrypto";

-- 2. Enums
create type user_role as enum ('ADMIN', 'TECNICO');
create type ticket_status as enum ('CRIADO', 'EM_ATENDIMENTO', 'AGUARDANDO_CONFIRMACAO', 'REABERTO', 'CONCLUIDO');
create type ticket_category as enum (
  'Softwares', 
  'SEI', 
  'Internet / Wifi', 
  'Rede (Acesso, Senhas, Usuarios)', 
  'Hardware (Monitor, Teclado, Impressora)', 
  'Emails'
);

-- 3. Tabela de Perfis de Usuários (Técnicos da TI)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text not null,
    email text unique not null,
    cargo text default 'Técnico de Suporte',
    role user_role not null default 'TECNICO',
    is_active boolean not null default true,
    created_at timestamptz default timezone('utc', now()) not null
);

-- Trigger de sincronização de novos usuários via Auth Admin
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nome, role, cargo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'TECNICO'::public.user_role),
    coalesce(new.raw_user_meta_data->>'cargo', 'Técnico de Suporte')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Tabela de Chamados
create sequence if not exists ticket_seq;

create table if not exists public.tickets (
    id uuid primary key default gen_random_uuid(),
    protocolo text unique not null,
    tracking_token uuid unique not null default gen_random_uuid(),
    nome_solicitante text not null,
    telefone varchar(20) not null,
    departamento text not null,
    categoria ticket_category not null,
    descricao text not null,
    status ticket_status not null default 'CRIADO',
    tecnico_responsavel_id uuid references public.profiles(id),
    created_at timestamptz default timezone('utc', now()) not null,
    updated_at timestamptz default timezone('utc', now()) not null
);

-- Protocolo amigável sequencial (ex: TI-2026-0001)
create or replace function public.generate_ticket_protocol()
returns trigger as $$
begin
  new.protocolo := 'TI-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('ticket_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_ticket_insert on public.tickets;
create trigger before_ticket_insert
  before insert on public.tickets
  for each row
  when (new.protocolo is null)
  execute function public.generate_ticket_protocol();

-- 5. Interações (Respostas técnicas e réplicas)
create table if not exists public.ticket_interactions (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.tickets(id) on delete cascade,
    actor_id uuid references public.profiles(id),
    actor_type varchar(20) not null check (actor_type in ('TECNICO', 'SOLICITANTE', 'SISTEMA')),
    mensagem text not null,
    created_at timestamptz default timezone('utc', now()) not null
);

-- 6. Anexos
create table if not exists public.ticket_attachments (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.tickets(id) on delete cascade,
    interaction_id uuid references public.ticket_interactions(id) on delete set null,
    file_name text not null,
    storage_path text not null,
    mime_type varchar(100) not null,
    file_size integer not null check (file_size <= 3145728), -- 3 MB
    created_at timestamptz default timezone('utc', now()) not null
);

-- 7. Auditoria / Tracklog Imutável
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.tickets(id) on delete cascade,
    actor_id uuid references public.profiles(id),
    actor_type varchar(20) not null check (actor_type in ('TECNICO', 'SOLICITANTE', 'SISTEMA')),
    action text not null,
    ip_address varchar(45),
    user_agent text,
    old_state jsonb,
    new_state jsonb,
    created_at timestamptz default timezone('utc', now()) not null
);

-- Regras de imutabilidade
create or replace rule no_update_audit_logs as on update to public.audit_logs do instead nothing;
create or replace rule no_delete_audit_logs as on delete to public.audit_logs do instead nothing;

-- 8. Configurações de RLS
alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_interactions enable row level security;
alter table public.ticket_attachments enable row level security;
alter table public.audit_logs enable row level security;

-- Políticas de RLS
create policy "Autenticados gerenciam profiles" on public.profiles for all to authenticated using (true);
create policy "Autenticados gerenciam tickets" on public.tickets for all to authenticated using (true);
create policy "Anonimo insere ticket" on public.tickets for insert to anon with check (true);
create policy "Anonimo consulta ticket por tracking_token" on public.tickets for select to anon using (true);
create policy "Anonimo atualiza ticket por tracking_token" on public.tickets for update to anon using (true);
create policy "Acesso a interações" on public.ticket_interactions for all using (true);
create policy "Acesso a anexos" on public.ticket_attachments for all using (true);
create policy "Acesso a logs" on public.audit_logs for all using (true);
Configuração do Storage
Crie o bucket com nome: ticket-attachments.
Configure-o como Private Bucket com tamanho máximo de 3 MB.
ETAPA 2: Estrutura de Diretórios Recomendada
├── app/
│   ├── (public)/
│   │   ├── page.tsx                       # Redirecionamento / Boas-vindas
│   │   ├── abrir-chamado/
│   │   │   └── page.tsx                   # Formulário público de abertura
│   │   └── acompanhar/
│   │       └── [token]/
│   │           └── page.tsx               # Linha do tempo, aprovação e réplica
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx                   # Login da equipe de TI
│   │   ├── chamados/
│   │   │   ├── page.tsx                   # Listagem e filtros de chamados
│   │   │   └── [id]/
│   │   │       └── page.tsx               # Atendimento do chamado pelo técnico
│   │   └── usuarios/
│   │       └── page.tsx                   # Cadastro interno de técnicos
│   ├── actions/
│   │   ├── tickets.ts                     # Server actions de chamados
│   │   └── usuarios.ts                    # Server action para criar técnicos via Admin API
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Client para componentes do navegador
│   │   ├── server.ts                      # Client para Server Components / Actions
│   │   └── admin.ts                       # Client com SERVICE_ROLE_KEY (exclusivo servidor)
│   ├── email/
│   │   └── mailer.ts                      # Serviço do Nodemailer com Gmail
│   └── utils.ts
├── types/
│   └── index.ts                           # Tipos do TypeScript
├── .env.local
├── package.json
└── README.md
ETAPA 3: Implementação do Serviço de E-mail (Gmail + Nodemailer)
Arquivo: lib/email/mailer.ts
TypeScript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
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
      from: `"Suporte de TI" <${process.env.GMAIL_USER}>`,
      to: para,
      subject: assunto,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao disparar e-mail via Gmail:', error);
    return { success: false, error };
  }
}
ETAPA 4: Cadastro Interno de Usuários sem Auto-Cadastro
Arquivo: lib/supabase/admin.ts
TypeScript
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
Arquivo: app/actions/usuarios.ts
TypeScript
'use server'

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function criarUsuarioTecnico(formData: {
  nome: string;
  email: string;
  cargo: string;
  role: 'ADMIN' | 'TECNICO';
  senhaInicial: string;
}) {
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
    throw new Error(`Falha ao criar usuário: ${error.message}`);
  }

  return { success: true, userId: data.user.id };
}
ETAPA 5: Ciclo de Atendimento e Validação pelo Solicitante
Regras Obrigatórias para o Agente Codificar:
Envio do Chamado:
O solicitante envia o formulário em /abrir-chamado.
Gera o chamado com status = 'CRIADO' e tracking_token exclusivo.
Faz upload do anexo (se existir) para ticket-attachments/{ticket_id}/{nome_arquivo}.
Dispara e-mail para EMAIL_TI_NOTIFICACOES informando a nova demanda.
Retorna o tracking_token e redireciona para /acompanhar/[tracking_token].
Na tela final, disponibiliza botão para salvar o protocolo no WhatsApp via:
https://wa.me/55{TELEFONE}?text={MENSAGEM_COM_URL_DE_ACOMPANHAMENTO}.
Atendimento pelo Técnico:
Técnico altera o status para EM_ATENDIMENTO.
Ao terminar o serviço, descreve o procedimento adotado e move para AGUARDANDO_CONFIRMACAO.
O sistema dispara notificação via e-mail para o solicitante informando que o chamado aguarda sua validação.
Confirmação ou Recusa do Solicitante em /acompanhar/[token]:
Se Confirmar ("Sim"): Status muda para CONCLUIDO. O chamado é encerrado e bloqueado para novas ações.
Se Recusar ("Não"):
O formulário exibe campo de texto obrigatório para descrição do motivo da recusa.
Permite novo upload de anexo (até 3 MB).
Status muda para REABERTO.
Registra a réplica na tabela ticket_interactions.
Dispara aviso por e-mail para o técnico responsável.
Trilha de Auditoria:
Em todas as etapas de transição de status, inserir um registro em audit_logs gravando ticket_id, actor_type, action, old_state e new_state.

---

Esses dois arquivos cobrem toda a arquitetura, regras de negócio e infraestrutura. Você pode colocá-los diretamente no **Antigravity IDE** para que ele leia e execute toda a geração dos componentes, rotas e integrações do sistema.