export interface Produto {
  codigo: string;
  nome: string;
  preco: number;
  tipo: 'kg' | 'un' | 'g';
}

export interface ItemEstoque {
  produto: Produto;
  saldo: number;
  unidade: string;
}

export interface ItemRomaneio {
  id: number;
  produto: Produto;
  qty: number;
  unit: string;
  mult?: number;
}

export interface RegistroProducao {
  id: number;
  tipo: 'producao';
  produto: Produto;
  qty: number;
  unit: string;
  mult: number;
  data: Date;
}

export interface RegistroTransferencia {
  id: number;
  tipo: 'transferencia';
  itens: ItemRomaneio[];
  total: number;
  data: Date;
  responsavel?: string;
  observacao?: string;
}

export type Registro = RegistroProducao | RegistroTransferencia;

export interface KpiSnapshot {
  totalProduzido: number;
  totalTransferencias: number;
  valorTransferido: number;
  timestamp: Date;
}
