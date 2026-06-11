import { Separador, Lancamento } from './types';

export const separadoresIniciais: Separador[] = [
  { id: 'sep_1', nome: 'João Pedro Silva', turnoPadrao: 'Noite', status: 'Ativo' },
  { id: 'sep_2', nome: 'Maria Eduarda Brandão', turnoPadrao: 'Tarde', status: 'Ativo' },
  { id: 'sep_3', nome: 'Carlos Henrique Souza', turnoPadrao: 'Ambos', status: 'Ativo' },
  { id: 'sep_4', nome: 'Ana Clara Costa', turnoPadrao: 'Tarde', status: 'Ativo' },
  { id: 'sep_5', nome: 'Pedro Santos Lima', turnoPadrao: 'Noite', status: 'Ativo' },
  { id: 'sep_6', nome: 'Lucas Ribeiro Mendes', turnoPadrao: 'Tarde', status: 'Inativo' },
  { id: 'sep_7', nome: 'Juliana Alencar', turnoPadrao: 'Noite', status: 'Ativo' }
];

export const lancamentosIniciais: Lancamento[] = [
  // Lançamentos Junho de 2026 (Mês atual de referência)
  
  // Turno TARDE - Separação de Romaneios (Folhas) - Média esperada: 10 a 25 folhas por dia
  { id: 'lan_1', data: '2026-06-01', turno: 'Tarde', separadorId: 'sep_2', quantidade: 15, erros: 0, observacao: 'Faturamento tranquilo' },
  { id: 'lan_2', data: '2026-06-01', turno: 'Tarde', separadorId: 'sep_4', quantidade: 12, erros: 1, observacao: 'Falta apontada' },
  { id: 'lan_3', data: '2026-06-01', turno: 'Tarde', separadorId: 'sep_3', quantidade: 18, erros: 0 },
  
  { id: 'lan_4', data: '2026-06-02', turno: 'Tarde', separadorId: 'sep_2', quantidade: 20, erros: 0 },
  { id: 'lan_5', data: '2026-06-02', turno: 'Tarde', separadorId: 'sep_4', quantidade: 14, erros: 0 },
  { id: 'lan_6', data: '2026-06-02', turno: 'Tarde', separadorId: 'sep_3', quantidade: 19, erros: 2, observacao: 'Troca de itens' },
  
  { id: 'lan_7', data: '2026-06-03', turno: 'Tarde', separadorId: 'sep_2', quantidade: 22, erros: 1 },
  { id: 'lan_8', data: '2026-06-03', turno: 'Tarde', separadorId: 'sep_4', quantidade: 10, erros: 0 },
  { id: 'lan_9', data: '2026-06-03', turno: 'Tarde', separadorId: 'sep_3', quantidade: 25, erros: 1 },
  
  { id: 'lan_10', data: '2026-06-04', turno: 'Tarde', separadorId: 'sep_2', quantidade: 17, erros: 0 },
  { id: 'lan_11', data: '2026-06-04', turno: 'Tarde', separadorId: 'sep_4', quantidade: 15, erros: 1 },
  { id: 'lan_12', data: '2026-06-04', turno: 'Tarde', separadorId: 'sep_3', quantidade: 16, erros: 0 },

  { id: 'lan_13', data: '2026-06-05', turno: 'Tarde', separadorId: 'sep_2', quantidade: 21, erros: 0 },
  { id: 'lan_14', data: '2026-06-05', turno: 'Tarde', separadorId: 'sep_4', quantidade: 18, erros: 0 },
  { id: 'lan_15', data: '2026-06-05', turno: 'Tarde', separadorId: 'sep_3', quantidade: 20, erros: 3, observacao: 'Avaria' },

  { id: 'lan_16', data: '2026-06-08', turno: 'Tarde', separadorId: 'sep_2', quantidade: 19, erros: 0 },
  { id: 'lan_17', data: '2026-06-08', turno: 'Tarde', separadorId: 'sep_4', quantidade: 16, erros: 0 },
  { id: 'lan_18', data: '2026-06-08', turno: 'Tarde', separadorId: 'sep_3', quantidade: 22, erros: 1 },

  { id: 'lan_19', data: '2026-06-09', turno: 'Tarde', separadorId: 'sep_2', quantidade: 24, erros: 1 },
  { id: 'lan_20', data: '2026-06-09', turno: 'Tarde', separadorId: 'sep_4', quantidade: 17, erros: 0 },
  { id: 'lan_21', data: '2026-06-09', turno: 'Tarde', separadorId: 'sep_3', quantidade: 18, erros: 0 },

  { id: 'lan_22', data: '2026-06-10', turno: 'Tarde', separadorId: 'sep_2', quantidade: 23, erros: 0 },
  { id: 'lan_23', data: '2026-06-10', turno: 'Tarde', separadorId: 'sep_4', quantidade: 19, erros: 0 },
  { id: 'lan_24', data: '2026-06-10', turno: 'Tarde', separadorId: 'sep_3', quantidade: 21, erros: 0 },

  // Turno NOITE - Separação de Pedidos (Pedido a Pedido) - Média esperada: 30 a 80 pedidos por dia
  { id: 'lan_25', data: '2026-06-01', turno: 'Noite', separadorId: 'sep_1', quantidade: 45, erros: 1 },
  { id: 'lan_26', data: '2026-06-01', turno: 'Noite', separadorId: 'sep_5', quantidade: 52, erros: 0 },
  { id: 'lan_27', data: '2026-06-01', turno: 'Noite', separadorId: 'sep_7', quantidade: 38, erros: 0 },
  { id: 'lan_28', data: '2026-06-01', turno: 'Noite', separadorId: 'sep_3', quantidade: 40, erros: 2 },
  
  { id: 'lan_29', data: '2026-06-02', turno: 'Noite', separadorId: 'sep_1', quantidade: 50, erros: 0 },
  { id: 'lan_30', data: '2026-06-02', turno: 'Noite', separadorId: 'sep_5', quantidade: 58, erros: 1 },
  { id: 'lan_31', data: '2026-06-02', turno: 'Noite', separadorId: 'sep_7', quantidade: 42, erros: 0 },
  { id: 'lan_32', data: '2026-06-02', turno: 'Noite', separadorId: 'sep_3', quantidade: 44, erros: 1 },

  { id: 'lan_33', data: '2026-06-03', turno: 'Noite', separadorId: 'sep_1', quantidade: 55, erros: 2 },
  { id: 'lan_34', data: '2026-06-03', turno: 'Noite', separadorId: 'sep_5', quantidade: 48, erros: 0 },
  { id: 'lan_35', data: '2026-06-03', turno: 'Noite', separadorId: 'sep_7', quantidade: 46, erros: 0 },
  
  { id: 'lan_36', data: '2026-06-04', turno: 'Noite', separadorId: 'sep_1', quantidade: 48, erros: 0 },
  { id: 'lan_37', data: '2026-06-04', turno: 'Noite', separadorId: 'sep_5', quantidade: 60, erros: 3, observacao: 'Muitas caixas fechadas' },
  { id: 'lan_38', data: '2026-06-04', turno: 'Noite', separadorId: 'sep_7', quantidade: 51, erros: 1 },

  { id: 'lan_39', data: '2026-06-05', turno: 'Noite', separadorId: 'sep_1', quantidade: 62, erros: 1 },
  { id: 'lan_40', data: '2026-06-05', turno: 'Noite', separadorId: 'sep_5', quantidade: 66, erros: 0 },
  { id: 'lan_41', data: '2026-06-05', turno: 'Noite', separadorId: 'sep_7', quantidade: 49, erros: 0 },

  { id: 'lan_42', data: '2026-06-08', turno: 'Noite', separadorId: 'sep_1', quantidade: 53, erros: 0 },
  { id: 'lan_43', data: '2026-06-08', turno: 'Noite', separadorId: 'sep_5', quantidade: 71, erros: 1 },
  { id: 'lan_44', data: '2026-06-08', turno: 'Noite', separadorId: 'sep_7', quantidade: 48, erros: 0 },

  { id: 'lan_45', data: '2026-06-09', turno: 'Noite', separadorId: 'sep_1', quantidade: 59, erros: 0 },
  { id: 'lan_46', data: '2026-06-09', turno: 'Noite', separadorId: 'sep_5', quantidade: 75, erros: 2 },
  { id: 'lan_47', data: '2026-06-09', turno: 'Noite', separadorId: 'sep_7', quantidade: 54, erros: 1 },

  { id: 'lan_48', data: '2026-06-10', turno: 'Noite', separadorId: 'sep_1', quantidade: 65, erros: 1 },
  { id: 'lan_49', data: '2026-06-10', turno: 'Noite', separadorId: 'sep_5', quantidade: 80, erros: 0 },
  { id: 'lan_50', data: '2026-06-10', turno: 'Noite', separadorId: 'sep_7', quantidade: 58, erros: 0 }
];
