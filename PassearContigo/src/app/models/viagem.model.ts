/**
 * Viagem Model
 * Define a estrutura de uma viagem no app
 */
export interface Viagem {
  id: string;
  uidUtilizador?: string;
  titulo: string;
  descricao?: string;
  local?: string;
  fotoCapaUrl?: string;
  dataInicio: Date;
  dataFim: Date;
  dias?: Dia[];
  pontosInteresse?: POI[];
  custos?: Custo[];
  colaboradores?: Colaborador[];
  status?: 'planejada' | 'em-andamento' | 'concluida' | 'cancelada';
  criadoEm?: Date;
  atualizadoEm?: Date;
}

/**
 * Dia Model
 * Representa um dia de viagem com atividades e custos associados
 */
export interface Dia {
  id: string;
  titulo?: string;
  descricao?: string;
  data: Date;
  local?: string;
  pontosInteresse?: POI[];
  custos?: Custo[];
  observacoes?: string;
}

/**
 * POI Model
 * Ponto de interesse dentro de uma viagem ou dia
 */
export interface POI {
  id: string;
  nome: string;
  descricao?: string;
  tipo?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  telefone?: string;
  horario?: string;
  url?: string;
  fotoUrl?: string;
  nota?: string;
  custo?: number;
  categoria?: string;
  avaliacao?: number;
  ordem?: number;
}

/**
 * Custo Model
 * Registra despesas ou custos associados à viagem
 */
export interface Custo {
  id: string;
  descricao: string;
  valor: number;
  moeda: string;
  data: Date;
  categoria?: string;
  pagoPor?: Colaborador;
  reembolsavel?: boolean;
}

/**
 * Colaborador Model
 * Representa uma pessoa responsável ou participante da viagem
 */
export interface Colaborador {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  papel?: string;
  avatarUrl?: string;
}
