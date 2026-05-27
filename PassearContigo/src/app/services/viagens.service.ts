import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference
} from '@angular/fire/compat/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Viagem } from '../models/viagem.model';

type ViagemPayload = Omit<Viagem, 'id'>;
type NovaViagem = ViagemPayload & Partial<Pick<Viagem, 'id'>>;

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
   * Cria uma nova viagem.
   * Se a viagem ja tiver ID, usa esse ID como documento no Firestore.
   */
  async createViagem(viagem: NovaViagem): Promise<string> {
    const { id, ...payload } = viagem;

    if (id) {
      await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).set(payload);
      return id;
    }

    const docRef: DocumentReference<ViagemPayload> = await this.viagensCollection.add(payload);
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
}
