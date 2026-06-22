export type Turno = 'Tarde' | 'Noite';
export type TurnoPadrao = 'Tarde' | 'Noite' | 'Ambos';
export type StatusSeparador = 'Ativo' | 'Inativo';
export type Filial = 'Marsil SP' | 'Marsil BC';

export interface Separador {
  id: string;
  nome: string;
  turnoPadrao: TurnoPadrao;
  status: StatusSeparador;
  filial?: Filial;
}

export interface Lancamento {
  id: string;
  data: string; // Formato YYYY-MM-DD
  turno: Turno;
  separadorId: string; // FK para Separador
  quantidade: number; // quantidade de folhas para Tarde, pedidos para Noite
  erros: number; // default 0
  observacao?: string;
  createdAt?: string; // para fins de ordenação ou auditoria interna
  filial?: Filial;
}
