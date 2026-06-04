// app/models/viagem.model.ts | Modelos e tipos TypeScript usados para representar dados da aplicacao.
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
  publicada?: boolean;
  publicacaoId?: string;
  visibilidadePublicacao?: VisibilidadePublicacao;
  textoPublicacao?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

// Contrato de dados usado para tipar objetos desta area.
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

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type VisibilidadePublicacao = 'publica' | 'amigos' | 'privada';

/**
 * Publicacao Model
 * Representa uma viagem publicada no feed/social da aplicação
 */
export interface Publicacao {
  id: string;
  uidUtilizador?: string;
  autorNome?: string;
  autorEmail?: string;
  autorAvatarUrl?: string;
  viagemId?: string;
  viagemTitulo?: string;
  viagemLocal?: string;
  viagemFotoUrl?: string;
  texto?: string;
  visibilidade: VisibilidadePublicacao;
  colaboradorUids?: string[];
  colaboradorEmails?: string[];
  gostos?: number;
  comentariosCount?: number;
  tags?: string[];
  criadoEm?: Date;
  atualizadoEm?: Date;
}

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type TipoReacaoPublicacao = 'gosto';

// Contrato de dados usado para tipar objetos desta area.
export interface ReacaoPublicacao {
  id: string;
  uidUtilizador?: string;
  autorNome?: string;
  autorAvatarUrl?: string;
  tipo: TipoReacaoPublicacao;
  criadoEm?: Date;
}

// Contrato de dados usado para tipar objetos desta area.
export interface ComentarioPublicacao {
  id: string;
  uidUtilizador?: string;
  autorNome?: string;
  autorAvatarUrl?: string;
  texto: string;
  criadoEm?: Date;
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

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
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
