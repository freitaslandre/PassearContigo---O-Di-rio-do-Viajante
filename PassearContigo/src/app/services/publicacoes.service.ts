// app/services/publicacoes.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
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
import {
  // Executa uma instrucao necessaria para este fluxo.
  Unsubscribe,
  // Executa uma instrucao necessaria para este fluxo.
  addDoc,
  // Executa uma instrucao necessaria para este fluxo.
  collection,
  // Executa uma instrucao necessaria para este fluxo.
  deleteDoc,
  // Executa uma instrucao necessaria para este fluxo.
  doc,
  // Executa uma instrucao necessaria para este fluxo.
  getDoc,
  // Executa uma instrucao necessaria para este fluxo.
  getDocs,
  // Executa uma instrucao necessaria para este fluxo.
  getFirestore,
  // Executa uma instrucao necessaria para este fluxo.
  increment,
  // Executa uma instrucao necessaria para este fluxo.
  onSnapshot,
  // Executa uma instrucao necessaria para este fluxo.
  query,
  // Executa uma instrucao necessaria para este fluxo.
  setDoc,
  // Executa uma instrucao necessaria para este fluxo.
  updateDoc,
  // Executa uma instrucao necessaria para este fluxo.
  where
// Executa uma instrucao necessaria para este fluxo.
} from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { getAuth } from 'firebase/auth';
// Importa dependencias usadas neste ficheiro.
import {
  // Executa uma instrucao necessaria para este fluxo.
  ComentarioPublicacao,
  // Executa uma instrucao necessaria para este fluxo.
  Publicacao,
  // Executa uma instrucao necessaria para este fluxo.
  ReacaoPublicacao,
  // Executa uma instrucao necessaria para este fluxo.
  TipoReacaoPublicacao,
  // Executa uma instrucao necessaria para este fluxo.
  Viagem
// Executa uma instrucao necessaria para este fluxo.
} from '../models/viagem.model';

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
type PublicacaoPayload = Omit<Publicacao, 'id'>;
// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
type NovaPublicacao = PublicacaoPayload & Partial<Pick<Publicacao, 'id'>>;
// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
type ComentarioPublicacaoPayload = Omit<ComentarioPublicacao, 'id'>;
// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
type ReacaoPublicacaoPayload = Omit<ReacaoPublicacao, 'id'>;

