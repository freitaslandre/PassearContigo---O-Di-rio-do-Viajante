// app/models/viagem.model.ts | Modelos e tipos TypeScript usados para representar dados da aplicacao.
/**
 * Viagem Model
 * Define a estrutura de uma viagem no app
 */
export interface Viagem {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Executa uma instrucao necessaria para este fluxo.
  uidUtilizador?: string;
  // Define um campo ou opcao de configuracao.
  titulo: string;
  // Executa uma instrucao necessaria para este fluxo.
  descricao?: string;
  // Executa uma instrucao necessaria para este fluxo.
  local?: string;
  // Executa uma instrucao necessaria para este fluxo.
  fotoCapaUrl?: string;
  // Define um campo ou opcao de configuracao.
  dataInicio: Date;
  // Define um campo ou opcao de configuracao.
  dataFim: Date;
  // Executa uma instrucao necessaria para este fluxo.
  fotosAlbum?: FotoAlbumViagem[];
  // Executa uma instrucao necessaria para este fluxo.
  dias?: Dia[];
  // Executa uma instrucao necessaria para este fluxo.
  pontosInteresse?: POI[];
  // Executa uma instrucao necessaria para este fluxo.
  custos?: Custo[];
  // Executa uma instrucao necessaria para este fluxo.
  colaboradores?: Colaborador[];
  // Executa uma instrucao necessaria para este fluxo.
  status?: 'planejada' | 'em-andamento' | 'concluida' | 'cancelada';
  // Executa uma instrucao necessaria para este fluxo.
  publicada?: boolean;
  // Executa uma instrucao necessaria para este fluxo.
  publicacaoId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  visibilidadePublicacao?: VisibilidadePublicacao;
  // Executa uma instrucao necessaria para este fluxo.
  textoPublicacao?: string;
  // Executa uma instrucao necessaria para este fluxo.
  criadoEm?: Date;
  // Executa uma instrucao necessaria para este fluxo.
  atualizadoEm?: Date;
}

// Contrato de dados usado para tipar objetos desta area.
export interface FotoAlbumViagem {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  url: string;
  // Executa uma instrucao necessaria para este fluxo.
  titulo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  legenda?: string;
  // Executa uma instrucao necessaria para este fluxo.
  poiId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  diaId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  poiNome?: string;
  // Executa uma instrucao necessaria para este fluxo.
  dataCaptura?: Date | string;
  // Executa uma instrucao necessaria para este fluxo.
  origem?: 'rolo' | 'capa' | 'poi';
  // Executa uma instrucao necessaria para este fluxo.
  metadados?: Record<string, any>;
}

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type VisibilidadePublicacao = 'publica' | 'amigos' | 'privada';

/**
 * Publicacao Model
 * Representa uma viagem publicada no feed/social da aplicação
 */
export interface Publicacao {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Executa uma instrucao necessaria para este fluxo.
  uidUtilizador?: string;
  // Executa uma instrucao necessaria para este fluxo.
  autorNome?: string;
  // Executa uma instrucao necessaria para este fluxo.
  autorEmail?: string;
  // Executa uma instrucao necessaria para este fluxo.
  autorAvatarUrl?: string;
  // Executa uma instrucao necessaria para este fluxo.
  viagemId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  viagemTitulo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  viagemLocal?: string;
  // Executa uma instrucao necessaria para este fluxo.
  viagemFotoUrl?: string;
  // Executa uma instrucao necessaria para este fluxo.
  texto?: string;
  // Define um campo ou opcao de configuracao.
  visibilidade: VisibilidadePublicacao;
  // Executa uma instrucao necessaria para este fluxo.
  colaboradorUids?: string[];
  // Executa uma instrucao necessaria para este fluxo.
  colaboradorEmails?: string[];
  // Executa uma instrucao necessaria para este fluxo.
  gostos?: number;
  // Executa uma instrucao necessaria para este fluxo.
  comentariosCount?: number;
  // Executa uma instrucao necessaria para este fluxo.
  tags?: string[];
  // Executa uma instrucao necessaria para este fluxo.
  criadoEm?: Date;
  // Executa uma instrucao necessaria para este fluxo.
  atualizadoEm?: Date;
}

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type TipoReacaoPublicacao = 'gosto';

// Contrato de dados usado para tipar objetos desta area.
export interface ReacaoPublicacao {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Executa uma instrucao necessaria para este fluxo.
  uidUtilizador?: string;
  // Executa uma instrucao necessaria para este fluxo.
  autorNome?: string;
  // Executa uma instrucao necessaria para este fluxo.
  autorAvatarUrl?: string;
  // Define um campo ou opcao de configuracao.
  tipo: TipoReacaoPublicacao;
  // Executa uma instrucao necessaria para este fluxo.
  criadoEm?: Date;
}

