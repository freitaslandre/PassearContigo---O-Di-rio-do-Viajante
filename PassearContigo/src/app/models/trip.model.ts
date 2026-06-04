// app/models/trip.model.ts | Modelos e tipos TypeScript usados para representar dados da aplicacao.
export type TipoCusto = 'alojamento' | 'alimentacao' | 'transporte' | 'atividade' | 'outro';

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type PapelColaborador = 'dono' | 'editor' | 'visualizador';

// Contrato de dados usado para tipar objetos desta area.
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

// Contrato de dados usado para tipar objetos desta area.
export interface Custo {
  id: string;
  descricao: string;
  valor: number;
  moeda: string;
  tipo: TipoCusto;
  pagoPor?: string;
  data?: Date;
}

// Contrato de dados usado para tipar objetos desta area.
export interface Colaborador {
  uid: string;
  nome: string;
  email: string;
  papel: PapelColaborador;
}

// Contrato de dados usado para tipar objetos desta area.
export interface Dia {
  id: string;
  data: Date;
  titulo?: string;
  notas?: string;
  pois: POI[];
  custos?: Custo[];
}

// Contrato de dados usado para tipar objetos desta area.
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

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type Trip = Viagem;
// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type Activity = POI;

