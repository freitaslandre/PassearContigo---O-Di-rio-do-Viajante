// app/services/viagens.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
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
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagensService {
  // Nome da coleção usada para guardar todas as viagens.
  private readonly collectionName = 'viagens';

  // Referência tipada à coleção, usada sobretudo para criar documentos.
  private readonly viagensCollection: AngularFirestoreCollection<ViagemPayload>;

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    this.viagensCollection = this.afs.collection<ViagemPayload>(this.collectionName);
  }

  /**
   * Obtém em tempo real as viagens a que o utilizador autenticado tem acesso direto.
   * Inclui viagens próprias e viagens onde o utilizador é colaborador.
   */
  getViagens(): Observable<Viagem[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        // Sem sessão iniciada não há viagens visíveis.
        if (!user) {
          return of([]);
        }

        return this.afs.collection<ViagemPayload>(this.collectionName).snapshotChanges().pipe(
          map(actions =>
            actions
              // Junta o ID do documento aos dados guardados no Firestore.
              .map(action => {
                const data = action.payload.doc.data();
                const id = action.payload.doc.id;

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
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // A subscrição depende do utilizador autenticado; quando muda a sessão, recriamos o listener.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      unsubscribeSnapshot?.();
      unsubscribeSnapshot = null;

      // Se ninguém estiver autenticado, devolvemos uma lista vazia ao componente.
      if (!user) {
        onData([]);
        return;
      }

      try {
        const db = getFirestore();
        const viagensRef = collection(db, this.collectionName);

        unsubscribeSnapshot = onSnapshot(
          viagensRef,
          (snapshot) => {
            const viagens: Viagem[] = snapshot.docs
              // Converte cada documento Firestore para o modelo usado na aplicação.
              .map(doc => ({
                id: doc.id,
                ...doc.data() as ViagemPayload
              }))
              // Mantém apenas viagens próprias ou partilhadas diretamente com o utilizador.
              .filter(viagem => this.utilizadorTemAcessoDiretoViagem(viagem, user.uid, user.email || ''))
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

    // Limpa tanto a subscrição de autenticação como a subscrição ativa ao Firestore.
    return () => {
      authUnsubscribe.unsubscribe();
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Subscreve a viagens partilhadas/publicadas por outros utilizadores onde
   * o utilizador autenticado aparece como colaborador.
   */
  subscribeToFeedAmigos(onData: (viagens: Viagem[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Tal como nas viagens próprias, o feed tem de acompanhar alterações de sessão.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      unsubscribeSnapshot?.();
      unsubscribeSnapshot = null;

      // O feed de amigos só faz sentido com sessão iniciada.
      if (!user) {
        onError?.(new Error('É necessário iniciar sessão para ver o feed.'));
        return;
      }

      try {
        const db = getFirestore();
        const viagensRef = collection(db, this.collectionName);

        unsubscribeSnapshot = onSnapshot(
          viagensRef,
          (snapshot) => {
            const viagens: Viagem[] = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data() as ViagemPayload
              }))
              // Filtra viagens de outros utilizadores que foram partilhadas/publicadas.
              .filter(viagem => this.viagemApareceNoFeed(viagem, user.uid, user.email || ''))
              // No feed, as viagens mais recentes aparecem primeiro.
              .sort((a, b) => this.compararDatasDesc(a.atualizadoEm || a.dataInicio, b.atualizadoEm || b.dataInicio));

            onData(viagens);
          },
          (error) => {
            console.error('Erro ao subscrever feed de amigos:', error);
            onError?.(error);
          }
        );
      } catch (error) {
        console.error('Erro ao configurar feed de amigos:', error);
        onError?.(error);
      }
    });

    return () => {
      authUnsubscribe.unsubscribe();
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Subscreve a uma viagem específica usando onSnapshot do Firestore.
   * Retorna uma função de unsubscribe para limpar a subscrição.
   */
  subscribeToViagemById(id: string, onData: (viagem: Viagem | null) => void, onError?: (error: any) => void): Unsubscribe | null {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Só abrimos o documento depois de saber quem é o utilizador atual.
    const authUnsubscribe = this.afAuth.authState.subscribe(user => {
      unsubscribeSnapshot?.();
      unsubscribeSnapshot = null;

      if (!user) {
        onError?.(new Error('É necessário iniciar sessão para gerir viagens.'));
        return;
      }

      try {
        const db = getFirestore();
        const docRef = doc(db, this.collectionName, id);

        unsubscribeSnapshot = onSnapshot(
          docRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              // null permite ao componente distinguir "não existe" de "ainda está a carregar".
              onData(null);
              return;
            }

            const data = snapshot.data() as ViagemPayload;

            // Impede que alguém abra por ID uma viagem sem permissões.
            if (!this.utilizadorPodeAbrirViagem({ id: snapshot.id, ...data }, user.uid, user.email || '')) {
              onError?.(new Error('Esta viagem não pertence ao utilizador autenticado.'));
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
      }
    });

    return () => {
      authUnsubscribe.unsubscribe();
      unsubscribeSnapshot?.();
    };
  }

  /**
   * Obtém uma viagem pelo ID em tempo real, apenas se o utilizador tiver permissão para a abrir.
   */
  getViagemById(id: string): Observable<Viagem | undefined> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }

        const db = getFirestore();
        const docRef = doc(db, this.collectionName, id);

        return new Observable<Viagem | undefined>(observer => {
          // Cria um Observable Angular a partir do listener nativo do Firestore.
          const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
              if (!snapshot.exists()) {
                observer.next(undefined);
                return;
              }

              const data = snapshot.data() as ViagemPayload;

              // A validação fica no serviço para proteger todos os componentes que o usam.
              if (!this.utilizadorPodeAbrirViagem({ id: snapshot.id, ...data }, user.uid, user.email || '')) {
                observer.error(new Error('Esta viagem não pertence ao utilizador autenticado.'));
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
      })
    );
  }

  /**
   * Obtém uma viagem pelo ID uma única vez.
   * Usa o Observable em tempo real e resolve apenas o primeiro valor recebido.
   */
  async getViagemByIdOnce(id: string): Promise<Viagem | null> {
    const viagem = await firstValueFrom(this.getViagemById(id));
    return viagem ?? null;
  }

  /**
   * Obtém todas as viagens de um utilizador específico em tempo real.
   * Útil para ecrãs de perfil ou listagens associadas a um UID concreto.
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
   * Gera automaticamente os dias da viagem entre a data de início e a data de fim.
   * Cada dia começa sem pontos de interesse nem custos.
   */
  gerarDiasDaViagem(dataInicio: DataViagem, dataFim: DataViagem): Dia[] {
    const inicio = this.normalizarData(dataInicio);
    const fim = this.normalizarData(dataFim);

    if (fim < inicio) {
      throw new Error('A data de fim não pode ser anterior à data de início.');
    }

    const dias: Dia[] = [];
    const dataAtual = new Date(inicio);
    let numeroDia = 1;

    // Percorre todos os dias, incluindo o primeiro e o último.
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
   * Se a viagem já tiver ID, usa esse ID como documento no Firestore.
   */
  async createViagem(viagem: NovaViagem): Promise<string> {
    const uid = await this.obterUidUtilizadorAtual();
    const { id, ...payload } = viagem;
    const agora = new Date();

    // Garante autoria, datas de auditoria e dias gerados antes de guardar.
    const payloadComUtilizador = this.adicionarDiasSeNecessario({
      ...payload,
      uidUtilizador: uid,
      criadoEm: payload.criadoEm ?? agora,
      atualizadoEm: agora
    });

    if (id) {
      // Permite criar documentos com ID previsível quando a chamada já o define.
      await this.afs.doc<ViagemPayload>(`${this.collectionName}/${id}`).set(payloadComUtilizador);
      return id;
    }

    // Caso normal: o Firestore gera automaticamente o ID do documento.
    const docRef: DocumentReference<ViagemPayload> = await this.viagensCollection.add(payloadComUtilizador);
    return docRef.id;
  }

  /**
   * Atualiza os dados de uma viagem existente.
   * Remove campos undefined para evitar erros no Firestore.
   */
  async updateViagem(id: string, viagem: Partial<Viagem>): Promise<void> {
    await this.garantirPodeEditarViagem(id, viagem);

    // Estes campos não podem ser alterados através de uma atualização normal.
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
   * Apenas o dono da viagem pode apagar o documento.
   */
  async deleteViagem(id: string): Promise<void> {
    await this.garantirViagemDoUtilizadorAtual(id);

    const db = getFirestore();
    const viagemRef = doc(db, this.collectionName, id);

    await deleteDoc(viagemRef);
  }

  /**
   * Devolve o nível de acesso do utilizador atualmente autenticado para uma viagem.
   */
  obterNivelAcessoAtual(viagem: Viagem | null | undefined): NivelAcessoEfetivo {
    const user = getAuth().currentUser;
    if (!user || !viagem) {
      return null;
    }

    if (viagem.uidUtilizador === user.uid) {
      return 'dono';
    }

    const emailAtual = user.email?.toLowerCase() || '';

    // A correspondência é feita por UID ou por email para cobrir convites sem UID associado.
    const colaborador = (viagem.colaboradores || []).find(item => {
      const emailColaborador = item.email?.toLowerCase() || '';
      return item.uid === user.uid || (!!emailAtual && emailColaborador === emailAtual);
    });

    return colaborador?.nivelAcesso || null;
  }

  /**
   * Indica se o utilizador atual pode editar conteúdo da viagem.
   */
  podeEditarViagemAtual(viagem: Viagem | null | undefined): boolean {
    const nivel = this.obterNivelAcessoAtual(viagem);
    return nivel === 'dono' || nivel === 'editor';
  }

  /**
   * Indica se o utilizador atual é o dono e pode gerir opções sensíveis da viagem.
   */
  podeGerirViagemAtual(viagem: Viagem | null | undefined): boolean {
    const user = getAuth().currentUser;
    return !!user && !!viagem && viagem.uidUtilizador === user.uid;
  }

  /**
   * Garante que uma viagem nova tem a lista de dias preenchida.
   */
  private adicionarDiasSeNecessario(viagem: ViagemPayload): ViagemPayload {
    if (viagem.dias && viagem.dias.length > 0) {
      return viagem;
    }

    return {
      ...viagem,
      dias: this.gerarDiasDaViagem(viagem.dataInicio, viagem.dataFim)
    };
  }

  /**
   * Remove campos undefined de objetos/arrays antes de enviar para o Firestore.
   * O Firestore rejeita valores undefined em atualizações.
   */
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

  /**
   * Converte vários formatos de data para uma Date sem horas/minutos/segundos.
   * Isto evita diferenças de ordenação causadas por fusos horários ou timestamps parciais.
   */
  private normalizarData(data: DataViagem): Date {
    if (data instanceof Date) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    if (typeof data === 'string') {
      // Strings ISO com hora são primeiro convertidas para Date.
      if (data.includes('T')) {
        const date = new Date(data);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }

      // Strings simples devem vir no formato YYYY-MM-DD.
      const partesData = data.split('-').map(Number);

      if (partesData.length !== 3 || partesData.some(parte => Number.isNaN(parte))) {
        throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
      }

      const [ano, mes, dia] = partesData;
      return new Date(ano, mes - 1, dia);
    }

    // Timestamps do Firestore compatíveis com o método toDate().
    if (data && typeof data === 'object' && 'toDate' in data) {
      const date = (data as any).toDate();
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Suporta objetos serializados que guardam segundos em seconds ou _seconds.
    const segundos = data?.seconds ?? data?._seconds;
    if (typeof segundos === 'number') {
      const date = new Date(segundos * 1000);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
  }

  /**
   * Formata uma data para usar em IDs de dias, por exemplo dia-2026-06-04.
   */
  private formatarDataId(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Obtém o UID do utilizador autenticado ou lança erro se não houver sessão.
   */
  private async obterUidUtilizadorAtual(): Promise<string> {
    const user = getAuth().currentUser;

    if (!user) {
      throw new Error('É necessário iniciar sessão para gerir viagens.');
    }

    return user.uid;
  }

  /**
   * Confirma que a viagem pertence ao utilizador atual.
   * Usado em operações restritas ao dono, como apagar.
   */
  private async garantirViagemDoUtilizadorAtual(id: string): Promise<void> {
    const uid = await this.obterUidUtilizadorAtual();
    const db = getFirestore();
    const viagemRef = doc(db, this.collectionName, id);
    const viagemSnapshot = await getDoc(viagemRef);

    if (!viagemSnapshot.exists()) {
      throw new Error('Viagem não encontrada.');
    }

    const viagemDoc = viagemSnapshot.data() as ViagemPayload;

    if (viagemDoc.uidUtilizador !== uid) {
      throw new Error('Esta viagem não pertence ao utilizador autenticado.');
    }
  }

  /**
   * Confirma que o utilizador atual pode editar a viagem.
   * Editores podem alterar conteúdo, mas só o dono pode gerir colaboração/publicação.
   */
  private async garantirPodeEditarViagem(id: string, alteracoes: Partial<Viagem>): Promise<void> {
    const user = getAuth().currentUser;

    if (!user) {
      throw new Error('É necessário iniciar sessão para gerir viagens.');
    }

    const db = getFirestore();
    const viagemRef = doc(db, this.collectionName, id);
    const viagemSnapshot = await getDoc(viagemRef);

    if (!viagemSnapshot.exists()) {
      throw new Error('Viagem não encontrada.');
    }

    const viagem = {
      id: viagemSnapshot.id,
      ...viagemSnapshot.data() as ViagemPayload
    };

    if (viagem.uidUtilizador === user.uid) {
      return;
    }

    const emailAtual = user.email?.toLowerCase() || '';

    // Procura permissões de colaborador por UID ou por email.
    const colaborador = (viagem.colaboradores || []).find(item => {
      const emailColaborador = item.email?.toLowerCase() || '';
      return item.uid === user.uid || (!!emailAtual && emailColaborador === emailAtual);
    });

    if (colaborador?.nivelAcesso !== 'editor' && colaborador?.nivelAcesso !== 'dono') {
      throw new Error('Não tem permissão para editar esta viagem.');
    }

    // Estes campos ficam reservados ao dono da viagem.
    const camposSoDono: Array<keyof Viagem> = [
      'colaboradores',
      'publicada',
      'publicacaoId',
      'visibilidadePublicacao',
      'textoPublicacao'
    ];

    if (camposSoDono.some(campo => campo in alteracoes)) {
      throw new Error('Apenas o dono pode gerir colaboradores ou publicar a viagem.');
    }
  }

  /**
   * Compara datas por ordem ascendente.
   */
  private compararDatas(dataA: DataOrdenavel, dataB: DataOrdenavel): number {
    return this.converterParaTimestamp(dataA) - this.converterParaTimestamp(dataB);
  }

  /**
   * Compara datas por ordem descendente.
   */
  private compararDatasDesc(dataA: DataOrdenavel, dataB: DataOrdenavel): number {
    return this.converterParaTimestamp(dataB) - this.converterParaTimestamp(dataA);
  }

  /**
   * Converte uma data ordenável para timestamp em milissegundos.
   * Quando o valor não é reconhecido, devolve 0 para manter a ordenação estável.
   */
  private converterParaTimestamp(data: DataOrdenavel): number {
    if (data instanceof Date) {
      return data.getTime();
    }

    if (typeof data === 'string') {
      return this.normalizarData(data).getTime();
    }

    if (data && typeof data.toDate === 'function') {
      return data.toDate().getTime();
    }

    const segundos = data?.seconds ?? data?._seconds;
    if (typeof segundos === 'number') {
      return segundos * 1000;
    }

    return 0;
  }

  /**
   * Decide se uma viagem deve aparecer no feed de amigos do utilizador.
   */
  private viagemApareceNoFeed(viagem: Viagem, uid: string, email: string): boolean {
    // O feed de amigos não deve mostrar viagens do próprio utilizador.
    if (viagem.uidUtilizador === uid) {
      return false;
    }

    // Só colaboradores devem ver viagens partilhadas neste feed.
    if (!this.utilizadorEColaborador(viagem, uid, email)) {
      return false;
    }

    // Compatibilidade com campos antigos: "publico" e "publicada".
    const marcadaComoPublicada = (viagem as any).publicada === true || (viagem as any).publico === true;

    return marcadaComoPublicada || viagem.status === 'concluida' || viagem.status === 'em-andamento';
  }

  /**
   * Atalho semântico para verificar se um utilizador pode ver uma viagem.
   */
  private utilizadorPodeVerViagem(viagem: Viagem, uid: string, email: string): boolean {
    return this.utilizadorPodeAbrirViagem(viagem, uid, email);
  }

  /**
   * Verifica se o utilizador tem acesso direto: dono ou colaborador.
   */
  private utilizadorTemAcessoDiretoViagem(viagem: Viagem, uid: string, email: string): boolean {
    return viagem.uidUtilizador === uid || this.utilizadorEColaborador(viagem, uid, email);
  }

  /**
   * Verifica se o utilizador pode abrir a viagem.
   * Viagens públicas também podem ser abertas fora do acesso direto.
   */
  private utilizadorPodeAbrirViagem(viagem: Viagem, uid: string, email: string): boolean {
    return this.utilizadorTemAcessoDiretoViagem(viagem, uid, email)
      || (viagem.publicada === true && viagem.visibilidadePublicacao === 'publica');
  }

  /**
   * Verifica se o utilizador aparece na lista de colaboradores por UID ou email.
   */
  private utilizadorEColaborador(viagem: Viagem, uid: string, email: string): boolean {
    const colaboradores = viagem.colaboradores || [];
    const emailNormalizado = email.toLowerCase();

    return colaboradores.some(colaborador =>
      colaborador.uid === uid || (!!emailNormalizado && colaborador.email?.toLowerCase() === emailNormalizado)
    );
  }
}
