-- Tabela para aprovação de solicitações de assinatura digital (e-mails setoriais ou divergentes)
create table if not exists public.signature_requests (
  id uuid primary key default gen_random_uuid(),
  email_autenticado text not null,
  nome text not null,
  cargo text not null,
  id_funcional text,
  setor text not null,
  status varchar(20) not null default 'PENDENTE' check (status in ('PENDENTE', 'APROVADO', 'RECUSADO')),
  motivo_recusa text,
  ip_address varchar(45),
  user_agent text,
  aprovado_por uuid references public.profiles(id),
  aprovado_em timestamptz,
  created_at timestamptz default timezone('utc', now()) not null
);

alter table public.signature_requests enable row level security;
