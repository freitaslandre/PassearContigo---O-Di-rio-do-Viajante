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
import { Dia, Viagem } from '../models/viagem.model';

type ViagemPayload = Omit<Viagem, 'id'>;
type NovaViagem = ViagemPayload & Partial<Pick<Viagem, 'id'>>;
type DataViagem = Date | string;
type DataOrdenavel = Date | string | { toDate: () => Date };

/**
 * ViagensService
 * Servico responsavel pelo CRUD de viagens na colecao "viagens" do Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class ViagensService {
  private readonly collectionName = 'viagens';
  private readonly viagensCollection: AngularFirestoreCollection<ViagemPayload>;

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    this.viagensCollection = this.afs.collection<ViagemPayload>(this.collectionName);
  }

  /**
   * Obtem em tempo real as viagens do utilizador autenticado.
   */
  getViagens(): Observable<Viagem[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.afs.collection<ViagemPayload>(
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
              .sort((a, b) => this.compararDatas(a.dataInicio, b.dataInicio))
          )
        );
      })
    );
  }

  /**
   * Subscreve às viagens do utilizador autenticado usando onSnapshot do Firestore.
   * Retorna um callback de unsubscribe para cleanup.
   */
  subscribeToViagens(onData: (viagens: Viagem[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      if (!user) {
        onError?.(new Error('E necessario iniciar sessao para gerir viagens.'));
        return;
      }

      try {
        const db = getFirestore();
        const viagensRef = collection(db, this.collectionName);
        const q = query(viagensRef, where('uidUtilizador', '==', user.uid));

        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const viagens: Viagem[] = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data() as ViagemPayload
              }))
              .sort((a, b) => this.compararDatas(a.dataInicio, b.dataInicio));

            onData(viagens);
          },
          (error) => {
            console.error('Erro ao subscrever viagens:', error);
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
   * Subscreve a uma viagem especifica usando onSnapshot do Firestore.
   * Retorna um callback de unsubscribe para cleanup.
   */
  subscribeToViagemById(id: string, onData: (viagem: Viagem | null) => void, onError?: (error: any) => void): Unsubscribe | null {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      onError?.(new Error('E necessario iniciar sessao para gerir viagens.'));
      return null;
    }

    try {
      const db = getFirestore();
      const docRef = doc(db, this.collectionName, id);

      return onSnapshot(
        docRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            onData(null);
            return;
          }

          const data = snapshot.data() as ViagemPayload;

          if (data.uidUtilizador !== user.uid) {
            onError?.(new Error('Esta viagem nao pertence ao utilizador autenticado.'));
            return;
          }

          onData({ id: snapshot.id, ...data });
        },
        (error) => {
          console.error('Erro ao subscrever viagem:', error);
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
   * Obtem uma viagem pelo ID em tempo real, apenas se pertencer ao utilizador autenticado.
   */
  getViagemById(id: string): Observable<Viagem | undefined> {
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
        (snapshot) => {
          if (!snapshot.exists()) {
            observer.next(undefined);
            return;
          }

          const data = snapshot.data() as ViagemPayload;

          if (data.uidUtilizador !== user.uid) {
            observer.error(new Error('Esta viagem nao pertence ao utilizador autenticado.'));
            return;
          }

          observer.next({ id: snapshot.id, ...data });
        },
        (error) => {
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  /**
   * Obtem uma viagem pelo ID uma unica vez.
   */
  async getViagemByIdOnce(id: string): Promise<Viagem | null> {
    const viagem = await firstValueFrom(this.getViagemById(id));
    return viagem ?? null;
  }

  /**
   * Obtem todas as viagens de um utilizador especifico em tempo real.
   */
  getViagensByUid(uid: string): Observable<Viagem[]> {
    return this.afs.collection<ViagemPayload>(
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
          .sort((a, b) => this.compararDatas(a.dataInicio, b.dataInicio))
      )
    );
  }

  /**
   * Gera automaticamente os dias da viagem entre a data de inicio e a data de fim.
   */
  gerarDiasDaViagem(dataInicio: DataViagem, dataFim: DataViagem): Dia[] {
    const inicio = this.normalizarData(dataInicio);
    const fim = this.normalizarData(dataFim);

    if (fim < inicio) {
      throw new Error('A data de fim nao pode ser anterior a data de inicio.');
    }

    const dias: Dia[] = [];
    const dataAtual = new Date(inicio);
    let numeroDia = 1;

    while (dataAtual <= fim) {
      const dataDia = new Date(dataAtual);

      dias.push({
        id: `dia-${this.formatarDataId(dataDia)}`,
        titulo: `Dia ${numeroDia}`,
        data: dataDia,
        pontosInteresse: [],
        custos: []
      });

      dataAtual.setDate(dataAtual.getDate() + 1);
      numeroDia++;
    }

    return dias;
  }

  /**
   * Cria uma nova viagem.
   * Se a viagem ja tiver ID, usa esse ID como documento no Firestore.
   */
  async createViagem(viagem: NovaViagem): Promise<string> {
    const uid = await this.obterUidUtilizadorAtual();
    const { id, ...payload } = viagem;
    const agora = new Date();
    const payloadComUtilizador = this.adicionarDiasSeNecessario({
      ...payload,
      uidUtilizador: uid,
      criadoEm: payload.criadoEm ?? agora,
      atualizadoEm: agora
    });

    if (id) {
      await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).set(payloadComUtilizador);
      return id;
    }

    const docRef: DocumentReference<ViagemPayload> = await this.viagensCollection.add(payloadComUtilizador);
    return docRef.id;
  }

  /**
   * Atualiza os dados de uma viagem existente.
   */
  async updateViagem(id: string, viagem: Partial<Viagem>): Promise<void> {
    await this.garantirViagemDoUtilizadorAtual(id);

    const { id: _id, uidUtilizador: _uidUtilizador, criadoEm: _criadoEm, ...payload } = viagem;
    const payloadLimpo = this.removerUndefined(payload);
    const db = getFirestore();
    const viagemRef = doc(db, this.collectionName, id);

    await updateDoc(viagemRef, {
      ...payloadLimpo,
      atualizadoEm: new Date()
    } as Partial<ViagemPayload>);
  }

  /**
   * Remove uma viagem pelo ID.
   */
  async deleteViagem(id: string): Promise<void> {
    await this.garantirViagemDoUtilizadorAtual(id);

    const db = getFirestore();
    const viagemRef = doc(db, this.collectionName, id);

    await deleteDoc(viagemRef);
  }

  private adicionarDiasSeNecessario(viagem: ViagemPayload): ViagemPayload {
    if (viagem.dias && viagem.dias.length > 0) {
      return viagem;
    }

    return {
      ...viagem,
      dias: this.gerarDiasDaViagem(viagem.dataInicio, viagem.dataFim)
    };
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

  private normalizarData(data: DataViagem): Date {
    if (data instanceof Date) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    if (typeof data === 'string') {
      if (data.includes('T')) {
        const date = new Date(data);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
      const partesData = data.split('-').map(Number);

      if (partesData.length !== 3 || partesData.some(parte => Number.isNaN(parte))) {
        throw new Error('Data invalida. Use o formato YYYY-MM-DD.');
      }

      const [ano, mes, dia] = partesData;
      return new Date(ano, mes - 1, dia);
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      const date = (data as any).toDate();
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    throw new Error('Data invalida. Use o formato YYYY-MM-DD.');
  }

  private formatarDataId(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private async obterUidUtilizadorAtual(): Promise<string> {
    const user = getAuth().currentUser;

    if (!user) {
      throw new Error('E necessario iniciar sessao para gerir viagens.');
    }

    return user.uid;
  }

  private async garantirViagemDoUtilizadorAtual(id: string): Promise<void> {
    const uid = await this.obterUidUtilizadorAtual();
    const db = getFirestore();
    const viagemRef = doc(db, this.collectionName, id);
    const viagemSnapshot = await getDoc(viagemRef);

    if (!viagemSnapshot.exists()) {
      throw new Error('Viagem nao encontrada.');
    }

    const viagemDoc = viagemSnapshot.data() as ViagemPayload;

    if (viagemDoc.uidUtilizador !== uid) {
      throw new Error('Esta viagem nao pertence ao utilizador autenticado.');
    }
  }

  private compararDatas(dataA: DataOrdenavel, dataB: DataOrdenavel): number {
    return this.converterParaTimestamp(dataA) - this.converterParaTimestamp(dataB);
  }

  private converterParaTimestamp(data: DataOrdenavel): number {
    if (data instanceof Date) {
      return data.getTime();
    }

    if (typeof data === 'string') {
      return this.normalizarData(data).getTime();
    }

    return data.toDate().getTime();
  }
}
