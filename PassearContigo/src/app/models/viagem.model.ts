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
  fotosAlbum?: FotoAlbumViagem[];
  dias?: Dia[];
  pontosInteresse?: POI[];
  custos?: Custo[];
  colaboradores?: Colaborador[];
  status?: 'planejada' | 'em-andamento' | 'concluida' | 'cancelada';
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export interface FotoAlbumViagem {
  id: string;
  url: string;
  titulo?: string;
  legenda?: string;
  poiId?: string;
  diaId?: string;
  poiNome?: string;
  dataCaptura?: Date | string;
  origem?: 'rolo' | 'capa' | 'poi';
  metadados?: Record<string, any>;
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
  colaboradorUid?: string;
  colaboradorNome?: string;
  colaboradorEmail?: string;
}

/**
 * Custo Model
 * Registra despesas ou custos associados à viagem, dia ou POI
 */
export interface Custo {
  id: string;
  uidUtilizador?: string;
  descricao: string;
  valor: number;
  moeda: string;
  data: Date;
  categoria?: string;
  pagoPor?: Colaborador;
  reembolsavel?: boolean;
  viagemId?: string;
  diaId?: string;
  poiId?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export type NivelAcessoColaborador = 'dono' | 'editor' | 'visualizador';

/**
 * Colaborador Model
 * Representa uma pessoa responsável ou participante da viagem
 */
export interface Colaborador {
  id?: string;
  uid: string;
  nome?: string;
  email: string;
  telefone?: string;
  nivelAcesso: NivelAcessoColaborador;
  avatarUrl?: string;
}
