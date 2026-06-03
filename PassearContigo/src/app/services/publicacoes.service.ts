import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference
} from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  Unsubscribe,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  ComentarioPublicacao,
  Publicacao,
  ReacaoPublicacao,
  TipoReacaoPublicacao,
  Viagem
} from '../models/viagem.model';

type PublicacaoPayload = Omit<Publicacao, 'id'>;
type NovaPublicacao = PublicacaoPayload & Partial<Pick<Publicacao, 'id'>>;
type ComentarioPublicacaoPayload = Omit<ComentarioPublicacao, 'id'>;
type ReacaoPublicacaoPayload = Omit<ReacaoPublicacao, 'id'>;

/**
 * PublicacoesService
 * Servico responsavel pelo CRUD de publicacoes no feed social.
 * Req. 15: Gerir publicações de viagens.
 */
@Injectable({
  providedIn: 'root'
})
export class PublicacoesService {
  private readonly collectionName = 'publicacoes';
  private readonly publicacoesCollection: AngularFirestoreCollection<PublicacaoPayload>;

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    this.publicacoesCollection = this.afs.collection<PublicacaoPayload>(this.collectionName);
  }

  /**
   * Obtem em tempo real as publicacoes do utilizador autenticado.
   */
  getMinhasPublicacoes(): Observable<Publicacao[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.afs.collection<PublicacaoPayload>(
          this.collectionName,
          ref => ref.where('uidUtilizador', '==', user.uid)
        ).snapshotChanges().pipe(
          map(actions =>
            actions
              .map(action => ({
                id: action.payload.doc.id,
                ...action.payload.doc.data()
              }))
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
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.afs.collection<PublicacaoPayload>(this.collectionName).snapshotChanges().pipe(
          map(actions =>
            actions
              .map(action => ({
                id: action.payload.doc.id,
                ...action.payload.doc.data()
              }))
              .filter(publicacao => publicacao.visibilidade === 'publica')
              .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm))
          )
        );
      })
    );
  }

  /**
   * Subscreve ao feed de publicacoes usando onSnapshot.
   */
  subscribeToFeedPublicacoes(
    onData: (publicacoes: Publicacao[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      unsubscribeSnapshot?.();
      unsubscribeSnapshot = null;

      if (!user) {
        onData([]);
        return;
      }

      try {
        const db = getFirestore();
        const publicacoesRef = collection(db, this.collectionName);

        unsubscribeSnapshot = onSnapshot(
          publicacoesRef,
          (snapshot) => {
            const publicacoes: Publicacao[] = snapshot.docs
              .map(item => ({
                id: item.id,
                ...item.data() as PublicacaoPayload
              }))
              .filter(publicacao => publicacao.visibilidade === 'publica')
              .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm));

            onData(publicacoes);
          },
          (error) => {
            console.error('Erro ao subscrever publicações:', error);
            onError?.(error);
          }
        );
      } catch (error) {
        console.error('Erro ao configurar subscrição de publicações:', error);
        onError?.(error);
      }
    });

    return () => {
      authUnsubscribe.unsubscribe();
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Subscreve às publicacoes do utilizador autenticado.
   */
  subscribeToMinhasPublicacoes(
    onData: (publicacoes: Publicacao[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      unsubscribeSnapshot?.();
      unsubscribeSnapshot = null;

      if (!user) {
        onError?.(new Error('É necessário iniciar sessão para gerir publicações.'));
        return;
      }

      try {
        const db = getFirestore();
        const publicacoesRef = collection(db, this.collectionName);
        const q = query(publicacoesRef, where('uidUtilizador', '==', user.uid));

        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const publicacoes: Publicacao[] = snapshot.docs
              .map(item => ({
                id: item.id,
                ...item.data() as PublicacaoPayload
              }))
              .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm));

            onData(publicacoes);
          },
          (error) => {
            console.error('Erro ao subscrever publicações do utilizador:', error);
            onError?.(error);
          }
        );
      } catch (error) {
        console.error('Erro ao configurar subscrição de publicações:', error);
        onError?.(error);
      }
    });

    return () => {
      authUnsubscribe.unsubscribe();
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Subscreve às publicacoes associadas a uma viagem.
   */
  subscribeToPublicacoesByViagemId(
    viagemId: string,
    onData: (publicacoes: Publicacao[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      unsubscribeSnapshot?.();
      unsubscribeSnapshot = null;

      if (!user) {
        onError?.(new Error('É necessário iniciar sessão para ver publicações.'));
        return;
      }

      try {
        const db = getFirestore();
        const publicacoesRef = collection(db, this.collectionName);
        const q = query(publicacoesRef, where('viagemId', '==', viagemId));

        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const publicacoes: Publicacao[] = snapshot.docs
              .map(item => ({
                id: item.id,
                ...item.data() as PublicacaoPayload
              }))
              .filter(publicacao => this.utilizadorPodeVerPublicacao(publicacao, user.uid, user.email || ''))
              .sort((a, b) => this.compararDatasDesc(a.criadoEm, b.criadoEm));

            onData(publicacoes);
          },
          (error) => {
            console.error('Erro ao subscrever publicações da viagem:', error);
            onError?.(error);
          }
        );
      } catch (error) {
        console.error('Erro ao configurar subscrição de publicações da viagem:', error);
        onError?.(error);
      }
    });

    return () => {
      authUnsubscribe.unsubscribe();
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Obtem uma publicacao pelo ID em tempo real.
   */
  getPublicacaoById(id: string): Observable<Publicacao | undefined> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }

        const db = getFirestore();
        const docRef = doc(db, this.collectionName, id);

        return new Observable<Publicacao | undefined>(observer => {
          const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
              if (!snapshot.exists()) {
                observer.next(undefined);
                return;
              }

              const publicacao = {
                id: snapshot.id,
                ...snapshot.data() as PublicacaoPayload
              };

              if (!this.utilizadorPodeVerPublicacao(publicacao, user.uid, user.email || '')) {
                observer.error(new Error('Não tem permissão para ver esta publicação.'));
                return;
              }

              observer.next(publicacao);
            },
            (error) => observer.error(error)
          );

          return () => unsubscribe();
        });
      })
    );
  }

  async getPublicacaoByIdOnce(id: string): Promise<Publicacao | null> {
    const publicacao = await firstValueFrom(this.getPublicacaoById(id));
    return publicacao ?? null;
  }

  subscribeToComentariosPublicacao(
    publicacaoId: string,
    onData: (comentarios: ComentarioPublicacao[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    try {
      const db = getFirestore();
      const comentariosRef = collection(db, this.collectionName, publicacaoId, 'comentarios');

      return onSnapshot(
        comentariosRef,
        (snapshot) => {
          const comentarios: ComentarioPublicacao[] = snapshot.docs
            .map(item => ({
              id: item.id,
              ...item.data() as ComentarioPublicacaoPayload
            }))
            .sort((a, b) => this.compararDatasAsc(a.criadoEm, b.criadoEm));

          onData(comentarios);
        },
        (error) => {
          console.error('Erro ao subscrever comentários da publicação:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('Erro ao configurar comentários da publicação:', error);
      onError?.(error);
      return null;
    }
  }

  subscribeToReacoesPublicacao(
    publicacaoId: string,
    onData: (reacoes: ReacaoPublicacao[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    try {
      const db = getFirestore();
      const reacoesRef = collection(db, this.collectionName, publicacaoId, 'reacoes');

      return onSnapshot(
        reacoesRef,
        (snapshot) => {
          const reacoes: ReacaoPublicacao[] = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data() as ReacaoPublicacaoPayload
          }));

          onData(reacoes);
        },
        (error) => {
          console.error('Erro ao subscrever reações da publicação:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('Erro ao configurar reações da publicação:', error);
      onError?.(error);
      return null;
    }
  }

  /**
   * Cria uma nova publicacao.
   */
  async createPublicacao(publicacao: NovaPublicacao): Promise<string> {
    const user = await this.obterUtilizadorAtual();
    const { id, ...payload } = publicacao;
    const agora = new Date();
    const payloadComUtilizador: PublicacaoPayload = this.removerUndefined({
      ...payload,
      visibilidade: payload.visibilidade || 'publica',
      gostos: payload.gostos ?? 0,
      comentariosCount: payload.comentariosCount ?? 0,
      uidUtilizador: user.uid,
      autorNome: payload.autorNome || user.displayName || user.email || 'Utilizador',
      autorEmail: payload.autorEmail || user.email || undefined,
      autorAvatarUrl: payload.autorAvatarUrl || user.photoURL || undefined,
      criadoEm: payload.criadoEm ?? agora,
      atualizadoEm: agora
    });

    if (id) {
      await this.afs.doc<PublicacaoPayload>(`${this.collectionName}/${id}`).set(payloadComUtilizador);
      return id;
    }

    const docRef: DocumentReference<PublicacaoPayload> = await this.publicacoesCollection.add(payloadComUtilizador);
    return docRef.id;
  }

  /**
   * Cria uma publicacao a partir dos dados principais de uma viagem.
   */
  async publicarViagem(viagem: Viagem, texto?: string, visibilidade: Publicacao['visibilidade'] = 'publica'): Promise<string> {
    const publicacaoExistente = await this.getMinhaPublicacaoByViagemIdOnce(viagem.id);
    const publicacao: NovaPublicacao = {
      id: publicacaoExistente?.id,
      viagemId: viagem.id,
      viagemTitulo: viagem.titulo,
      viagemLocal: viagem.local,
      viagemFotoUrl: viagem.fotoCapaUrl,
      texto: texto || viagem.descricao || '',
      visibilidade,
      colaboradorUids: (viagem.colaboradores || []).map(colaborador => colaborador.uid).filter(Boolean),
      colaboradorEmails: (viagem.colaboradores || []).map(colaborador => colaborador.email).filter(Boolean)
    };

    if (publicacaoExistente) {
      await this.updatePublicacao(publicacaoExistente.id, publicacao);
      return publicacaoExistente.id;
    }

    return this.createPublicacao(publicacao);
  }

  async despublicarViagem(viagemId: string): Promise<void> {
    const publicacaoExistente = await this.getMinhaPublicacaoByViagemIdOnce(viagemId);
    if (publicacaoExistente) {
      await this.deletePublicacao(publicacaoExistente.id);
    }
  }

  /**
   * Atualiza uma publicacao existente do utilizador autenticado.
   */
  async updatePublicacao(id: string, publicacao: Partial<Publicacao>): Promise<void> {
    await this.garantirPublicacaoDoUtilizadorAtual(id);

    const {
      id: _id,
      uidUtilizador: _uidUtilizador,
      autorEmail: _autorEmail,
      criadoEm: _criadoEm,
      ...payload
    } = publicacao;
    const payloadLimpo = this.removerUndefined(payload);
    const db = getFirestore();
    const publicacaoRef = doc(db, this.collectionName, id);

    await updateDoc(publicacaoRef, {
      ...payloadLimpo,
      atualizadoEm: new Date()
    } as Partial<PublicacaoPayload>);
  }

  /**
   * Remove uma publicacao do utilizador autenticado.
   */
  async deletePublicacao(id: string): Promise<void> {
    await this.garantirPublicacaoDoUtilizadorAtual(id);

    const db = getFirestore();
    const publicacaoRef = doc(db, this.collectionName, id);

    await deleteDoc(publicacaoRef);
  }

  async incrementarGostos(id: string): Promise<void> {
    const publicacao = await this.getPublicacaoByIdOnce(id);
    if (!publicacao) {
      throw new Error('Publicação não encontrada.');
    }

    const db = getFirestore();
    const publicacaoRef = doc(db, this.collectionName, id);

    await updateDoc(publicacaoRef, {
      gostos: (Number(publicacao.gostos) || 0) + 1,
      atualizadoEm: new Date()
    } as Partial<PublicacaoPayload>);
  }

  async adicionarComentario(publicacaoId: string, texto: string): Promise<void> {
    const user = await this.obterUtilizadorAtual();
    const textoLimpo = texto.trim();

    if (!textoLimpo) {
      throw new Error('Escreva um comentário antes de enviar.');
    }

    await this.garantirPodeInteragirComPublicacao(publicacaoId, user.uid, user.email || '');

    const db = getFirestore();
    const comentariosRef = collection(db, this.collectionName, publicacaoId, 'comentarios');
    const publicacaoRef = doc(db, this.collectionName, publicacaoId);

    await addDoc(comentariosRef, this.removerUndefined({
      uidUtilizador: user.uid,
      autorNome: user.displayName || user.email || 'Utilizador',
      autorAvatarUrl: user.photoURL || undefined,
      texto: textoLimpo,
      criadoEm: new Date()
    }) as ComentarioPublicacaoPayload);

    await updateDoc(publicacaoRef, {
      comentariosCount: increment(1),
      atualizadoEm: new Date()
    } as any);
  }

  async alternarReacao(publicacaoId: string, tipo: TipoReacaoPublicacao = 'gosto'): Promise<void> {
    const user = await this.obterUtilizadorAtual();
    await this.garantirPodeInteragirComPublicacao(publicacaoId, user.uid, user.email || '');

    const db = getFirestore();
    const reacaoRef = doc(db, this.collectionName, publicacaoId, 'reacoes', user.uid);
    const publicacaoRef = doc(db, this.collectionName, publicacaoId);
    const reacaoSnapshot = await getDoc(reacaoRef);

    if (reacaoSnapshot.exists()) {
      await deleteDoc(reacaoRef);
      await updateDoc(publicacaoRef, {
        gostos: increment(-1),
        atualizadoEm: new Date()
      } as any);
      return;
    }

    await setDoc(reacaoRef, this.removerUndefined({
      uidUtilizador: user.uid,
      autorNome: user.displayName || user.email || 'Utilizador',
      autorAvatarUrl: user.photoURL || undefined,
      tipo,
      criadoEm: new Date()
    }) as ReacaoPublicacaoPayload);

    await updateDoc(publicacaoRef, {
      gostos: increment(1),
      atualizadoEm: new Date()
    } as any);
  }

  private async obterUtilizadorAtual(): Promise<NonNullable<ReturnType<typeof getAuth>['currentUser']>> {
    const user = getAuth().currentUser;

    if (!user) {
      throw new Error('É necessário iniciar sessão para gerir publicações.');
    }

    return user;
  }

  private async garantirPublicacaoDoUtilizadorAtual(id: string): Promise<void> {
    const user = await this.obterUtilizadorAtual();
    const db = getFirestore();
    const publicacaoRef = doc(db, this.collectionName, id);
    const publicacaoSnapshot = await getDoc(publicacaoRef);

    if (!publicacaoSnapshot.exists()) {
      throw new Error('Publicação não encontrada.');
    }

    const publicacao = publicacaoSnapshot.data() as PublicacaoPayload;
    if (publicacao.uidUtilizador !== user.uid) {
      throw new Error('Esta publicação não pertence ao utilizador autenticado.');
    }
  }

  private async garantirPodeInteragirComPublicacao(id: string, uid: string, email: string): Promise<void> {
    const db = getFirestore();
    const publicacaoRef = doc(db, this.collectionName, id);
    const publicacaoSnapshot = await getDoc(publicacaoRef);

    if (!publicacaoSnapshot.exists()) {
      throw new Error('Publicação não encontrada.');
    }

    const publicacao = {
      id: publicacaoSnapshot.id,
      ...publicacaoSnapshot.data() as PublicacaoPayload
    };

    if (!this.utilizadorPodeVerPublicacao(publicacao, uid, email)) {
      throw new Error('Não tem permissão para interagir com esta publicação.');
    }
  }

  private async getMinhaPublicacaoByViagemIdOnce(viagemId: string): Promise<Publicacao | null> {
    const user = await this.obterUtilizadorAtual();
    const db = getFirestore();
    const publicacoesRef = collection(db, this.collectionName);
    const q = query(
      publicacoesRef,
      where('uidUtilizador', '==', user.uid),
      where('viagemId', '==', viagemId)
    );
    const snapshot = await getDocs(q);
    const documento = snapshot.docs[0];

    if (!documento) {
      return null;
    }

    return {
      id: documento.id,
      ...documento.data() as PublicacaoPayload
    };
  }

  private utilizadorPodeVerPublicacao(publicacao: Publicacao, uid: string, email: string): boolean {
    if (publicacao.uidUtilizador === uid) {
      return true;
    }

    if (publicacao.visibilidade === 'publica') {
      return true;
    }

    return false;
  }

  private removerUndefined<T>(valor: T): T {
    if (Array.isArray(valor)) {
      return valor.map(item => this.removerUndefined(item)) as T;
    }

    if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
      const objetoLimpo: Record<string, any> = {};

      Object.entries(valor as Record<string, any>).forEach(([chave, item]) => {
        if (item !== undefined) {
          objetoLimpo[chave] = this.removerUndefined(item);
        }
      });

      return objetoLimpo as T;
    }

    return valor;
  }

  private compararDatasDesc(dataA: Date | string | any, dataB: Date | string | any): number {
    return this.converterParaTimestamp(dataB) - this.converterParaTimestamp(dataA);
  }

  private compararDatasAsc(dataA: Date | string | any, dataB: Date | string | any): number {
    return this.converterParaTimestamp(dataA) - this.converterParaTimestamp(dataB);
  }

  private converterParaTimestamp(data: Date | string | any): number {
    if (data instanceof Date) {
      return data.getTime();
    }

    if (typeof data === 'string') {
      return new Date(data).getTime();
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      return data.toDate().getTime();
    }

    return 0;
  }
}
