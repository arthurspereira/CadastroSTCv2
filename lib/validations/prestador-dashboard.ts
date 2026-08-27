import { z } from 'zod';

// ── Prestador (dentro do array) ──
// No dashboard, dados tem maxlength 14 (diferente do form público que usa 11)
const prestadorDashboardItemSchema = z.object({
  nome: z.string().optional().default(''),
  dados: z.string().max(14).optional().default(''),
  funcao: z.string().optional().default(''),
});

// ── Schema do formulário de cadastro do dashboard ──
// No dashboard original, apenas sala, pavimento e servico são validados como
// obrigatórios no client. Os demais campos são livres (podem ficar vazios).
export const prestadorDashboardSchema = z.object({
  empresa: z.string().optional().default(''),
  sala: z.string().min(1, 'Informe a sala.').max(20),
  pavimento: z.enum(['Torre Sul', 'Torre Norte', 'Lojas Sul', 'Lojas Norte'], {
    message: 'Informe o pavimento.',
  }),
  responsavel: z.string().optional().default(''),
  contato: z.string().max(11).optional().default(''),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional().default(''),
  servico: z.string().min(1, 'Informe o serviço a ser executado.'),
  horario: z.string().optional().default(''),
  inicio: z.string().optional().default(''),
  termino: z.string().optional().default(''),
  prestadores: z
    .array(prestadorDashboardItemSchema)
    .min(1, 'Informe o nome completo de ao menos um prestador.'),
});

export type PrestadorDashboardFormData = z.infer<typeof prestadorDashboardSchema>;