// Contrato de dados usado para tipar objetos desta area.
export interface ComentarioPublicacao {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Executa uma instrucao necessaria para este fluxo.
  uidUtilizador?: string;
  // Executa uma instrucao necessaria para este fluxo.
  autorNome?: string;
  // Executa uma instrucao necessaria para este fluxo.
  autorAvatarUrl?: string;
  // Define um campo ou opcao de configuracao.
  texto: string;
  // Executa uma instrucao necessaria para este fluxo.
  criadoEm?: Date;
}

/**
 * Dia Model
 * Representa um dia de viagem com atividades e custos associados
 */
export interface Dia {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Executa uma instrucao necessaria para este fluxo.
  titulo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  descricao?: string;
  // Define um campo ou opcao de configuracao.
  data: Date;
  // Executa uma instrucao necessaria para este fluxo.
  local?: string;
  // Executa uma instrucao necessaria para este fluxo.
  pontosInteresse?: POI[];
  // Executa uma instrucao necessaria para este fluxo.
  custos?: Custo[];
  // Executa uma instrucao necessaria para este fluxo.
  observacoes?: string;
}

/**
 * POI Model
 * Ponto de interesse dentro de uma viagem ou dia
 */
export interface POI {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  nome: string;
  // Executa uma instrucao necessaria para este fluxo.
  descricao?: string;
  // Executa uma instrucao necessaria para este fluxo.
  tipo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  endereco?: string;
  // Executa uma instrucao necessaria para este fluxo.
  latitude?: number;
  // Executa uma instrucao necessaria para este fluxo.
  longitude?: number;
  // Executa uma instrucao necessaria para este fluxo.
  telefone?: string;
  // Executa uma instrucao necessaria para este fluxo.
  horario?: string;
  // Executa uma instrucao necessaria para este fluxo.
  url?: string;
  // Executa uma instrucao necessaria para este fluxo.
  fotoUrl?: string;
  // Executa uma instrucao necessaria para este fluxo.
  nota?: string;
  // Executa uma instrucao necessaria para este fluxo.
  custo?: number;
  // Executa uma instrucao necessaria para este fluxo.
  categoria?: string;
  // Executa uma instrucao necessaria para este fluxo.
  avaliacao?: number;
  // Executa uma instrucao necessaria para este fluxo.
  ordem?: number;
  // Executa uma instrucao necessaria para este fluxo.
  colaboradorUid?: string;
  // Executa uma instrucao necessaria para este fluxo.
  colaboradorNome?: string;
  // Executa uma instrucao necessaria para este fluxo.
  colaboradorEmail?: string;
}

/**
 * Custo Model
 * Registra despesas ou custos associados à viagem, dia ou POI
 */
export interface Custo {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Executa uma instrucao necessaria para este fluxo.
  uidUtilizador?: string;
  // Define um campo ou opcao de configuracao.
  descricao: string;
  // Define um campo ou opcao de configuracao.
  valor: number;
  // Define um campo ou opcao de configuracao.
  moeda: string;
  // Define um campo ou opcao de configuracao.
  data: Date;
  // Executa uma instrucao necessaria para este fluxo.
  categoria?: string;
  // Executa uma instrucao necessaria para este fluxo.
  pagoPor?: Colaborador;
  // Executa uma instrucao necessaria para este fluxo.
  reembolsavel?: boolean;
  // Executa uma instrucao necessaria para este fluxo.
  viagemId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  diaId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  poiId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  criadoEm?: Date;
  // Executa uma instrucao necessaria para este fluxo.
  atualizadoEm?: Date;
}

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
export type NivelAcessoColaborador = 'dono' | 'editor' | 'visualizador';

/**
 * Colaborador Model
 * Representa uma pessoa responsável ou participante da viagem
 */
export interface Colaborador {
  // Executa uma instrucao necessaria para este fluxo.
  id?: string;
  // Define um campo ou opcao de configuracao.
  uid: string;
  // Executa uma instrucao necessaria para este fluxo.
  nome?: string;
  // Define um campo ou opcao de configuracao.
  email: string;
  // Executa uma instrucao necessaria para este fluxo.
  telefone?: string;
  // Define um campo ou opcao de configuracao.
  nivelAcesso: NivelAcessoColaborador;
  // Executa uma instrucao necessaria para este fluxo.
  avatarUrl?: string;
}
