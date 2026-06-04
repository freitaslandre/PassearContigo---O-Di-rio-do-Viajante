// app/models/trip.model.ts | Modelos e tipos TypeScript usados para representar dados da aplicacao.
export type TipoCusto = 'alojamento' | 'alimentacao' | 'transporte' | 'atividade' | 'outro';

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type PapelColaborador = 'dono' | 'editor' | 'visualizador';

// Contrato de dados usado para tipar objetos desta area.
export interface POI {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  nome: string;
  // Executa uma instrucao necessaria para este fluxo.
  descricao?: string;
  // Executa uma instrucao necessaria para este fluxo.
  morada?: string;
  // Executa uma instrucao necessaria para este fluxo.
  latitude?: number;
  // Executa uma instrucao necessaria para este fluxo.
  longitude?: number;
  // Executa uma instrucao necessaria para este fluxo.
  horaInicio?: string;
  // Executa uma instrucao necessaria para este fluxo.
  horaFim?: string;
  // Executa uma instrucao necessaria para este fluxo.
  concluido?: boolean;
}

// Contrato de dados usado para tipar objetos desta area.
export interface Custo {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  descricao: string;
  // Define um campo ou opcao de configuracao.
  valor: number;
  // Define um campo ou opcao de configuracao.
  moeda: string;
  // Define um campo ou opcao de configuracao.
  tipo: TipoCusto;
  // Executa uma instrucao necessaria para este fluxo.
  pagoPor?: string;
  // Executa uma instrucao necessaria para este fluxo.
  data?: Date;
}

// Contrato de dados usado para tipar objetos desta area.
export interface Colaborador {
  // Define um campo ou opcao de configuracao.
  uid: string;
  // Define um campo ou opcao de configuracao.
  nome: string;
  // Define um campo ou opcao de configuracao.
  email: string;
  // Define um campo ou opcao de configuracao.
  papel: PapelColaborador;
}

// Contrato de dados usado para tipar objetos desta area.
export interface Dia {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  data: Date;
  // Executa uma instrucao necessaria para este fluxo.
  titulo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  notas?: string;
  // Define um campo ou opcao de configuracao.
  pois: POI[];
  // Executa uma instrucao necessaria para este fluxo.
  custos?: Custo[];
}

// Contrato de dados usado para tipar objetos desta area.
export interface Viagem {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  titulo: string;
  // Executa uma instrucao necessaria para este fluxo.
  descricao?: string;
  // Define um campo ou opcao de configuracao.
  destino: string;
  // Define um campo ou opcao de configuracao.
  dataInicio: Date;
  // Define um campo ou opcao de configuracao.
  dataFim: Date;
  // Executa uma instrucao necessaria para este fluxo.
  capaUrl?: string;
  // Define um campo ou opcao de configuracao.
  dias: Dia[];
  // Executa uma instrucao necessaria para este fluxo.
  custos?: Custo[];
  // Executa uma instrucao necessaria para este fluxo.
  colaboradores?: Colaborador[];
  // Executa uma instrucao necessaria para este fluxo.
  criadoPor?: string;
  // Executa uma instrucao necessaria para este fluxo.
  criadoEm?: Date;
  // Executa uma instrucao necessaria para este fluxo.
  atualizadoEm?: Date;
}

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type Trip = Viagem;
// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type Activity = POI;

