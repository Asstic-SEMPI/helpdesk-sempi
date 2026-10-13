export type UserRole = 'ADMIN' | 'TECNICO';

export type TicketStatus =
  | 'CRIADO'
  | 'EM_ATENDIMENTO'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'REABERTO'
  | 'CONCLUIDO';

export type TicketCategory =
  | 'Softwares'
  | 'SEI'
  | 'Internet / Wifi'
  | 'Rede (Acesso, Senhas, Usuarios)'
  | 'Hardware (Monitor, Teclado, Impressora)'
  | 'Emails';

export const TICKET_CATEGORIES: TicketCategory[] = [
  'Softwares',
  'SEI',
  'Internet / Wifi',
  'Rede (Acesso, Senhas, Usuarios)',
  'Hardware (Monitor, Teclado, Impressora)',
  'Emails',
];

export const DEPARTAMENTOS_SEMPI = [
  'SEMPI/ASSAPI',
  'SEMPI/ASSCOM',
  'SEMPI/ASSESP',
  'SEMPI/ASSINT',
  'SEMPI/ASSJUR',
  'SEMPI/ASSP',
  'SEMPI/ASSPLAN',
  'SEMPI/ASSTIC',
  'SEMPI/CEAMITAG',
  'SEMPI/CEAMJAP',
  'SEMPI/CEAMMP',
  'SEMPI/CEAMQUEI',
  'SEMPI/CEAMTR',
  'SEMPI/CEDIM',
  'SEMPI/CHEGAB',
  'SEMPI/CIAMBAIX',
  'SEMPI/CIAMLYRA',
  'SEMPI/COOACESS',
  'SEMPI/COOALMX',
  'SEMPI/COOBENS',
  'SEMPI/COOC',
  'SEMPI/COOCOMP',
  'SEMPI/COOCONT',
  'SEMPI/COOCT',
  'SEMPI/COOFIN',
  'SEMPI/COOGCCR',
  'SEMPI/COOGESPE',
  'SEMPI/COOLRJ',
  'SEMPI/COOPAT',
  'SEMPI/COOD-PCD',
  'SEMPI/COORETV',
  'SEMPI/COORJO',
  'SEMPI/COORS',
  'SEMPI/COORÇAM',
  'SEMPI/COOSRJ',
  'SEMPI/COOTRANS',
  'SEMPI/FEDM',
  'SEMPI/FEEVIMU',
  'SEMPI/GABSEC',
  'SEMPI/SEPS',
  'SEMPI/SUBDEPI',
  'SEMPI/SUPAF',
  'SEMPI/SUPAPCD',
  'SEMPI/SUPART',
  'SEMPI/SUPAUT',
  'SEMPI/SUPEMPEG',
  'SEMPI/SUPERJ',
  'SEMPI/SUPEV',
  'SEMPI/SUPPE',
  'SEMPI/SUPPI',
  'SEMPI/SUPT',
  'SEMPI/SUBPM',
] as const;

export type DepartamentoSempi = typeof DEPARTAMENTOS_SEMPI[number];

export interface Profile {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  protocolo: string;
  tracking_token: string;
  nome_solicitante: string;
  email_solicitante: string;
  telefone?: string;
  departamento: string;
  categoria: TicketCategory;
  descricao: string;
  status: TicketStatus;
  tecnico_responsavel_id: string | null;
  created_at: string;
  updated_at: string;
  tecnico_responsavel?: Profile | null;
}

export interface TicketInteraction {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  actor_type: 'TECNICO' | 'SOLICITANTE' | 'SISTEMA';
  mensagem: string;
  created_at: string;
  actor?: Profile | null;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  interaction_id: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  actor_type: 'TECNICO' | 'SOLICITANTE' | 'SISTEMA';
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  old_state: any;
  new_state: any;
  created_at: string;
  actor?: Profile | null;
}
