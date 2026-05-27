import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference
} from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
   * Obtem uma viagem pelo ID em tempo real, apenas se pertencer ao utilizador autenticado.
   */
  getViagemById(id: string): Observable<Viagem | undefined> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }

        return this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`)
          .valueChanges()
          .pipe(
            map(data => {
              if (!data || data.uidUtilizador !== user.uid) {
                return undefined;
              }

              return { id, ...data };
            })
          );
      })
    );
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
    await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).update({
      ...payload,
      atualizadoEm: new Date()
    });
  }

  /**
   * Remove uma viagem pelo ID.
   */
  async deleteViagem(id: string): Promise<void> {
    await this.garantirViagemDoUtilizadorAtual(id);
    await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).delete();
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

  private normalizarData(data: DataViagem): Date {
    if (data instanceof Date) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    const partesData = data.split('-').map(Number);

    if (partesData.length !== 3 || partesData.some(parte => Number.isNaN(parte))) {
      throw new Error('Data invalida. Use o formato YYYY-MM-DD.');
    }

    const [ano, mes, dia] = partesData;
    return new Date(ano, mes - 1, dia);
  }

  private formatarDataId(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private async obterUidUtilizadorAtual(): Promise<string> {
    const user = await firstValueFrom(this.afAuth.authState);

    if (!user) {
      throw new Error('E necessario iniciar sessao para gerir viagens.');
    }

    return user.uid;
  }

  private async garantirViagemDoUtilizadorAtual(id: string): Promise<void> {
    const uid = await this.obterUidUtilizadorAtual();
    const viagemDoc = await firstValueFrom(
      this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).valueChanges()
    );

    if (!viagemDoc) {
      throw new Error('Viagem nao encontrada.');
    }

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