/**
 * PublicacoesService
 * Servico responsavel pelo CRUD de publicacoes no feed social.
 * Req. 15: Gerir publicações de viagens.
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class PublicacoesService {
  // Define um membro interno desta classe.
  private readonly collectionName = 'publicacoes';
  // Define um membro interno desta classe.
  private readonly publicacoesCollection: AngularFirestoreCollection<PublicacaoPayload>;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private afs: AngularFirestore,
    // Define um membro interno desta classe.
    private afAuth: AngularFireAuth
  // Executa uma instrucao necessaria para este fluxo.
  ) {
    // Atualiza ou consulta estado da pagina.
    this.publicacoesCollection = this.afs.collection<PublicacaoPayload>(this.collectionName);
  }

  /**
   * Obtem em tempo real as publicacoes do utilizador autenticado.
   */
  getMinhasPublicacoes(): Observable<Publicacao[]> {
    // Devolve o resultado deste bloco.
    return this.afAuth.authState.pipe(
      // Define um metodo chamado pela pagina ou por outros metodos.
      switchMap(user => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!user) {
          // Devolve o resultado deste bloco.
          return of([]);
        }

        // Devolve o resultado deste bloco.
        return this.afs.collection<PublicacaoPayload>(
          // Atualiza ou consulta estado da pagina.
          this.collectionName,
          // Atribui um valor a esta propriedade.
          ref => ref.where('uidUtilizador', '==', user.uid)
        // Executa uma instrucao necessaria para este fluxo.
        ).snapshotChanges().pipe(
          // Define um metodo chamado pela pagina ou por outros metodos.
          map(actions =>
            // Executa uma instrucao necessaria para este fluxo.
            actions
              // Executa uma instrucao necessaria para este fluxo.
              .map(action => ({
                // Define um campo ou opcao de configuracao.
                id: action.payload.doc.id,
                // Executa uma instrucao necessaria para este fluxo.
                ...action.payload.doc.data()
              }))
              // Executa uma instrucao necessaria para este fluxo.
              .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm))
          )
        );
      })
    );
  }

  /**
   * Obtem publicacoes publicas do feed.
   */
  getFeedPublicacoes(): Observable<Publicacao[]> {
    // Devolve o resultado deste bloco.
    return this.afs.collection<PublicacaoPayload>(this.collectionName).snapshotChanges().pipe(
      // Define um metodo chamado pela pagina ou por outros metodos.
      map(actions =>
        // Executa uma instrucao necessaria para este fluxo.
        actions
          // Executa uma instrucao necessaria para este fluxo.
          .map(action => ({
            // Define um campo ou opcao de configuracao.
            id: action.payload.doc.id,
            // Executa uma instrucao necessaria para este fluxo.
            ...action.payload.doc.data()
          }))
          // Executa uma instrucao necessaria para este fluxo.
          .filter(publicacao => publicacao.visibilidade === 'publica')
          // Executa uma instrucao necessaria para este fluxo.
          .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm))
      )
    );
  }

  /**
   * Subscreve ao feed de publicacoes usando onSnapshot.
   */
  subscribeToFeedPublicacoes(
    // Define um campo ou opcao de configuracao.
    onData: (publicacoes: Publicacao[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const db = getFirestore();
      // Cria uma variavel local para esta operacao.
      const publicacoesRef = collection(db, this.collectionName);

      // Cria uma variavel local para esta operacao.
      const unsubscribeSnapshot = onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        publicacoesRef,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot) => {
          // Cria uma variavel local para esta operacao.
          const publicacoes: Publicacao[] = snapshot.docs
            // Executa uma instrucao necessaria para este fluxo.
            .map(item => ({
              // Define um campo ou opcao de configuracao.
              id: item.id,
              // Executa uma instrucao necessaria para este fluxo.
              ...item.data() as PublicacaoPayload
            }))
            // Executa uma instrucao necessaria para este fluxo.
            .filter(publicacao => publicacao.visibilidade === 'publica')
            // Executa uma instrucao necessaria para este fluxo.
            .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm));

          // Define um metodo chamado pela pagina ou por outros metodos.
          onData(publicacoes);
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error) => {
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao subscrever publicações:', error);
          // Executa uma instrucao necessaria para este fluxo.
          onError?.(error);
        }
      );

      // Devolve o resultado deste bloco.
      return unsubscribeSnapshot;
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao configurar subscrição de publicações:', error);
      // Executa uma instrucao necessaria para este fluxo.
      onError?.(error);
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  /**
   * Subscreve às publicacoes do utilizador autenticado.
   */
  subscribeToMinhasPublicacoes(
    // Define um campo ou opcao de configuracao.
    onData: (publicacoes: Publicacao[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Cria uma variavel local para esta operacao.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
      // Atribui um valor a esta propriedade.
      unsubscribeSnapshot = null;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!user) {
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(new Error('É necessário iniciar sessão para gerir publicações.'));
        // Devolve o resultado deste bloco.
        return;
      }

      // Inicia um bloco protegido contra erros.
      try {
        // Cria uma variavel local para esta operacao.
        const db = getFirestore();
        // Cria uma variavel local para esta operacao.
        const publicacoesRef = collection(db, this.collectionName);
        // Cria uma variavel local para esta operacao.
        const q = query(publicacoesRef, where('uidUtilizador', '==', user.uid));

        // Atribui um valor a esta propriedade.
        unsubscribeSnapshot = onSnapshot(
          // Executa uma instrucao necessaria para este fluxo.
          q,
          // Executa uma instrucao necessaria para este fluxo.
          (snapshot) => {
            // Cria uma variavel local para esta operacao.
            const publicacoes: Publicacao[] = snapshot.docs
              // Executa uma instrucao necessaria para este fluxo.
              .map(item => ({
                // Define um campo ou opcao de configuracao.
                id: item.id,
                // Executa uma instrucao necessaria para este fluxo.
                ...item.data() as PublicacaoPayload
              }))
              // Executa uma instrucao necessaria para este fluxo.
              .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm));

            // Define um metodo chamado pela pagina ou por outros metodos.
            onData(publicacoes);
          },
          // Executa uma instrucao necessaria para este fluxo.
          (error) => {
            // Executa uma instrucao necessaria para este fluxo.
            console.error('Erro ao subscrever publicações do utilizador:', error);
            // Executa uma instrucao necessaria para este fluxo.
            onError?.(error);
          }
        );
      // Executa uma instrucao necessaria para este fluxo.
      } catch (error) {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao configurar subscrição de publicações:', error);
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
   * Subscreve às publicacoes associadas a uma viagem.
   */
  subscribeToPublicacoesByViagemId(
    // Define um campo ou opcao de configuracao.
    viagemId: string,
    // Define um campo ou opcao de configuracao.
    onData: (publicacoes: Publicacao[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Cria uma variavel local para esta operacao.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      // Executa uma instrucao necessaria para este fluxo.
      unsubscribeSnapshot?.();
      // Atribui um valor a esta propriedade.
      unsubscribeSnapshot = null;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!user) {
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(new Error('É necessário iniciar sessão para ver publicações.'));
        // Devolve o resultado deste bloco.
        return;
      }

      // Inicia um bloco protegido contra erros.
      try {
        // Cria uma variavel local para esta operacao.
        const db = getFirestore();
        // Cria uma variavel local para esta operacao.
        const publicacoesRef = collection(db, this.collectionName);
        // Cria uma variavel local para esta operacao.
        const q = query(publicacoesRef, where('viagemId', '==', viagemId));

        // Atribui um valor a esta propriedade.
        unsubscribeSnapshot = onSnapshot(
          // Executa uma instrucao necessaria para este fluxo.
          q,
          // Executa uma instrucao necessaria para este fluxo.
          (snapshot) => {
            // Cria uma variavel local para esta operacao.
            const publicacoes: Publicacao[] = snapshot.docs
              // Executa uma instrucao necessaria para este fluxo.
              .map(item => ({
                // Define um campo ou opcao de configuracao.
                id: item.id,
                // Executa uma instrucao necessaria para este fluxo.
                ...item.data() as PublicacaoPayload
              }))
              // Executa uma instrucao necessaria para este fluxo.
              .filter(publicacao => this.utilizadorPodeVerPublicacao(publicacao, user.uid, user.email || ''))
              // Executa uma instrucao necessaria para este fluxo.
              .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm));

            // Define um metodo chamado pela pagina ou por outros metodos.
            onData(publicacoes);
          },
          // Executa uma instrucao necessaria para este fluxo.
          (error) => {
            // Executa uma instrucao necessaria para este fluxo.
            console.error('Erro ao subscrever publicações da viagem:', error);
            // Executa uma instrucao necessaria para este fluxo.
            onError?.(error);
          }
        );
      // Executa uma instrucao necessaria para este fluxo.
      } catch (error) {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao configurar subscrição de publicações da viagem:', error);
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
   * Obtem uma publicacao pelo ID em tempo real.
   */
  getPublicacaoById(id: string): Observable<Publicacao | undefined> {
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
        return new Observable<Publicacao | undefined>(observer => {
          // Cria uma variavel local para esta operacao.
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
              const publicacao = {
                // Define um campo ou opcao de configuracao.
                id: snapshot.id,
                // Executa uma instrucao necessaria para este fluxo.
                ...snapshot.data() as PublicacaoPayload
              };

              // Define um metodo chamado pela pagina ou por outros metodos.
              if (!this.utilizadorPodeVerPublicacao(publicacao, user.uid, user.email || '')) {
                // Executa uma instrucao necessaria para este fluxo.
                observer.error(new Error('Não tem permissão para ver esta publicação.'));
                // Devolve o resultado deste bloco.
                return;
              }

              // Executa uma instrucao necessaria para este fluxo.
              observer.next(publicacao);
            },
            // Executa uma instrucao necessaria para este fluxo.
            (error) => observer.error(error)
          );

          // Define um metodo chamado pela pagina ou por outros metodos.
          return () => unsubscribe();
        });
      })
    );
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async getPublicacaoByIdOnce(id: string): Promise<Publicacao | null> {
    // Cria uma variavel local para esta operacao.
    const publicacao = await firstValueFrom(this.getPublicacaoById(id));
    // Devolve o resultado deste bloco.
    return publicacao ?? null;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  subscribeToComentariosPublicacao(
    // Define um campo ou opcao de configuracao.
    publicacaoId: string,
    // Define um campo ou opcao de configuracao.
    onData: (comentarios: ComentarioPublicacao[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const db = getFirestore();
      // Cria uma variavel local para esta operacao.
      const comentariosRef = collection(db, this.collectionName, publicacaoId, 'comentarios');

      // Devolve o resultado deste bloco.
      return onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        comentariosRef,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot) => {
          // Cria uma variavel local para esta operacao.
          const comentarios: ComentarioPublicacao[] = snapshot.docs
            // Executa uma instrucao necessaria para este fluxo.
            .map(item => ({
              // Define um campo ou opcao de configuracao.
              id: item.id,
              // Executa uma instrucao necessaria para este fluxo.
              ...item.data() as ComentarioPublicacaoPayload
            }))
            // Executa uma instrucao necessaria para este fluxo.
            .sort((a, b) => this.compararDatasAsc(a.criadoEm, b.criadoEm));

          // Define um metodo chamado pela pagina ou por outros metodos.
          onData(comentarios);
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error) => {
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao subscrever comentários da publicação:', error);
          // Executa uma instrucao necessaria para este fluxo.
          onError?.(error);
        }
      );
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao configurar comentários da publicação:', error);
      // Executa uma instrucao necessaria para este fluxo.
      onError?.(error);
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  subscribeToReacoesPublicacao(
    // Define um campo ou opcao de configuracao.
    publicacaoId: string,
    // Define um campo ou opcao de configuracao.
    onData: (reacoes: ReacaoPublicacao[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const db = getFirestore();
      // Cria uma variavel local para esta operacao.
      const reacoesRef = collection(db, this.collectionName, publicacaoId, 'reacoes');

      // Devolve o resultado deste bloco.
      return onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        reacoesRef,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot) => {
          // Cria uma variavel local para esta operacao.
          const reacoes: ReacaoPublicacao[] = snapshot.docs.map(item => ({
            // Define um campo ou opcao de configuracao.
            id: item.id,
            // Executa uma instrucao necessaria para este fluxo.
            ...item.data() as ReacaoPublicacaoPayload
          }));

          // Define um metodo chamado pela pagina ou por outros metodos.
          onData(reacoes);
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error) => {
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao subscrever reações da publicação:', error);
          // Executa uma instrucao necessaria para este fluxo.
          onError?.(error);
        }
      );
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao configurar reações da publicação:', error);
      // Executa uma instrucao necessaria para este fluxo.
      onError?.(error);
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  /**
   * Cria uma nova publicacao.
   */
  async createPublicacao(publicacao: NovaPublicacao): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const user = await this.obterUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const { id, ...payload } = publicacao;
    // Cria uma variavel local para esta operacao.
    const agora = new Date();
    // Cria uma variavel local para esta operacao.
    const payloadComUtilizador: PublicacaoPayload = this.removerUndefined({
      // Executa uma instrucao necessaria para este fluxo.
      ...payload,
      // Define um campo ou opcao de configuracao.
      visibilidade: payload.visibilidade || 'publica',
      // Define um campo ou opcao de configuracao.
      gostos: payload.gostos ?? 0,
      // Define um campo ou opcao de configuracao.
      comentariosCount: payload.comentariosCount ?? 0,
      // Define um campo ou opcao de configuracao.
      uidUtilizador: user.uid,
      // Define um campo ou opcao de configuracao.
      autorNome: payload.autorNome || user.displayName || user.email || 'Utilizador',
      // Define um campo ou opcao de configuracao.
      autorEmail: payload.autorEmail || user.email || undefined,
      // Define um campo ou opcao de configuracao.
      autorAvatarUrl: payload.autorAvatarUrl || user.photoURL || undefined,
      // Define um campo ou opcao de configuracao.
      criadoEm: payload.criadoEm ?? agora,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: agora
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (id) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.afs.doc<PublicacaoPayload>(`${this.collectionName}/${id}`).set(payloadComUtilizador);
      // Devolve o resultado deste bloco.
      return id;
    }

    // Cria uma variavel local para esta operacao.
    const docRef: DocumentReference<PublicacaoPayload> = await this.publicacoesCollection.add(payloadComUtilizador);
    // Devolve o resultado deste bloco.
    return docRef.id;
  }

  /**
   * Cria uma publicacao a partir dos dados principais de uma viagem.
   */
  async publicarViagem(viagem: Viagem, texto?: string, visibilidade: Publicacao['visibilidade'] = 'publica'): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const publicacaoExistente = await this.getMinhaPublicacaoByViagemIdOnce(viagem.id);
    // Cria uma variavel local para esta operacao.
    const publicacao: NovaPublicacao = {
      // Define um campo ou opcao de configuracao.
      id: publicacaoExistente?.id,
      // Define um campo ou opcao de configuracao.
      viagemId: viagem.id,
      // Define um campo ou opcao de configuracao.
      viagemTitulo: viagem.titulo,
      // Define um campo ou opcao de configuracao.
      viagemLocal: viagem.local,
      // Define um campo ou opcao de configuracao.
      viagemFotoUrl: viagem.fotoCapaUrl,
      // Define um campo ou opcao de configuracao.
      texto: texto || viagem.descricao || '',
      // Executa uma instrucao necessaria para este fluxo.
      visibilidade,
      // Define um campo ou opcao de configuracao.
      colaboradorUids: (viagem.colaboradores || []).map(colaborador => colaborador.uid).filter(Boolean),
      // Define um campo ou opcao de configuracao.
      colaboradorEmails: (viagem.colaboradores || []).map(colaborador => colaborador.email).filter(Boolean)
    };

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (publicacaoExistente) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.updatePublicacao(publicacaoExistente.id, publicacao);
      // Devolve o resultado deste bloco.
      return publicacaoExistente.id;
    }

    // Devolve o resultado deste bloco.
    return this.createPublicacao(publicacao);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async despublicarViagem(viagemId: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const publicacaoExistente = await this.getMinhaPublicacaoByViagemIdOnce(viagemId);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (publicacaoExistente) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.deletePublicacao(publicacaoExistente.id);
    }
  }

  /**
   * Atualiza uma publicacao existente do utilizador autenticado.
   */
  async updatePublicacao(id: string, publicacao: Partial<Publicacao>): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirPublicacaoDoUtilizadorAtual(id);

    // Cria uma variavel local para esta operacao.
    const {
      // Define um campo ou opcao de configuracao.
      id: _id,
      // Define um campo ou opcao de configuracao.
      uidUtilizador: _uidUtilizador,
      // Define um campo ou opcao de configuracao.
      autorEmail: _autorEmail,
      // Define um campo ou opcao de configuracao.
      criadoEm: _criadoEm,
      // Executa uma instrucao necessaria para este fluxo.
      ...payload
    // Executa uma instrucao necessaria para este fluxo.
    } = publicacao;
    // Cria uma variavel local para esta operacao.
    const payloadLimpo = this.removerUndefined(payload);
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const publicacaoRef = doc(db, this.collectionName, id);

    // Aguarda a conclusao de uma operacao assincrona.
    await updateDoc(publicacaoRef, {
      // Executa uma instrucao necessaria para este fluxo.
      ...payloadLimpo,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    } as Partial<PublicacaoPayload>);
  }

  /**
   * Remove uma publicacao do utilizador autenticado.
   */
  async deletePublicacao(id: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirPublicacaoDoUtilizadorAtual(id);

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const publicacaoRef = doc(db, this.collectionName, id);

    // Aguarda a conclusao de uma operacao assincrona.
    await deleteDoc(publicacaoRef);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async incrementarGostos(id: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const publicacao = await this.getPublicacaoByIdOnce(id);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!publicacao) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Publicação não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const publicacaoRef = doc(db, this.collectionName, id);

    // Aguarda a conclusao de uma operacao assincrona.
    await updateDoc(publicacaoRef, {
      // Define um campo ou opcao de configuracao.
      gostos: (Number(publicacao.gostos) || 0) + 1,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    } as Partial<PublicacaoPayload>);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async adicionarComentario(publicacaoId: string, texto: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const user = await this.obterUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const textoLimpo = texto.trim();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!textoLimpo) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Escreva um comentário antes de enviar.');
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirPodeInteragirComPublicacao(publicacaoId, user.uid, user.email || '');

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const comentariosRef = collection(db, this.collectionName, publicacaoId, 'comentarios');
    // Cria uma variavel local para esta operacao.
    const publicacaoRef = doc(db, this.collectionName, publicacaoId);

    // Aguarda a conclusao de uma operacao assincrona.
    await addDoc(comentariosRef, this.removerUndefined({
      // Define um campo ou opcao de configuracao.
      uidUtilizador: user.uid,
      // Define um campo ou opcao de configuracao.
      autorNome: user.displayName || user.email || 'Utilizador',
      // Define um campo ou opcao de configuracao.
      autorAvatarUrl: user.photoURL || undefined,
      // Define um campo ou opcao de configuracao.
      texto: textoLimpo,
      // Define um campo ou opcao de configuracao.
      criadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    }) as ComentarioPublicacaoPayload);

    // Aguarda a conclusao de uma operacao assincrona.
    await updateDoc(publicacaoRef, {
      // Define um campo ou opcao de configuracao.
      comentariosCount: increment(1),
      // Define um campo ou opcao de configuracao.
      atualizadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    } as any);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async alternarReacao(publicacaoId: string, tipo: TipoReacaoPublicacao = 'gosto'): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const user = await this.obterUtilizadorAtual();
    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirPodeInteragirComPublicacao(publicacaoId, user.uid, user.email || '');

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const reacaoRef = doc(db, this.collectionName, publicacaoId, 'reacoes', user.uid);
    // Cria uma variavel local para esta operacao.
    const publicacaoRef = doc(db, this.collectionName, publicacaoId);
    // Cria uma variavel local para esta operacao.
    const reacaoSnapshot = await getDoc(reacaoRef);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (reacaoSnapshot.exists()) {
      // Aguarda a conclusao de uma operacao assincrona.
      await deleteDoc(reacaoRef);
      // Aguarda a conclusao de uma operacao assincrona.
      await updateDoc(publicacaoRef, {
        // Define um campo ou opcao de configuracao.
        gostos: increment(-1),
        // Define um campo ou opcao de configuracao.
        atualizadoEm: new Date()
      // Executa uma instrucao necessaria para este fluxo.
      } as any);
      // Devolve o resultado deste bloco.
      return;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await setDoc(reacaoRef, this.removerUndefined({
      // Define um campo ou opcao de configuracao.
      uidUtilizador: user.uid,
      // Define um campo ou opcao de configuracao.
      autorNome: user.displayName || user.email || 'Utilizador',
      // Define um campo ou opcao de configuracao.
      autorAvatarUrl: user.photoURL || undefined,
      // Executa uma instrucao necessaria para este fluxo.
      tipo,
      // Define um campo ou opcao de configuracao.
      criadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    }) as ReacaoPublicacaoPayload);

    // Aguarda a conclusao de uma operacao assincrona.
    await updateDoc(publicacaoRef, {
      // Define um campo ou opcao de configuracao.
      gostos: increment(1),
      // Define um campo ou opcao de configuracao.
      atualizadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    } as any);
  }

  // Define um membro interno desta classe.
  private async obterUtilizadorAtual(): Promise<NonNullable<ReturnType<typeof getAuth>['currentUser']>> {
    // Cria uma variavel local para esta operacao.
    const user = getAuth().currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para gerir publicações.');
    }

    // Devolve o resultado deste bloco.
    return user;
  }

  // Define um membro interno desta classe.
  private async garantirPublicacaoDoUtilizadorAtual(id: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const user = await this.obterUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const publicacaoRef = doc(db, this.collectionName, id);
    // Cria uma variavel local para esta operacao.
    const publicacaoSnapshot = await getDoc(publicacaoRef);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!publicacaoSnapshot.exists()) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Publicação não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const publicacao = publicacaoSnapshot.data() as PublicacaoPayload;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (publicacao.uidUtilizador !== user.uid) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Esta publicação não pertence ao utilizador autenticado.');
    }
  }

  // Define um membro interno desta classe.
  private async garantirPodeInteragirComPublicacao(id: string, uid: string, email: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const publicacaoRef = doc(db, this.collectionName, id);
    // Cria uma variavel local para esta operacao.
    const publicacaoSnapshot = await getDoc(publicacaoRef);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!publicacaoSnapshot.exists()) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Publicação não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const publicacao = {
      // Define um campo ou opcao de configuracao.
      id: publicacaoSnapshot.id,
      // Executa uma instrucao necessaria para este fluxo.
      ...publicacaoSnapshot.data() as PublicacaoPayload
    };

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.utilizadorPodeVerPublicacao(publicacao, uid, email)) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Não tem permissão para interagir com esta publicação.');
    }
  }

  // Define um membro interno desta classe.
  private async getMinhaPublicacaoByViagemIdOnce(viagemId: string): Promise<Publicacao | null> {
    // Cria uma variavel local para esta operacao.
    const user = await this.obterUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const publicacoesRef = collection(db, this.collectionName);
    // Cria uma variavel local para esta operacao.
    const q = query(
      // Executa uma instrucao necessaria para este fluxo.
      publicacoesRef,
      // Define um metodo chamado pela pagina ou por outros metodos.
      where('uidUtilizador', '==', user.uid),
      // Define um metodo chamado pela pagina ou por outros metodos.
      where('viagemId', '==', viagemId)
    );
    // Cria uma variavel local para esta operacao.
    const snapshot = await getDocs(q);
    // Cria uma variavel local para esta operacao.
    const documento = snapshot.docs[0];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!documento) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      id: documento.id,
      // Executa uma instrucao necessaria para este fluxo.
      ...documento.data() as PublicacaoPayload
    };
  }

  // Define um membro interno desta classe.
  private utilizadorPodeVerPublicacao(publicacao: Publicacao, uid: string, email: string): boolean {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (publicacao.uidUtilizador === uid) {
      // Devolve o resultado deste bloco.
      return true;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (publicacao.visibilidade === 'publica') {
      // Devolve o resultado deste bloco.
      return true;
    }

    // Devolve o resultado deste bloco.
    return false;
  }

  // Define um membro interno desta classe.
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

  // Define um membro interno desta classe.
  private compararDatasDesc(dataA: Date | string | any, dataB: Date | string | any): number {
    // Devolve o resultado deste bloco.
    return this.converterParaTimestamp(dataB) - this.converterParaTimestamp(dataA);
  }

  // Define um membro interno desta classe.
  private compararDatasAsc(dataA: Date | string | any, dataB: Date | string | any): number {
    // Devolve o resultado deste bloco.
    return this.converterParaTimestamp(dataA) - this.converterParaTimestamp(dataB);
  }

  // Define um membro interno desta classe.
  private converterParaTimestamp(data: Date | string | any): number {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data.getTime();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Devolve o resultado deste bloco.
      return new Date(data).getTime();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Devolve o resultado deste bloco.
      return data.toDate().getTime();
    }

    // Devolve o resultado deste bloco.
    return 0;
  }
}
