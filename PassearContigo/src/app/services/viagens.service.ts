import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference
} from '@angular/fire/compat/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dia, Viagem } from '../models/viagem.model';

type ViagemPayload = Omit<Viagem, 'id'>;
type NovaViagem = ViagemPayload & Partial<Pick<Viagem, 'id'>>;
type DataViagem = Date | string;

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

  constructor(private afs: AngularFirestore) {
    this.viagensCollection = this.afs.collection<ViagemPayload>(
      this.collectionName,
      ref => ref.orderBy('dataInicio', 'asc')
    );
  }

  /**
   * Obtem todas as viagens em tempo real.
   */
  getViagens(): Observable<Viagem[]> {
    return this.viagensCollection.snapshotChanges().pipe(
      map(actions =>
        actions.map(action => {
          const data = action.payload.doc.data();
          const id = action.payload.doc.id;

          return { id, ...data };
        })
      )
    );
  }

  /**
   * Obtem uma viagem pelo ID em tempo real.
   */
  getViagemById(id: string): Observable<Viagem | undefined> {
    return this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`)
      .valueChanges()
      .pipe(
        map(data => data ? { id, ...data } : undefined)
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
    const { id, ...payload } = viagem;
    const payloadComDias = this.adicionarDiasSeNecessario(payload);

    if (id) {
      await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).set(payloadComDias);
      return id;
    }

    const docRef: DocumentReference<ViagemPayload> = await this.viagensCollection.add(payloadComDias);
    return docRef.id;
  }

  /**
   * Atualiza os dados de uma viagem existente.
   */
  async updateViagem(id: string, viagem: Partial<Viagem>): Promise<void> {
    const { id: _id, ...payload } = viagem;
    await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).update(payload);
  }

  /**
   * Remove uma viagem pelo ID.
   */
  async deleteViagem(id: string): Promise<void> {
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
}
