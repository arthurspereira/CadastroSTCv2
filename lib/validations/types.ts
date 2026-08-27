export type Pavimento = 'Torre Sul' | 'Torre Norte' | 'Lojas Sul' | 'Lojas Norte';

export type Status = 'pendente' | 'aprovado' | 'reprovado';

export interface Prestador {
  id: string;
  protocolo: string | null;
  protocolo_lote: string | null;
  empresa: string;
  sala: string;
  pavimento: Pavimento;
  responsavel: string;
  contato: string;
  email: string;
  nome: string;
  dados: string;
  funcao: string;
  servico: string;
  horario: string;
  inicio: string | null;
  termino: string | null;
  status: Status;
}
