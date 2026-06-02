import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference
} from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { getFirestore, collection, query, where, onSnapshot, Unsubscribe, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Custo } from '../models/viagem.model';

type CustoPayload = Omit<Custo, 'id'>;
type NovoCusto = CustoPayload & Partial<Pick<Custo, 'id'>>;

/**
 * CustosService
 * Servico responsavel pelo CRUD de custos na colecao "custos" do Firestore.
 * Req. 15: Gerenciar custos de viagens
 */
@Injectable({
  providedIn: 'root'
})
export class CustosService {
  private readonly collectionName = 'custos';
  private readonly custosCollection: AngularFirestoreCollection<CustoPayload>;

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    this.custosCollection = this.afs.collection<CustoPayload>(this.collectionName);
  }

  /**
   * Obtem em tempo real os custos do utilizador autenticado.
   */
  getCustos(): Observable<Custo[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.afs.collection<CustoPayload>(
          this.collectionName,
          ref => ref.where('uidUtilizador', '==', user.uid)
        ).snapshotChanges().pipe(
          map(actions =>
            actions
              .map(action => {
                const data = action.payload.doc.data();
                const id = action.payload.doc.id;

                return { id, ...data };
              })
              .sort((a, b) => this.compararDatas(a.data, b.data))
          )
        );
      })
    );
  }

  /**
   * Obtem custos filtrados por viagem ID.
   */
  getCustosByViagemId(viagemId: string): Observable<Custo[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.afs.collection<CustoPayload>(
          this.collectionName,
          ref => ref
            .where('uidUtilizador', '==', user.uid)
            .where('viagemId', '==', viagemId)
        ).snapshotChanges().pipe(
          map(actions =>
            actions
              .map(action => {
                const data = action.payload.doc.data();
                const id = action.payload.doc.id;

                return { id, ...data };
              })
              .sort((a, b) => this.compararDatas(a.data, b.data))
          )
        );
      })
    );
  }

  /**
   * Obtem custos filtrados por POI ID.
   */
  getCustosByPoiId(poiId: string): Observable<Custo[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.afs.collection<CustoPayload>(
          this.collectionName,
          ref => ref
            .where('uidUtilizador', '==', user.uid)
            .where('poiId', '==', poiId)
        ).snapshotChanges().pipe(
          map(actions =>
            actions
              .map(action => {
                const data = action.payload.doc.data();
                const id = action.payload.doc.id;

                return { id, ...data };
              })
              .sort((a, b) => this.compararDatas(a.data, b.data))
          )
        );
      })
    );
  }

  /**
   * Obtem custos filtrados por viagem, dia e opcionalmente POI.
   */
  getCustosByViagemDiaAndPoi(
    viagemId: string,
    diaId: string,
    poiId?: string
  ): Observable<Custo[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        let baseQuery = (ref: any) => ref
          .where('uidUtilizador', '==', user.uid)
          .where('viagemId', '==', viagemId)
          .where('diaId', '==', diaId);

        if (poiId) {
          baseQuery = (ref: any) =>
            ref
              .where('uidUtilizador', '==', user.uid)
              .where('viagemId', '==', viagemId)
              .where('diaId', '==', diaId)
              .where('poiId', '==', poiId);
        }

        return this.afs.collection<CustoPayload>(
          this.collectionName,
          baseQuery
        ).snapshotChanges().pipe(
          map(actions =>
            actions
              .map(action => {
                const data = action.payload.doc.data();
                const id = action.payload.doc.id;

                return { id, ...data };
              })
              .sort((a, b) => this.compararDatas(a.data, b.data))
          )
        );
      })
    );
  }

  /**
   * Subscreve aos custos do utilizador autenticado usando onSnapshot do Firestore.
   * Retorna um callback de unsubscribe para cleanup.
   */
  subscribeToCustos(onData: (custos: Custo[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      if (!user) {
        onError?.(new Error('E necessario iniciar sessao para gerir custos.'));
        return;
      }

      try {
        const db = getFirestore();
        const custosRef = collection(db, this.collectionName);
        const q = query(custosRef, where('uidUtilizador', '==', user.uid));

        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const custos: Custo[] = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data() as CustoPayload
              }))
              .sort((a, b) => this.compararDatas(a.data, b.data));

            onData(custos);
          },
          (error) => {
            console.error('Erro ao subscrever custos:', error);
            onError?.(error);
          }
        );
      } catch (error) {
        console.error('Erro ao configurar subscrição:', error);
        onError?.(error);
      }
    });

    return () => {
      authUnsubscribe.unsubscribe();
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Subscreve a custos de uma viagem especifica usando onSnapshot do Firestore.
   * Retorna um callback de unsubscribe para cleanup.
   */
  subscribeToCustosByViagemId(viagemId: string, onData: (custos: Custo[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      onError?.(new Error('E necessario iniciar sessao para gerir custos.'));
      return null;
    }

    try {
      const db = getFirestore();
      const custosRef = collection(db, this.collectionName);
      const q = query(
        custosRef,
        where('uidUtilizador', '==', user.uid),
        where('viagemId', '==', viagemId)
      );

      return onSnapshot(
        q,
        (snapshot: any) => {
          const custos: Custo[] = snapshot.docs
            .map((doc: any) => ({
              id: doc.id,
              ...doc.data() as CustoPayload
            }))
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          onData(custos);
        },
        (error: any) => {
          console.error('Erro ao subscrever custos:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('Erro ao configurar subscrição:', error);
      onError?.(error);
      return null;
    }
  }

  /**
   * Subscreve a custos de um dia especifico usando onSnapshot do Firestore.
   */
  subscribeToCustosByDiaId(
    diaId: string,
    onData: (custos: Custo[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      onError?.(new Error('E necessario iniciar sessao para gerir custos.'));
      return null;
    }

    try {
      const db = getFirestore();
      const custosRef = collection(db, this.collectionName);
      const q = query(
        custosRef,
        where('uidUtilizador', '==', user.uid),
        where('diaId', '==', diaId)
      );

      return onSnapshot(
        q,
        (snapshot: any) => {
          const custos: Custo[] = snapshot.docs
            .map((doc: any) => ({
              id: doc.id,
              ...doc.data() as CustoPayload
            }))
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          onData(custos);
        },
        (error: any) => {
          console.error('Erro ao subscrever custos do dia:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('Erro ao configurar subscrição:', error);
      onError?.(error);
      return null;
    }
  }

  /**
   * Subscreve a custos de um POI especifico usando onSnapshot do Firestore.
   */
  subscribeToCustosByPoiId(
    poiId: string,
    onData: (custos: Custo[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      onError?.(new Error('E necessario iniciar sessao para gerir custos.'));
      return null;
    }

    try {
      const db = getFirestore();
      const custosRef = collection(db, this.collectionName);
      const q = query(
        custosRef,
        where('uidUtilizador', '==', user.uid),
        where('poiId', '==', poiId)
      );

      return onSnapshot(
        q,
        (snapshot: any) => {
          const custos: Custo[] = snapshot.docs
            .map((doc: any) => ({
              id: doc.id,
              ...doc.data() as CustoPayload
            }))
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          onData(custos);
        },
        (error: any) => {
          console.error('Erro ao subscrever custos do POI:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('Erro ao configurar subscrição:', error);
      onError?.(error);
      return null;
    }
  }

  /**
   * Subscreve a custos de uma viagem, dia e opcionalmente POI especifico.
   */
  subscribeToCustosByViagemDiaAndPoi(
    viagemId: string,
    diaId: string,
    poiId: string | undefined,
    onData: (custos: Custo[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe | null {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      onError?.(new Error('E necessario iniciar sessao para gerir custos.'));
      return null;
    }

    try {
      const db = getFirestore();
      const custosRef = collection(db, this.collectionName);
      let q: any;

      if (poiId) {
        q = query(
          custosRef,
          where('uidUtilizador', '==', user.uid),
          where('viagemId', '==', viagemId),
          where('diaId', '==', diaId),
          where('poiId', '==', poiId)
        );
      } else {
        q = query(
          custosRef,
          where('uidUtilizador', '==', user.uid),
          where('viagemId', '==', viagemId),
          where('diaId', '==', diaId)
        );
      }

      return onSnapshot(
        q,
        (snapshot: any) => {
          const custos: Custo[] = snapshot.docs
            .map((doc: any) => ({
              id: doc.id,
              ...doc.data() as CustoPayload
            }))
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          onData(custos);
        },
        (error: any) => {
          console.error('Erro ao subscrever custos:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('Erro ao configurar subscrição:', error);
      onError?.(error);
      return null;
    }
  }

  /**
   * Obtem um custo pelo ID em tempo real, apenas se pertencer ao utilizador autenticado.
   */
  getCustoById(id: string): Observable<Custo | undefined> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return of(undefined);
    }

    const db = getFirestore();
    const docRef = doc(db, this.collectionName, id);

    return new Observable(observer => {
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot: any) => {
          if (!snapshot.exists()) {
            observer.next(undefined);
            return;
          }

          const data = snapshot.data() as CustoPayload;

          if (data.uidUtilizador !== user.uid) {
            observer.error(new Error('Este custo nao pertence ao utilizador autenticado.'));
            return;
          }

          observer.next({ id: snapshot.id, ...data });
        },
        (error: any) => {
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  /**
   * Obtem um custo pelo ID uma unica vez.
   */
  async getCustoByIdOnce(id: string): Promise<Custo | null> {
    const custo = await firstValueFrom(this.getCustoById(id));
    return custo ?? null;
  }

  /**
   * Obtem todos os custos de um utilizador especifico em tempo real.
   */
  getCustosByUid(uid: string): Observable<Custo[]> {
    return this.afs.collection<CustoPayload>(
      this.collectionName,
      ref => ref.where('uidUtilizador', '==', uid)
    ).snapshotChanges().pipe(
      map(actions =>
        actions
          .map(action => {
            const data = action.payload.doc.data();
            const id = action.payload.doc.id;

            return { id, ...data };
          })
          .sort((a, b) => this.compararDatas(a.data, b.data))
      )
    );
  }

  /**
   * Calcula o total de custos para um array de custos.
   */
  calcularTotalCustos(custos: Custo[]): number {
    return custos.reduce((total, custo) => total + (custo.valor || 0), 0);
  }

  /**
   * Calcula o total de custos por categoria.
   */
  calcularCustosPorCategoria(custos: Custo[]): Record<string, number> {
    return custos.reduce((acc, custo) => {
      const categoria = custo.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + (custo.valor || 0);
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Cria um novo custo.
   * Se o custo ja tiver ID, usa esse ID como documento no Firestore.
   */
  async createCusto(custo: NovoCusto): Promise<string> {
    const uid = await this.obterUidUtilizadorAtual();
    const { id, ...payload } = custo;
    const agora = new Date();
    const payloadComUtilizador: any = {
      ...payload,
      uidUtilizador: uid,
      criadoEm: payload.criadoEm ?? agora,
      atualizadoEm: agora
    };

    if (id) {
      await this.afs.doc<CustoPayload>(`${this.collectionName}/${id}`).set(payloadComUtilizador);
      return id;
    }

    const docRef: DocumentReference<CustoPayload> = await this.custosCollection.add(payloadComUtilizador);
    return docRef.id;
  }

  /**
   * Cria um custo associado a um dia especifico.
   */
  async createCustoPorDia(diaId: string, custo: NovoCusto): Promise<string> {
    const custoComDia: NovoCusto = {
      ...custo,
      diaId
    };
    return this.createCusto(custoComDia);
  }

  /**
   * Cria um custo associado a um POI especifico.
   */
  async createCustoPorPOI(poiId: string, custo: NovoCusto): Promise<string> {
    const custoComPOI: NovoCusto = {
      ...custo,
      poiId
    };
    return this.createCusto(custoComPOI);
  }

  /**
   * Cria um custo associado a uma viagem, dia e POI.
   */
  async createCustoCompleto(
    viagemId: string,
    diaId: string,
    poiId: string | undefined,
    custo: NovoCusto
  ): Promise<string> {
    const custoCompleto: NovoCusto = {
      ...custo,
      viagemId,
      diaId,
      ...(poiId && { poiId })
    };
    return this.createCusto(custoCompleto);
  }

  /**
   * Atualiza os dados de um custo existente.
   */
  async updateCusto(id: string, custo: Partial<Custo>): Promise<void> {
    await this.garantirCustoDoUtilizadorAtual(id);

    const { id: _id, uidUtilizador: _uidUtilizador, criadoEm: _criadoEm, atualizadoEm: _atualizadoEm, ...payload } = custo as any;
    const payloadLimpo = this.removerUndefined(payload);
    const db = getFirestore();
    const custoRef = doc(db, this.collectionName, id);

    await updateDoc(custoRef, {
      ...payloadLimpo,
      atualizadoEm: new Date()
    } as Partial<CustoPayload>);
  }

  /**
   * Remove um custo pelo ID.
   */
  async deleteCusto(id: string): Promise<void> {
    await this.garantirCustoDoUtilizadorAtual(id);

    const db = getFirestore();
    const custoRef = doc(db, this.collectionName, id);

    await deleteDoc(custoRef);
  }

  /**
   * Remove multiplos custos pelo array de IDs.
   */
  async deleteCustos(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.deleteCusto(id)));
  }

  /**
   * Desassocia um custo de um dia.
   */
  async desassociarDia(id: string): Promise<void> {
    await this.updateCusto(id, { diaId: undefined } as any);
  }

  /**
   * Desassocia um custo de um POI.
   */
  async desassociarPoi(id: string): Promise<void> {
    await this.updateCusto(id, { poiId: undefined } as any);
  }

  /**
   * Desassocia um custo de uma viagem.
   */
  async desassociarViagem(id: string): Promise<void> {
    await this.updateCusto(id, { viagemId: undefined } as any);
  }

  /**
   * Move um custo de um dia para outro.
   */
  async moverParaDia(custoId: string, novoDiaId: string): Promise<void> {
    await this.updateCusto(custoId, { diaId: novoDiaId });
  }

  /**
   * Move um custo de um POI para outro.
   */
  async moverParaPOI(custoId: string, novoPoiId: string): Promise<void> {
    await this.updateCusto(custoId, { poiId: novoPoiId });
  }

  /**
   * Atualiza custos em lote.
   */
  async updateCustosEmLote(atualizacoes: Array<{ id: string; dados: Partial<Custo> }>): Promise<void> {
    await Promise.all(atualizacoes.map(({ id, dados }) => this.updateCusto(id, dados)));
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

  private async obterUidUtilizadorAtual(): Promise<string> {
    const user = getAuth().currentUser;

    if (!user) {
      throw new Error('E necessario iniciar sessao para gerir custos.');
    }

    return user.uid;
  }

  private async garantirCustoDoUtilizadorAtual(id: string): Promise<void> {
    const uid = await this.obterUidUtilizadorAtual();
    const db = getFirestore();
    const custoRef = doc(db, this.collectionName, id);
    const custoSnapshot = await getDoc(custoRef);

    if (!custoSnapshot.exists()) {
      throw new Error('Custo nao encontrado.');
    }

    const custoDoc = custoSnapshot.data() as CustoPayload;

    if (custoDoc.uidUtilizador !== uid) {
      throw new Error('Este custo nao pertence ao utilizador autenticado.');
    }
  }

  private compararDatas(dataA: Date, dataB: Date): number {
    return this.converterParaTimestamp(dataA) - this.converterParaTimestamp(dataB);
  }

  private converterParaTimestamp(data: Date | any): number {
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
