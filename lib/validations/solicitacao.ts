import { z } from 'zod';

// ── Prestador (dentro do array) ──
const prestadorItemSchema = z.object({
  nome: z.string().min(1, 'Informe o nome completo do prestador'),
  dados: z.string().min(1, 'Informe o RG/CPF').max(11),
  funcao: z.string().min(1, 'Informe a função do prestador'),
});

// ── Schema do formulário público de solicitação ──
export const solicitacaoSchema = z.object({
  empresa: z.string().min(1, 'Informe o nome da empresa'),
  lojaSala: z.string().min(1, 'Informe a sala ou loja').max(20),
  pavimento: z.enum(['Torre Sul', 'Torre Norte', 'Lojas Sul', 'Lojas Norte'], {
    message: 'Selecione o pavimento',
  }),
  solicitante: z.string().min(1, 'Informe o nome do solicitante'),
  contato: z.string().min(1, 'Informe o contato').max(11),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  inicio: z.string().min(1, 'Informe a data de início'),
  termino: z.string().min(1, 'Informe a data de término'),
  horaInicio: z.string().min(1, 'Informe a hora de início'),
  servico: z.string().min(1, 'Descreva o serviço a ser executado'),
  prestadores: z
    .array(prestadorItemSchema)
    .min(1, 'Adicione ao menos um prestador'),
});

export type SolicitacaoFormData = z.infer<typeof solicitacaoSchema>;
