import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarDataHora(dataString: string | null | undefined): string {
  if (!dataString) return '-';
  const data = new Date(dataString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  CRIADO: {
    label: 'Aberto',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Chamado recebido e aguardando triagem da equipe técnica.',
  },
  EM_ATENDIMENTO: {
    label: 'Em Atendimento',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Um técnico de TI está trabalhando no atendimento.',
  },
  AGUARDANDO_CONFIRMACAO: {
    label: 'Aguardando Validação',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'O técnico concluiu o procedimento e aguarda a sua aprovação por e-mail.',
  },
  REABERTO: {
    label: 'Reaberto',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'O atendimento foi recusado pelo solicitante e necessita nova ação da TI.',
  },
  CONCLUIDO: {
    label: 'Concluído',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Atendimento validado com sucesso e encerrado.',
  },
};
