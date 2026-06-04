// app/services/viagens.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import {
  // Executa uma instrucao necessaria para este fluxo.
  AngularFirestore,
  // Executa uma instrucao necessaria para este fluxo.
  AngularFirestoreCollection,
  // Executa uma instrucao necessaria para este fluxo.
  DocumentReference
// Executa uma instrucao necessaria para este fluxo.
} from '@angular/fire/compat/firestore';
// Importa dependencias usadas neste ficheiro.
import { AngularFireAuth } from '@angular/fire/compat/auth';
// Importa dependencias usadas neste ficheiro.
import { Observable, firstValueFrom, of } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { map, switchMap } from 'rxjs/operators';
// Importa dependencias usadas neste ficheiro.
import { getFirestore, collection, query, where, onSnapshot, Unsubscribe, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { getAuth } from 'firebase/auth';
// Importa dependencias usadas neste ficheiro.
import { Dia, NivelAcessoColaborador, Viagem } from '../models/viagem.model';

// Payload guardado no Firestore: é igual a uma viagem, mas sem o ID do documento.
type ViagemPayload = Omit<Viagem, 'id'>;

// Modelo usado ao criar viagens: pode receber um ID quando queremos controlar o ID do documento.
type NovaViagem = ViagemPayload & Partial<Pick<Viagem, 'id'>>;

// Formatos de data aceites vindos da aplicação, de strings ou de timestamps do Firestore.
type DataViagem = Date | string | { toDate?: () => Date; seconds?: number; _seconds?: number };
// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
type DataOrdenavel = Date | string | { toDate?: () => Date; seconds?: number; _seconds?: number };

// Nível de acesso do utilizador atual; null significa que não tem acesso conhecido.
type NivelAcessoEfetivo = NivelAcessoColaborador | null;

/**
 * ViagensService
 * Serviço responsável pelo CRUD de viagens na coleção "viagens" do Firestore.
 * Também centraliza as regras de acesso, colaboração e ordenação por datas.
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagensService {
  // Nome da coleção usada para guardar todas as viagens.
  private readonly collectionName = 'viagens';

  // Referência tipada à coleção, usada sobretudo para criar documentos.
  private readonly viagensCollection: AngularFirestoreCollection<ViagemPayload>;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private afs: AngularFirestore,
    // Define um membro interno desta classe.
    private afAuth: AngularFireAuth
  // Executa uma instrucao necessaria para este fluxo.
  ) {
    // Atualiza ou consulta estado da pagina.
    this.viagensCollection = this.afs.collection<ViagemPayload>(this.collectionName);
  }

  /**
   * Obtém em tempo real as viagens a que o utilizador autenticado tem acesso direto.
   * Inclui viagens próprias e viagens onde o utilizador é colaborador.
   */
  getViagens(): Observable<Viagem[]> {
    // Devolve o resultado deste bloco.
    return this.afAuth.authState.pipe(
      // Define um metodo chamado pela pagina ou por outros metodos.
      switchMap(user => {
        // Sem sessão iniciada não há viagens visíveis.
        if (!user) {
          // Devolve o resultado deste bloco.
          return of([]);
        }

        // Devolve o resultado deste bloco.
        return this.afs.collection<ViagemPayload>(this.collectionName).snapshotChanges().pipe(
          // Define um metodo chamado pela pagina ou por outros metodos.
          map(actions =>
            // Executa uma instrucao necessaria para este fluxo.
            actions
              // Junta o ID do documento aos dados guardados no Firestore.
              .map(action => {
                // Cria uma variavel local para esta operacao.
                const data = action.payload.doc.data();
                // Cria uma variavel local para esta operacao.
                const id = action.payload.doc.id;

                // Devolve o resultado deste bloco.
                return { id, ...data };
              })
              // Garante que só chegam ao UI viagens permitidas para este utilizador.
              .filter(viagem => this.utilizadorTemAcessoDiretoViagem(viagem, user.uid, user.email || ''))
              // Mostra as viagens por ordem cronológica da data de início.
              .sort((a, b) => this.compararDatas(a.dataInicio, b.dataInicio))
          )
        );
      })
    );
  }

  /**
   * Subscreve às viagens do utilizador autenticado usando onSnapshot do Firestore.
   * Retorna uma função de unsubscribe para limpar a subscrição quando o componente é destruído.
   */
  subscribeToViagens(onData: (viagens: Viagem[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // A subscrição depende do utilizador autenticado; quando muda a sessão, recriamos o listener.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
      // Atribui um valor a esta propriedade.
      unsubscribeSnapshot = null;

      // Se ninguém estiver autenticado, devolvemos uma lista vazia ao componente.
      if (!user) {
        // Define um metodo chamado pela pagina ou por outros metodos.
        onData([]);
        // Devolve o resultado deste bloco.
        return;
      }

      // Inicia um bloco protegido contra erros.
      try {
        // Cria uma variavel local para esta operacao.
        const db = getFirestore();
        // Cria uma variavel local para esta operacao.
        const viagensRef = collection(db, this.collectionName);

        // Atribui um valor a esta propriedade.
        unsubscribeSnapshot = onSnapshot(
          // Executa uma instrucao necessaria para este fluxo.
          viagensRef,
          // Executa uma instrucao necessaria para este fluxo.
          (snapshot) => {
            // Cria uma variavel local para esta operacao.
            const viagens: Viagem[] = snapshot.docs
              // Converte cada documento Firestore para o modelo usado na aplicação.
              .map(doc => ({
                // Define um campo ou opcao de configuracao.
                id: doc.id,
                // Executa uma instrucao necessaria para este fluxo.
                ...doc.data() as ViagemPayload
              }))
              // Mantém apenas viagens próprias ou partilhadas diretamente com o utilizador.
              .filter(viagem => this.utilizadorTemAcessoDiretoViagem(viagem, user.uid, user.email || ''))
              // Executa uma instrucao necessaria para este fluxo.
              .sort((a, b) => this.compararDatas(a.dataInicio, b.dataInicio));

            // Define um metodo chamado pela pagina ou por outros metodos.
            onData(viagens);
          },
          // Executa uma instrucao necessaria para este fluxo.
          (error) => {
            // Executa uma instrucao necessaria para este fluxo.
            console.error('Erro ao subscrever viagens:', error);
            // Executa uma instrucao necessaria para este fluxo.
            onError?.(error);
          }
        );
      // Executa uma instrucao necessaria para este fluxo.
      } catch (error) {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao configurar subscrição:', error);
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(error);
      }
    });

    // Limpa tanto a subscrição de autenticação como a subscrição ativa ao Firestore.
    return () => {
      // Executa uma instrucao necessaria para este fluxo.
      authUnsubscribe.unsubscribe();
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Subscreve a viagens partilhadas/publicadas por outros utilizadores onde
   * o utilizador autenticado aparece como colaborador.
   */
  subscribeToFeedAmigos(onData: (viagens: Viagem[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Tal como nas viagens próprias, o feed tem de acompanhar alterações de sessão.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
      // Atribui um valor a esta propriedade.
      unsubscribeSnapshot = null;

      // O feed de amigos só faz sentido com sessão iniciada.
      if (!user) {
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(new Error('É necessário iniciar sessão para ver o feed.'));
        // Devolve o resultado deste bloco.
        return;
      }

      // Inicia um bloco protegido contra erros.
      try {
        // Cria uma variavel local para esta operacao.
        const db = getFirestore();
        // Cria uma variavel local para esta operacao.
        const viagensRef = collection(db, this.collectionName);

        // Atribui um valor a esta propriedade.
        unsubscribeSnapshot = onSnapshot(
          // Executa uma instrucao necessaria para este fluxo.
          viagensRef,
          // Executa uma instrucao necessaria para este fluxo.
          (snapshot) => {
            // Cria uma variavel local para esta operacao.
            const viagens: Viagem[] = snapshot.docs
              // Executa uma instrucao necessaria para este fluxo.
              .map(doc => ({
                // Define um campo ou opcao de configuracao.
                id: doc.id,
                // Executa uma instrucao necessaria para este fluxo.
                ...doc.data() as ViagemPayload
              }))
              // Filtra viagens de outros utilizadores que foram partilhadas/publicadas.
              .filter(viagem => this.viagemApareceNoFeed(viagem, user.uid, user.email || ''))
              // No feed, as viagens mais recentes aparecem primeiro.
              .sort((a, b) => this.compararDatasDesc(a.atualizadoEm || a.dataInicio, b.atualizadoEm || b.dataInicio));

            // Define um metodo chamado pela pagina ou por outros metodos.
            onData(viagens);
          },
          // Executa uma instrucao necessaria para este fluxo.
          (error) => {
            // Executa uma instrucao necessaria para este fluxo.
            console.error('Erro ao subscrever feed de amigos:', error);
            // Executa uma instrucao necessaria para este fluxo.
            onError?.(error);
          }
        );
      // Executa uma instrucao necessaria para este fluxo.
      } catch (error) {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao configurar feed de amigos:', error);
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(error);
      }
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    return () => {
      // Executa uma instrucao necessaria para este fluxo.
      authUnsubscribe.unsubscribe();
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Subscreve a uma viagem específica usando onSnapshot do Firestore.
   * Retorna uma função de unsubscribe para limpar a subscrição.
   */
  subscribeToViagemById(id: string, onData: (viagem: Viagem | null) => void, onError?: (error: any) => void): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Só abrimos o documento depois de saber quem é o utilizador atual.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
      // Atribui um valor a esta propriedade.
      unsubscribeSnapshot = null;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!user) {
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(new Error('É necessário iniciar sessão para gerir viagens.'));
        // Devolve o resultado deste bloco.
        return;
      }

      // Inicia um bloco protegido contra erros.
      try {
        // Cria uma variavel local para esta operacao.
        const db = getFirestore();
        // Cria uma variavel local para esta operacao.
        const docRef = doc(db, this.collectionName, id);

        // Atribui um valor a esta propriedade.
        unsubscribeSnapshot = onSnapshot(
          // Executa uma instrucao necessaria para este fluxo.
          docRef,
          // Executa uma instrucao necessaria para este fluxo.
          (snapshot) => {
            // Define um metodo chamado pela pagina ou por outros metodos.
            if (!snapshot.exists()) {
              // null permite ao componente distinguir "não existe" de "ainda está a carregar".
              onData(null);
              // Devolve o resultado deste bloco.
              return;
            }

            // Cria uma variavel local para esta operacao.
            const data = snapshot.data() as ViagemPayload;

            // Impede que alguém abra por ID uma viagem sem permissões.
            if (!this.utilizadorPodeAbrirViagem({ id: snapshot.id, ...data }, user.uid, user.email || '')) {
              // Executa uma instrucao necessaria para este fluxo.
              onError?.(new Error('Esta viagem não pertence ao utilizador autenticado.'));
              // Devolve o resultado deste bloco.
              return;
            }

            // Define um metodo chamado pela pagina ou por outros metodos.
            onData({ id: snapshot.id, ...data });
          },
          // Executa uma instrucao necessaria para este fluxo.
          (error) => {
            // Executa uma instrucao necessaria para este fluxo.
            console.error('Erro ao subscrever viagem:', error);
            // Executa uma instrucao necessaria para este fluxo.
            onError?.(error);
          }
        );
      // Executa uma instrucao necessaria para este fluxo.
      } catch (error) {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao configurar subscrição:', error);
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(error);
      }
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    return () => {
      // Executa uma instrucao necessaria para este fluxo.
      authUnsubscribe.unsubscribe();
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Obtém uma viagem pelo ID em tempo real, apenas se o utilizador tiver permissão para a abrir.
   */
  getViagemById(id: string): Observable<Viagem | undefined> {
    // Devolve o resultado deste bloco.
    return this.afAuth.authState.pipe(
      // Define um metodo chamado pela pagina ou por outros metodos.
      switchMap(user => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!user) {
          // Devolve o resultado deste bloco.
          return of(undefined);
        }

        // Cria uma variavel local para esta operacao.
        const db = getFirestore();
        // Cria uma variavel local para esta operacao.
        const docRef = doc(db, this.collectionName, id);

        // Devolve o resultado deste bloco.
        return new Observable<Viagem | undefined>(observer => {
          // Cria um Observable Angular a partir do listener nativo do Firestore.
          const unsubscribe = onSnapshot(
            // Executa uma instrucao necessaria para este fluxo.
            docRef,
            // Executa uma instrucao necessaria para este fluxo.
            (snapshot) => {
              // Define um metodo chamado pela pagina ou por outros metodos.
              if (!snapshot.exists()) {
                // Executa uma instrucao necessaria para este fluxo.
                observer.next(undefined);
                // Devolve o resultado deste bloco.
                return;
              }

              // Cria uma variavel local para esta operacao.
              const data = snapshot.data() as ViagemPayload;

              // A validação fica no serviço para proteger todos os componentes que o usam.
              if (!this.utilizadorPodeAbrirViagem({ id: snapshot.id, ...data }, user.uid, user.email || '')) {
                // Executa uma instrucao necessaria para este fluxo.
                observer.error(new Error('Esta viagem não pertence ao utilizador autenticado.'));
                // Devolve o resultado deste bloco.
                return;
              }

              // Executa uma instrucao necessaria para este fluxo.
              observer.next({ id: snapshot.id, ...data });
            },
            // Executa uma instrucao necessaria para este fluxo.
            (error) => {
              // Executa uma instrucao necessaria para este fluxo.
              observer.error(error);
            }
          );

          // Define um metodo chamado pela pagina ou por outros metodos.
          return () => unsubscribe();
        });
      })
    );
  }

  /**
   * Obtém uma viagem pelo ID uma única vez.
   * Usa o Observable em tempo real e resolve apenas o primeiro valor recebido.
   */
  async getViagemByIdOnce(id: string): Promise<Viagem | null> {
    // Cria uma variavel local para esta operacao.
    const viagem = await firstValueFrom(this.getViagemById(id));
    // Devolve o resultado deste bloco.
    return viagem ?? null;
  }

  /**
   * Obtém todas as viagens de um utilizador específico em tempo real.
   * Útil para ecrãs de perfil ou listagens associadas a um UID concreto.
   */
  getViagensByUid(uid: string): Observable<Viagem[]> {
    // Devolve o resultado deste bloco.
    return this.afs.collection<ViagemPayload>(
      // Atualiza ou consulta estado da pagina.
      this.collectionName,
      // Atribui um valor a esta propriedade.
      ref => ref.where('uidUtilizador', '==', uid)
    // Executa uma instrucao necessaria para este fluxo.
    ).snapshotChanges().pipe(
      // Define um metodo chamado pela pagina ou por outros metodos.
      map(actions =>
        // Executa uma instrucao necessaria para este fluxo.
        actions
          // Executa uma instrucao necessaria para este fluxo.
          .map(action => {
            // Cria uma variavel local para esta operacao.
            const data = action.payload.doc.data();
            // Cria uma variavel local para esta operacao.
            const id = action.payload.doc.id;

            // Devolve o resultado deste bloco.
            return { id, ...data };
          })
          // Executa uma instrucao necessaria para este fluxo.
          .sort((a, b) => this.compararDatas(a.dataInicio, b.dataInicio))
      )
    );
  }

  /**
   * Gera automaticamente os dias da viagem entre a data de início e a data de fim.
   * Cada dia começa sem pontos de interesse nem custos.
   */
  gerarDiasDaViagem(dataInicio: DataViagem, dataFim: DataViagem): Dia[] {
    // Cria uma variavel local para esta operacao.
    const inicio = this.normalizarData(dataInicio);
    // Cria uma variavel local para esta operacao.
    const fim = this.normalizarData(dataFim);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (fim < inicio) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('A data de fim não pode ser anterior à data de início.');
    }

    // Cria uma variavel local para esta operacao.
    const dias: Dia[] = [];
    // Cria uma variavel local para esta operacao.
    const dataAtual = new Date(inicio);
    // Cria uma variavel local para esta operacao.
    let numeroDia = 1;

    // Percorre todos os dias, incluindo o primeiro e o último.
    while (dataAtual <= fim) {
      // Cria uma variavel local para esta operacao.
      const dataDia = new Date(dataAtual);

      // Executa uma instrucao necessaria para este fluxo.
      dias.push({
        // Define um campo ou opcao de configuracao.
        id: `dia-${this.formatarDataId(dataDia)}`,
        // Define um campo ou opcao de configuracao.
        titulo: `Dia ${numeroDia}`,
        // Define um campo ou opcao de configuracao.
        data: dataDia,
        // Define um campo ou opcao de configuracao.
        pontosInteresse: [],
        // Define um campo ou opcao de configuracao.
        custos: []
      });

      // Executa uma instrucao necessaria para este fluxo.
      dataAtual.setDate(dataAtual.getDate() + 1);
      // Executa uma instrucao necessaria para este fluxo.
      numeroDia++;
    }

    // Devolve o resultado deste bloco.
    return dias;
  }

  /**
   * Cria uma nova viagem.
   * Se a viagem já tiver ID, usa esse ID como documento no Firestore.
   */
  async createViagem(viagem: NovaViagem): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const uid = await this.obterUidUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const { id, ...payload } = viagem;
    // Cria uma variavel local para esta operacao.
    const agora = new Date();

    // Garante autoria, datas de auditoria e dias gerados antes de guardar.
    const payloadComUtilizador = this.adicionarDiasSeNecessario({
      // Executa uma instrucao necessaria para este fluxo.
      ...payload,
      // Define um campo ou opcao de configuracao.
      uidUtilizador: uid,
      // Define um campo ou opcao de configuracao.
      criadoEm: payload.criadoEm ?? agora,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: agora
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (id) {
      // Permite criar documentos com ID previsível quando a chamada já o define.
      await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).set(payloadComUtilizador);
      // Devolve o resultado deste bloco.
      return id;
    }

    // Caso normal: o Firestore gera automaticamente o ID do documento.
    const docRef: DocumentReference<ViagemPayload> = await this.viagensCollection.add(payloadComUtilizador);
    // Devolve o resultado deste bloco.
    return docRef.id;
  }

  /**
   * Atualiza os dados de uma viagem existente.
   * Remove campos undefined para evitar erros no Firestore.
   */
  async updateViagem(id: string, viagem: Partial<Viagem>): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirPodeEditarViagem(id, viagem);

    // Estes campos não podem ser alterados através de uma atualização normal.
    const { id: _id, uidUtilizador: _uidUtilizador, criadoEm: _criadoEm, ...payload } = viagem;
    // Cria uma variavel local para esta operacao.
    const payloadLimpo = this.removerUndefined(payload);
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const viagemRef = doc(db, this.collectionName, id);

    // Aguarda a conclusao de uma operacao assincrona.
    await updateDoc(viagemRef, {
      // Executa uma instrucao necessaria para este fluxo.
      ...payloadLimpo,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    } as Partial<ViagemPayload>);
  }

  /**
   * Remove uma viagem pelo ID.
   * Apenas o dono da viagem pode apagar o documento.
   */
  async deleteViagem(id: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirViagemDoUtilizadorAtual(id);

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const viagemRef = doc(db, this.collectionName, id);

    // Aguarda a conclusao de uma operacao assincrona.
    await deleteDoc(viagemRef);
  }

  /**
   * Devolve o nível de acesso do utilizador atualmente autenticado para uma viagem.
   */
  obterNivelAcessoAtual(viagem: Viagem | null | undefined): NivelAcessoEfetivo {
    // Cria uma variavel local para esta operacao.
    const user = getAuth().currentUser;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user || !viagem) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagem.uidUtilizador === user.uid) {
      // Devolve o resultado deste bloco.
      return 'dono';
    }

    // Cria uma variavel local para esta operacao.
    const emailAtual = user.email?.toLowerCase() || '';

    // A correspondência é feita por UID ou por email para cobrir convites sem UID associado.
    const colaborador = (viagem.colaboradores || []).find(item => {
      // Cria uma variavel local para esta operacao.
      const emailColaborador = item.email?.toLowerCase() || '';
      // Devolve o resultado deste bloco.
      return item.uid === user.uid || (!!emailAtual && emailColaborador === emailAtual);
    });

    // Devolve o resultado deste bloco.
    return colaborador?.nivelAcesso || null;
  }

  /**
   * Indica se o utilizador atual pode editar conteúdo da viagem.
   */
  podeEditarViagemAtual(viagem: Viagem | null | undefined): boolean {
    // Cria uma variavel local para esta operacao.
    const nivel = this.obterNivelAcessoAtual(viagem);
    // Devolve o resultado deste bloco.
    return nivel === 'dono' || nivel === 'editor';
  }

  /**
   * Indica se o utilizador atual é o dono e pode gerir opções sensíveis da viagem.
   */
  podeGerirViagemAtual(viagem: Viagem | null | undefined): boolean {
    // Cria uma variavel local para esta operacao.
    const user = getAuth().currentUser;
    // Devolve o resultado deste bloco.
    return !!user && !!viagem && viagem.uidUtilizador === user.uid;
  }

  /**
   * Garante que uma viagem nova tem a lista de dias preenchida.
   */
  private adicionarDiasSeNecessario(viagem: ViagemPayload): ViagemPayload {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagem.dias && viagem.dias.length > 0) {
      // Devolve o resultado deste bloco.
      return viagem;
    }

    // Devolve o resultado deste bloco.
    return {
      // Executa uma instrucao necessaria para este fluxo.
      ...viagem,
      // Define um campo ou opcao de configuracao.
      dias: this.gerarDiasDaViagem(viagem.dataInicio, viagem.dataFim)
    };
  }

  /**
   * Remove campos undefined de objetos/arrays antes de enviar para o Firestore.
   * O Firestore rejeita valores undefined em atualizações.
   */
  private removerUndefined<T>(valor: T): T {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (Array.isArray(valor)) {
      // Devolve o resultado deste bloco.
      return valor.map(item => this.removerUndefined(item)) as T;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
      // Cria uma variavel local para esta operacao.
      const objetoLimpo: Record<string, any> = {};

      // Executa uma instrucao necessaria para este fluxo.
      Object.entries(valor as Record<string, any>).forEach(([chave, item]) => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (item !== undefined) {
          // Executa uma instrucao necessaria para este fluxo.
          objetoLimpo[chave] = this.removerUndefined(item);
        }
      });

      // Devolve o resultado deste bloco.
      return objetoLimpo as T;
    }

    // Devolve o resultado deste bloco.
    return valor;
  }

  /**
   * Converte vários formatos de data para uma Date sem horas/minutos/segundos.
   * Isto evita diferenças de ordenação causadas por fusos horários ou timestamps parciais.
   */
  private normalizarData(data: DataViagem): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Strings ISO com hora são primeiro convertidas para Date.
      if (data.includes('T')) {
        // Cria uma variavel local para esta operacao.
        const date = new Date(data);
        // Devolve o resultado deste bloco.
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }

      // Strings simples devem vir no formato YYYY-MM-DD.
      const partesData = data.split('-').map(Number);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (partesData.length !== 3 || partesData.some(parte => Number.isNaN(parte))) {
        // Executa uma instrucao necessaria para este fluxo.
        throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
      }

      // Cria uma variavel local para esta operacao.
      const [ano, mes, dia] = partesData;
      // Devolve o resultado deste bloco.
      return new Date(ano, mes - 1, dia);
    }

    // Timestamps do Firestore compatíveis com o método toDate().
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Cria uma variavel local para esta operacao.
      const date = (data as any).toDate();
      // Devolve o resultado deste bloco.
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Suporta objetos serializados que guardam segundos em seconds ou _seconds.
    const segundos = data?.seconds ?? data?._seconds;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof segundos === 'number') {
      // Cria uma variavel local para esta operacao.
      const date = new Date(segundos * 1000);
      // Devolve o resultado deste bloco.
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Executa uma instrucao necessaria para este fluxo.
    throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
  }

  /**
   * Formata uma data para usar em IDs de dias, por exemplo dia-2026-06-04.
   */
  private formatarDataId(data: Date): string {
    // Cria uma variavel local para esta operacao.
    const ano = data.getFullYear();
    // Cria uma variavel local para esta operacao.
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    // Cria uma variavel local para esta operacao.
    const dia = String(data.getDate()).padStart(2, '0');

    // Devolve o resultado deste bloco.
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Obtém o UID do utilizador autenticado ou lança erro se não houver sessão.
   */
  private async obterUidUtilizadorAtual(): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const user = getAuth().currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para gerir viagens.');
    }

    // Devolve o resultado deste bloco.
    return user.uid;
  }

  /**
   * Confirma que a viagem pertence ao utilizador atual.
   * Usado em operações restritas ao dono, como apagar.
   */
  private async garantirViagemDoUtilizadorAtual(id: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const uid = await this.obterUidUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const viagemRef = doc(db, this.collectionName, id);
    // Cria uma variavel local para esta operacao.
    const viagemSnapshot = await getDoc(viagemRef);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagemSnapshot.exists()) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Viagem não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const viagemDoc = viagemSnapshot.data() as ViagemPayload;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagemDoc.uidUtilizador !== uid) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Esta viagem não pertence ao utilizador autenticado.');
    }
  }

  /**
   * Confirma que o utilizador atual pode editar a viagem.
   * Editores podem alterar conteúdo, mas só o dono pode gerir colaboração/publicação.
   */
  private async garantirPodeEditarViagem(id: string, alteracoes: Partial<Viagem>): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const user = getAuth().currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para gerir viagens.');
    }

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const viagemRef = doc(db, this.collectionName, id);
    // Cria uma variavel local para esta operacao.
    const viagemSnapshot = await getDoc(viagemRef);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagemSnapshot.exists()) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Viagem não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const viagem = {
      // Define um campo ou opcao de configuracao.
      id: viagemSnapshot.id,
      // Executa uma instrucao necessaria para este fluxo.
      ...viagemSnapshot.data() as ViagemPayload
    };

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagem.uidUtilizador === user.uid) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const emailAtual = user.email?.toLowerCase() || '';

    // Procura permissões de colaborador por UID ou por email.
    const colaborador = (viagem.colaboradores || []).find(item => {
      // Cria uma variavel local para esta operacao.
      const emailColaborador = item.email?.toLowerCase() || '';
      // Devolve o resultado deste bloco.
      return item.uid === user.uid || (!!emailAtual && emailColaborador === emailAtual);
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (colaborador?.nivelAcesso !== 'editor' && colaborador?.nivelAcesso !== 'dono') {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Não tem permissão para editar esta viagem.');
    }

    // Estes campos ficam reservados ao dono da viagem.
    const camposSoDono: Array<keyof Viagem> = [
      // Executa uma instrucao necessaria para este fluxo.
      'colaboradores',
      // Executa uma instrucao necessaria para este fluxo.
      'publicada',
      // Executa uma instrucao necessaria para este fluxo.
      'publicacaoId',
      // Executa uma instrucao necessaria para este fluxo.
      'visibilidadePublicacao',
      // Executa uma instrucao necessaria para este fluxo.
      'textoPublicacao'
    ];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (camposSoDono.some(campo => campo in alteracoes)) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Apenas o dono pode gerir colaboradores ou publicar a viagem.');
    }
  }

  /**
   * Compara datas por ordem ascendente.
   */
  private compararDatas(dataA: DataOrdenavel, dataB: DataOrdenavel): number {
    // Devolve o resultado deste bloco.
    return this.converterParaTimestamp(dataA) - this.converterParaTimestamp(dataB);
  }

  /**
   * Compara datas por ordem descendente.
   */
  private compararDatasDesc(dataA: DataOrdenavel, dataB: DataOrdenavel): number {
    // Devolve o resultado deste bloco.
    return this.converterParaTimestamp(dataB) - this.converterParaTimestamp(dataA);
  }

  /**
   * Converte uma data ordenável para timestamp em milissegundos.
   * Quando o valor não é reconhecido, devolve 0 para manter a ordenação estável.
   */
  private converterParaTimestamp(data: DataOrdenavel): number {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data.getTime();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Devolve o resultado deste bloco.
      return this.normalizarData(data).getTime();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data.toDate === 'function') {
      // Devolve o resultado deste bloco.
      return data.toDate().getTime();
    }

    // Cria uma variavel local para esta operacao.
    const segundos = data?.seconds ?? data?._seconds;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof segundos === 'number') {
      // Devolve o resultado deste bloco.
      return segundos * 1000;
    }

    // Devolve o resultado deste bloco.
    return 0;
  }

  /**
   * Decide se uma viagem deve aparecer no feed de amigos do utilizador.
   */
  private viagemApareceNoFeed(viagem: Viagem, uid: string, email: string): boolean {
    // O feed de amigos não deve mostrar viagens do próprio utilizador.
    if (viagem.uidUtilizador === uid) {
      // Devolve o resultado deste bloco.
      return false;
    }

    // Só colaboradores devem ver viagens partilhadas neste feed.
    if (!this.utilizadorEColaborador(viagem, uid, email)) {
      // Devolve o resultado deste bloco.
      return false;
    }

    // Compatibilidade com campos antigos: "publico" e "publicada".
    const marcadaComoPublicada = (viagem as any).publicada === true || (viagem as any).publico === true;

    // Devolve o resultado deste bloco.
    return marcadaComoPublicada || viagem.status === 'concluida' || viagem.status === 'em-andamento';
  }

  /**
   * Atalho semântico para verificar se um utilizador pode ver uma viagem.
   */
  private utilizadorPodeVerViagem(viagem: Viagem, uid: string, email: string): boolean {
    // Devolve o resultado deste bloco.
    return this.utilizadorPodeAbrirViagem(viagem, uid, email);
  }

  /**
   * Verifica se o utilizador tem acesso direto: dono ou colaborador.
   */
  private utilizadorTemAcessoDiretoViagem(viagem: Viagem, uid: string, email: string): boolean {
    // Devolve o resultado deste bloco.
    return viagem.uidUtilizador === uid || this.utilizadorEColaborador(viagem, uid, email);
  }

  /**
   * Verifica se o utilizador pode abrir a viagem.
   * Viagens públicas também podem ser abertas fora do acesso direto.
   */
  private utilizadorPodeAbrirViagem(viagem: Viagem, uid: string, email: string): boolean {
    // Devolve o resultado deste bloco.
    return this.utilizadorTemAcessoDiretoViagem(viagem, uid, email)
      // Executa uma instrucao necessaria para este fluxo.
      || (viagem.publicada === true && viagem.visibilidadePublicacao === 'publica');
  }

  /**
   * Verifica se o utilizador aparece na lista de colaboradores por UID ou email.
   */
  private utilizadorEColaborador(viagem: Viagem, uid: string, email: string): boolean {
    // Cria uma variavel local para esta operacao.
    const colaboradores = viagem.colaboradores || [];
    // Cria uma variavel local para esta operacao.
    const emailNormalizado = email.toLowerCase();

    // Devolve o resultado deste bloco.
    return colaboradores.some(colaborador =>
      // Executa uma instrucao necessaria para este fluxo.
      colaborador.uid === uid || (!!emailNormalizado && colaborador.email?.toLowerCase() === emailNormalizado)
    );
  }
}
