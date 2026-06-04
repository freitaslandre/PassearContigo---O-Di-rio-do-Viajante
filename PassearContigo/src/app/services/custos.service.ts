// app/services/custos.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
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
import { Custo } from '../models/viagem.model';

// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
type CustoPayload = Omit<Custo, 'id'>;
// Tipo auxiliar usado para tornar as estruturas de dados mais explicitas.
type NovoCusto = CustoPayload & Partial<Pick<Custo, 'id'>>;

/**
 * CustosService
 * Servico responsavel pelo CRUD de custos na colecao "custos" do Firestore.
 * Req. 15: Gerir custos de viagens
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class CustosService {
  // Define um membro interno desta classe.
  private readonly collectionName = 'custos';
  // Define um membro interno desta classe.
  private readonly custosCollection: AngularFirestoreCollection<CustoPayload>;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private afs: AngularFirestore,
    // Define um membro interno desta classe.
    private afAuth: AngularFireAuth
  // Executa uma instrucao necessaria para este fluxo.
  ) {
    // Atualiza ou consulta estado da pagina.
    this.custosCollection = this.afs.collection<CustoPayload>(this.collectionName);
  }

  /**
   * Obtem em tempo real os custos do utilizador autenticado.
   */
  getCustos(): Observable<Custo[]> {
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
        return this.afs.collection<CustoPayload>(
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
              .map(action => {
                // Cria uma variavel local para esta operacao.
                const data = action.payload.doc.data();
                // Cria uma variavel local para esta operacao.
                const id = action.payload.doc.id;

                // Devolve o resultado deste bloco.
                return { id, ...data };
              })
              // Executa uma instrucao necessaria para este fluxo.
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
        return this.afs.collection<CustoPayload>(
          // Atualiza ou consulta estado da pagina.
          this.collectionName,
          // Atribui um valor a esta propriedade.
          ref => ref
            // Executa uma instrucao necessaria para este fluxo.
            .where('uidUtilizador', '==', user.uid)
            // Executa uma instrucao necessaria para este fluxo.
            .where('viagemId', '==', viagemId)
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
        return this.afs.collection<CustoPayload>(
          // Atualiza ou consulta estado da pagina.
          this.collectionName,
          // Atribui um valor a esta propriedade.
          ref => ref
            // Executa uma instrucao necessaria para este fluxo.
            .where('uidUtilizador', '==', user.uid)
            // Executa uma instrucao necessaria para este fluxo.
            .where('poiId', '==', poiId)
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
    // Define um campo ou opcao de configuracao.
    viagemId: string,
    // Define um campo ou opcao de configuracao.
    diaId: string,
    // Executa uma instrucao necessaria para este fluxo.
    poiId?: string
  // Executa uma instrucao necessaria para este fluxo.
  ): Observable<Custo[]> {
    // Devolve o resultado deste bloco.
    return this.afAuth.authState.pipe(
      // Define um metodo chamado pela pagina ou por outros metodos.
      switchMap(user => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!user) {
          // Devolve o resultado deste bloco.
          return of([]);
        }

        // Cria uma variavel local para esta operacao.
        let baseQuery = (ref: any) => ref
          // Executa uma instrucao necessaria para este fluxo.
          .where('uidUtilizador', '==', user.uid)
          // Executa uma instrucao necessaria para este fluxo.
          .where('viagemId', '==', viagemId)
          // Executa uma instrucao necessaria para este fluxo.
          .where('diaId', '==', diaId);

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (poiId) {
          // Atribui um valor a esta propriedade.
          baseQuery = (ref: any) =>
            // Executa uma instrucao necessaria para este fluxo.
            ref
              // Executa uma instrucao necessaria para este fluxo.
              .where('uidUtilizador', '==', user.uid)
              // Executa uma instrucao necessaria para este fluxo.
              .where('viagemId', '==', viagemId)
              // Executa uma instrucao necessaria para este fluxo.
              .where('diaId', '==', diaId)
              // Executa uma instrucao necessaria para este fluxo.
              .where('poiId', '==', poiId);
        }

        // Devolve o resultado deste bloco.
        return this.afs.collection<CustoPayload>(
          // Atualiza ou consulta estado da pagina.
          this.collectionName,
          // Executa uma instrucao necessaria para este fluxo.
          baseQuery
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
    // Cria uma variavel local para esta operacao.
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Cria uma variavel local para esta operacao.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!user) {
        // Executa uma instrucao necessaria para este fluxo.
        onError?.(new Error('É necessário iniciar sessão para gerir custos.'));
        // Devolve o resultado deste bloco.
        return;
      }

      // Inicia um bloco protegido contra erros.
      try {
        // Cria uma variavel local para esta operacao.
        const db = getFirestore();
        // Cria uma variavel local para esta operacao.
        const custosRef = collection(db, this.collectionName);
        // Cria uma variavel local para esta operacao.
        const q = query(custosRef, where('uidUtilizador', '==', user.uid));

        // Atribui um valor a esta propriedade.
        unsubscribeSnapshot = onSnapshot(
          // Executa uma instrucao necessaria para este fluxo.
          q,
          // Executa uma instrucao necessaria para este fluxo.
          (snapshot) => {
            // Cria uma variavel local para esta operacao.
            const custos: Custo[] = snapshot.docs
              // Executa uma instrucao necessaria para este fluxo.
              .map(doc => ({
                // Define um campo ou opcao de configuracao.
                id: doc.id,
                // Executa uma instrucao necessaria para este fluxo.
                ...doc.data() as CustoPayload
              }))
              // Executa uma instrucao necessaria para este fluxo.
              .sort((a, b) => this.compararDatas(a.data, b.data));

            // Define um metodo chamado pela pagina ou por outros metodos.
            onData(custos);
          },
          // Executa uma instrucao necessaria para este fluxo.
          (error) => {
            // Executa uma instrucao necessaria para este fluxo.
            console.error('Erro ao subscrever custos:', error);
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
   * Subscreve a custos de uma viagem especifica usando onSnapshot do Firestore.
   * Retorna um callback de unsubscribe para cleanup.
   */
  subscribeToCustosByViagemId(viagemId: string, onData: (custos: Custo[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    const auth = getAuth();
    // Cria uma variavel local para esta operacao.
    const user = auth.currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      onError?.(new Error('É necessário iniciar sessão para gerir custos.'));
      // Devolve o resultado deste bloco.
      return null;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const db = getFirestore();
      // Cria uma variavel local para esta operacao.
      const custosRef = collection(db, this.collectionName);
      // Cria uma variavel local para esta operacao.
      const q = query(
        // Executa uma instrucao necessaria para este fluxo.
        custosRef,
        // Define um metodo chamado pela pagina ou por outros metodos.
        where('uidUtilizador', '==', user.uid),
        // Define um metodo chamado pela pagina ou por outros metodos.
        where('viagemId', '==', viagemId)
      );

      // Devolve o resultado deste bloco.
      return onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        q,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot: any) => {
          // Cria uma variavel local para esta operacao.
          const custos: Custo[] = snapshot.docs
            // Executa uma instrucao necessaria para este fluxo.
            .map((doc: any) => ({
              // Define um campo ou opcao de configuracao.
              id: doc.id,
              // Executa uma instrucao necessaria para este fluxo.
              ...doc.data() as CustoPayload
            }))
            // Executa uma instrucao necessaria para este fluxo.
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          // Define um metodo chamado pela pagina ou por outros metodos.
          onData(custos);
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error: any) => {
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao subscrever custos:', error);
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
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  /**
   * Subscreve a custos de um dia especifico usando onSnapshot do Firestore.
   */
  subscribeToCustosByDiaId(
    // Define um campo ou opcao de configuracao.
    diaId: string,
    // Define um campo ou opcao de configuracao.
    onData: (custos: Custo[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    const auth = getAuth();
    // Cria uma variavel local para esta operacao.
    const user = auth.currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      onError?.(new Error('É necessário iniciar sessão para gerir custos.'));
      // Devolve o resultado deste bloco.
      return null;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const db = getFirestore();
      // Cria uma variavel local para esta operacao.
      const custosRef = collection(db, this.collectionName);
      // Cria uma variavel local para esta operacao.
      const q = query(
        // Executa uma instrucao necessaria para este fluxo.
        custosRef,
        // Define um metodo chamado pela pagina ou por outros metodos.
        where('uidUtilizador', '==', user.uid),
        // Define um metodo chamado pela pagina ou por outros metodos.
        where('diaId', '==', diaId)
      );

      // Devolve o resultado deste bloco.
      return onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        q,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot: any) => {
          // Cria uma variavel local para esta operacao.
          const custos: Custo[] = snapshot.docs
            // Executa uma instrucao necessaria para este fluxo.
            .map((doc: any) => ({
              // Define um campo ou opcao de configuracao.
              id: doc.id,
              // Executa uma instrucao necessaria para este fluxo.
              ...doc.data() as CustoPayload
            }))
            // Executa uma instrucao necessaria para este fluxo.
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          // Define um metodo chamado pela pagina ou por outros metodos.
          onData(custos);
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error: any) => {
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao subscrever custos do dia:', error);
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
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  /**
   * Subscreve a custos de um POI especifico usando onSnapshot do Firestore.
   */
  subscribeToCustosByPoiId(
    // Define um campo ou opcao de configuracao.
    poiId: string,
    // Define um campo ou opcao de configuracao.
    onData: (custos: Custo[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    const auth = getAuth();
    // Cria uma variavel local para esta operacao.
    const user = auth.currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      onError?.(new Error('É necessário iniciar sessão para gerir custos.'));
      // Devolve o resultado deste bloco.
      return null;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const db = getFirestore();
      // Cria uma variavel local para esta operacao.
      const custosRef = collection(db, this.collectionName);
      // Cria uma variavel local para esta operacao.
      const q = query(
        // Executa uma instrucao necessaria para este fluxo.
        custosRef,
        // Define um metodo chamado pela pagina ou por outros metodos.
        where('uidUtilizador', '==', user.uid),
        // Define um metodo chamado pela pagina ou por outros metodos.
        where('poiId', '==', poiId)
      );

      // Devolve o resultado deste bloco.
      return onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        q,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot: any) => {
          // Cria uma variavel local para esta operacao.
          const custos: Custo[] = snapshot.docs
            // Executa uma instrucao necessaria para este fluxo.
            .map((doc: any) => ({
              // Define um campo ou opcao de configuracao.
              id: doc.id,
              // Executa uma instrucao necessaria para este fluxo.
              ...doc.data() as CustoPayload
            }))
            // Executa uma instrucao necessaria para este fluxo.
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          // Define um metodo chamado pela pagina ou por outros metodos.
          onData(custos);
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error: any) => {
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao subscrever custos do POI:', error);
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
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  /**
   * Subscreve a custos de uma viagem, dia e opcionalmente POI especifico.
   */
  subscribeToCustosByViagemDiaAndPoi(
    // Define um campo ou opcao de configuracao.
    viagemId: string,
    // Define um campo ou opcao de configuracao.
    diaId: string,
    // Define um campo ou opcao de configuracao.
    poiId: string | undefined,
    // Define um campo ou opcao de configuracao.
    onData: (custos: Custo[]) => void,
    // Executa uma instrucao necessaria para este fluxo.
    onError?: (error: any) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Unsubscribe | null {
    // Cria uma variavel local para esta operacao.
    const auth = getAuth();
    // Cria uma variavel local para esta operacao.
    const user = auth.currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      onError?.(new Error('É necessário iniciar sessão para gerir custos.'));
      // Devolve o resultado deste bloco.
      return null;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const db = getFirestore();
      // Cria uma variavel local para esta operacao.
      const custosRef = collection(db, this.collectionName);
      // Cria uma variavel local para esta operacao.
      let q: any;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (poiId) {
        // Atribui um valor a esta propriedade.
        q = query(
          // Executa uma instrucao necessaria para este fluxo.
          custosRef,
          // Define um metodo chamado pela pagina ou por outros metodos.
          where('uidUtilizador', '==', user.uid),
          // Define um metodo chamado pela pagina ou por outros metodos.
          where('viagemId', '==', viagemId),
          // Define um metodo chamado pela pagina ou por outros metodos.
          where('diaId', '==', diaId),
          // Define um metodo chamado pela pagina ou por outros metodos.
          where('poiId', '==', poiId)
        );
      // Executa uma instrucao necessaria para este fluxo.
      } else {
        // Atribui um valor a esta propriedade.
        q = query(
          // Executa uma instrucao necessaria para este fluxo.
          custosRef,
          // Define um metodo chamado pela pagina ou por outros metodos.
          where('uidUtilizador', '==', user.uid),
          // Define um metodo chamado pela pagina ou por outros metodos.
          where('viagemId', '==', viagemId),
          // Define um metodo chamado pela pagina ou por outros metodos.
          where('diaId', '==', diaId)
        );
      }

      // Devolve o resultado deste bloco.
      return onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        q,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot: any) => {
          // Cria uma variavel local para esta operacao.
          const custos: Custo[] = snapshot.docs
            // Executa uma instrucao necessaria para este fluxo.
            .map((doc: any) => ({
              // Define um campo ou opcao de configuracao.
              id: doc.id,
              // Executa uma instrucao necessaria para este fluxo.
              ...doc.data() as CustoPayload
            }))
            // Executa uma instrucao necessaria para este fluxo.
            .sort((a: any, b: any) => this.compararDatas(a.data, b.data));

          // Define um metodo chamado pela pagina ou por outros metodos.
          onData(custos);
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error: any) => {
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao subscrever custos:', error);
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
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  /**
   * Obtem um custo pelo ID em tempo real, apenas se pertencer ao utilizador autenticado.
   */
  getCustoById(id: string): Observable<Custo | undefined> {
    // Cria uma variavel local para esta operacao.
    const auth = getAuth();
    // Cria uma variavel local para esta operacao.
    const user = auth.currentUser;

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
    return new Observable(observer => {
      // Cria uma variavel local para esta operacao.
      const unsubscribe = onSnapshot(
        // Executa uma instrucao necessaria para este fluxo.
        docRef,
        // Executa uma instrucao necessaria para este fluxo.
        (snapshot: any) => {
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (!snapshot.exists()) {
            // Executa uma instrucao necessaria para este fluxo.
            observer.next(undefined);
            // Devolve o resultado deste bloco.
            return;
          }

          // Cria uma variavel local para esta operacao.
          const data = snapshot.data() as CustoPayload;

          // Define um metodo chamado pela pagina ou por outros metodos.
          if (data.uidUtilizador !== user.uid) {
            // Executa uma instrucao necessaria para este fluxo.
            observer.error(new Error('Este custo não pertence ao utilizador autenticado.'));
            // Devolve o resultado deste bloco.
            return;
          }

          // Executa uma instrucao necessaria para este fluxo.
          observer.next({ id: snapshot.id, ...data });
        },
        // Executa uma instrucao necessaria para este fluxo.
        (error: any) => {
          // Executa uma instrucao necessaria para este fluxo.
          observer.error(error);
        }
      );

      // Define um metodo chamado pela pagina ou por outros metodos.
      return () => unsubscribe();
    });
  }

  /**
   * Obtem um custo pelo ID uma unica vez.
   */
  async getCustoByIdOnce(id: string): Promise<Custo | null> {
    // Cria uma variavel local para esta operacao.
    const custo = await firstValueFrom(this.getCustoById(id));
    // Devolve o resultado deste bloco.
    return custo ?? null;
  }

  /**
   * Obtem todos os custos de um utilizador especifico em tempo real.
   */
  getCustosByUid(uid: string): Observable<Custo[]> {
    // Devolve o resultado deste bloco.
    return this.afs.collection<CustoPayload>(
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
          .sort((a, b) => this.compararDatas(a.data, b.data))
      )
    );
  }

  /**
   * Calcula o total de custos para um array de custos.
   */
  calcularTotalCustos(custos: Custo[]): number {
    // Devolve o resultado deste bloco.
    return custos.reduce((total, custo) => total + (custo.valor || 0), 0);
  }

  /**
   * Calcula o total de custos por categoria.
   */
  calcularCustosPorCategoria(custos: Custo[]): Record<string, number> {
    // Devolve o resultado deste bloco.
    return custos.reduce((acc, custo) => {
      // Cria uma variavel local para esta operacao.
      const categoria = custo.categoria || 'Sem categoria';
      // Executa uma instrucao necessaria para este fluxo.
      acc[categoria] = (acc[categoria] || 0) + (custo.valor || 0);
      // Devolve o resultado deste bloco.
      return acc;
    // Executa uma instrucao necessaria para este fluxo.
    }, {} as Record<string, number>);
  }

  /**
   * Cria um novo custo.
   * Se o custo ja tiver ID, usa esse ID como documento no Firestore.
   */
  async createCusto(custo: NovoCusto): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const uid = await this.obterUidUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const { id, ...payload } = custo;
    // Cria uma variavel local para esta operacao.
    const agora = new Date();
    // Cria uma variavel local para esta operacao.
    const payloadComUtilizador: any = {
      // Executa uma instrucao necessaria para este fluxo.
      ...payload,
      // Define um campo ou opcao de configuracao.
      uidUtilizador: uid,
      // Define um campo ou opcao de configuracao.
      criadoEm: payload.criadoEm ?? agora,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: agora
    };

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (id) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.afs.doc<CustoPayload>(`${this.collectionName}/${id}`).set(payloadComUtilizador);
      // Devolve o resultado deste bloco.
      return id;
    }

    // Cria uma variavel local para esta operacao.
    const docRef: DocumentReference<CustoPayload> = await this.custosCollection.add(payloadComUtilizador);
    // Devolve o resultado deste bloco.
    return docRef.id;
  }

  /**
   * Cria um custo associado a um dia especifico.
   */
  async createCustoPorDia(diaId: string, custo: NovoCusto): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const custoComDia: NovoCusto = {
      // Executa uma instrucao necessaria para este fluxo.
      ...custo,
      // Executa uma instrucao necessaria para este fluxo.
      diaId
    };
    // Devolve o resultado deste bloco.
    return this.createCusto(custoComDia);
  }

  /**
   * Cria um custo associado a um POI especifico.
   */
  async createCustoPorPOI(poiId: string, custo: NovoCusto): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const custoComPOI: NovoCusto = {
      // Executa uma instrucao necessaria para este fluxo.
      ...custo,
      // Executa uma instrucao necessaria para este fluxo.
      poiId
    };
    // Devolve o resultado deste bloco.
    return this.createCusto(custoComPOI);
  }

  /**
   * Cria um custo associado a uma viagem, dia e POI.
   */
  async createCustoCompleto(
    // Define um campo ou opcao de configuracao.
    viagemId: string,
    // Define um campo ou opcao de configuracao.
    diaId: string,
    // Define um campo ou opcao de configuracao.
    poiId: string | undefined,
    // Define um campo ou opcao de configuracao.
    custo: NovoCusto
  // Executa uma instrucao necessaria para este fluxo.
  ): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const custoCompleto: NovoCusto = {
      // Executa uma instrucao necessaria para este fluxo.
      ...custo,
      // Executa uma instrucao necessaria para este fluxo.
      viagemId,
      // Executa uma instrucao necessaria para este fluxo.
      diaId,
      // Executa uma instrucao necessaria para este fluxo.
      ...(poiId && { poiId })
    };
    // Devolve o resultado deste bloco.
    return this.createCusto(custoCompleto);
  }

  /**
   * Atualiza os dados de um custo existente.
   */
  async updateCusto(id: string, custo: Partial<Custo>): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirCustoDoUtilizadorAtual(id);

    // Cria uma variavel local para esta operacao.
    const { id: _id, uidUtilizador: _uidUtilizador, criadoEm: _criadoEm, atualizadoEm: _atualizadoEm, ...payload } = custo as any;
    // Cria uma variavel local para esta operacao.
    const payloadLimpo = this.removerUndefined(payload);
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const custoRef = doc(db, this.collectionName, id);

    // Aguarda a conclusao de uma operacao assincrona.
    await updateDoc(custoRef, {
      // Executa uma instrucao necessaria para este fluxo.
      ...payloadLimpo,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: new Date()
    // Executa uma instrucao necessaria para este fluxo.
    } as Partial<CustoPayload>);
  }

  /**
   * Remove um custo pelo ID.
   */
  async deleteCusto(id: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.garantirCustoDoUtilizadorAtual(id);

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const custoRef = doc(db, this.collectionName, id);

    // Aguarda a conclusao de uma operacao assincrona.
    await deleteDoc(custoRef);
  }

  /**
   * Remove multiplos custos pelo array de IDs.
   */
  async deleteCustos(ids: string[]): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await Promise.all(ids.map(id => this.deleteCusto(id)));
  }

  /**
   * Desassocia um custo de um dia.
   */
  async desassociarDia(id: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.updateCusto(id, { diaId: undefined } as any);
  }

  /**
   * Desassocia um custo de um POI.
   */
  async desassociarPoi(id: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.updateCusto(id, { poiId: undefined } as any);
  }

  /**
   * Desassocia um custo de uma viagem.
   */
  async desassociarViagem(id: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.updateCusto(id, { viagemId: undefined } as any);
  }

  /**
   * Move um custo de um dia para outro.
   */
  async moverParaDia(custoId: string, novoDiaId: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.updateCusto(custoId, { diaId: novoDiaId });
  }

  /**
   * Move um custo de um POI para outro.
   */
  async moverParaPOI(custoId: string, novoPoiId: string): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.updateCusto(custoId, { poiId: novoPoiId });
  }

  /**
   * Atualiza custos em lote.
   */
  async updateCustosEmLote(atualizacoes: Array<{ id: string; dados: Partial<Custo> }>): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await Promise.all(atualizacoes.map(({ id, dados }) => this.updateCusto(id, dados)));
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
  private async obterUidUtilizadorAtual(): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const user = getAuth().currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para gerir custos.');
    }

    // Devolve o resultado deste bloco.
    return user.uid;
  }

  // Define um membro interno desta classe.
  private async garantirCustoDoUtilizadorAtual(id: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const uid = await this.obterUidUtilizadorAtual();
    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const custoRef = doc(db, this.collectionName, id);
    // Cria uma variavel local para esta operacao.
    const custoSnapshot = await getDoc(custoRef);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!custoSnapshot.exists()) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Custo não encontrado.');
    }

    // Cria uma variavel local para esta operacao.
    const custoDoc = custoSnapshot.data() as CustoPayload;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (custoDoc.uidUtilizador !== uid) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Este custo não pertence ao utilizador autenticado.');
    }
  }

  // Define um membro interno desta classe.
  private compararDatas(dataA: Date, dataB: Date): number {
    // Devolve o resultado deste bloco.
    return this.converterParaTimestamp(dataA) - this.converterParaTimestamp(dataB);
  }

  // Define um membro interno desta classe.
  private converterParaTimestamp(data: Date | any): number {
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
