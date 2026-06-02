export type TipoCusto = 'alojamento' | 'alimentacao' | 'transporte' | 'atividade' | 'outro';

export type PapelColaborador = 'dono' | 'editor' | 'visualizador';

export interface POI {
  id: string;
  nome: string;
  descricao?: string;
  morada?: string;
  latitude?: number;
  longitude?: number;
  horaInicio?: string;
  horaFim?: string;
  concluido?: boolean;
}

export interface Custo {
  id: string;
  descricao: string;
  valor: number;
  moeda: string;
  tipo: TipoCusto;
  pagoPor?: string;
  data?: Date;
}

export interface Colaborador {
  uid: string;
  nome: string;
  email: string;
  papel: PapelColaborador;
}

export interface Dia {
  id: string;
  data: Date;
  titulo?: string;
  notas?: string;
  pois: POI[];
  custos?: Custo[];
}

export interface Viagem {
  id: string;
  titulo: string;
  descricao?: string;
  destino: string;
  dataInicio: Date;
  dataFim: Date;
  capaUrl?: string;
  dias: Dia[];
  custos?: Custo[];
  colaboradores?: Colaborador[];
  criadoPor?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export type Trip = Viagem;
export type Activity = POI;

