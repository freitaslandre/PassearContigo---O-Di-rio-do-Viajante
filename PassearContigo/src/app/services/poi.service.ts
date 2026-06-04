// app/services/poi.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { BehaviorSubject } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from './viagens.service';
// Importa dependencias usadas neste ficheiro.
import { POI, Viagem } from '../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { StorageService } from './storage.service';

// Contrato de dados usado para tipar objetos desta area.
interface PoiLocalPendente {
  // Define um campo ou opcao de configuracao.
  viagemId: string;
  // Define um campo ou opcao de configuracao.
  diaId: string;
  // Define um campo ou opcao de configuracao.
  poi: POI;
  // Define um campo ou opcao de configuracao.
  criadoEm: string;
}

// Contrato de dados usado para tipar objetos desta area.
export interface EstadoSincronizacaoPoi {
  // Define um campo ou opcao de configuracao.
  online: boolean;
  // Define um campo ou opcao de configuracao.
  sincronizando: boolean;
  // Define um campo ou opcao de configuracao.
  pendentes: number;
}

/**
 * POIService
 * Serviço responsável pelo gerenciamento de Pontos de Interesse (POIs)
 * Associados a dias específicos de uma viagem no Firestore.
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class POIService {
  // Define um membro interno desta classe.
  private readonly poisPendentesKey = 'pois_pendentes_offline';
  // Define um membro interno desta classe.
  private sincronizacaoEmCurso = false;
  // Define um membro interno desta classe.
  private readonly estadoSincronizacaoSubject = new BehaviorSubject<EstadoSincronizacaoPoi>({
    // Define um campo ou opcao de configuracao.
    online: this.temRede(),
    // Define um campo ou opcao de configuracao.
    sincronizando: false,
    // Define um campo ou opcao de configuracao.
    pendentes: 0
  });

  // Atribui um valor a esta propriedade.
  estadoSincronizacao$ = this.estadoSincronizacaoSubject.asObservable();

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private storageService: StorageService
  // Executa uma instrucao necessaria para este fluxo.
  ) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof window !== 'undefined') {
      // Executa uma instrucao necessaria para este fluxo.
      window.addEventListener('offline', () => {
        // Atualiza ou consulta estado da pagina.
        this.atualizarEstadoSincronizacao({ online: false });
      });

      // Executa uma instrucao necessaria para este fluxo.
      window.addEventListener('online', () => {
        // Atualiza ou consulta estado da pagina.
        this.atualizarEstadoSincronizacao({ online: true });
        // Atualiza ou consulta estado da pagina.
        this.sincronizarPoisPendentes();
      });
    }

    // Atualiza ou consulta estado da pagina.
    this.atualizarContagemPendentes();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.temRede()) {
      // Atualiza ou consulta estado da pagina.
      this.sincronizarPoisPendentes();
    }
  }

  /**
   * Adiciona um novo POI a um dia específico de uma viagem
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @param poi O POI a adicionar
   */
  async adicionarPOI(viagemId: string, diaId: string, poi: POI): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temRede()) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.guardarPoiLocalmente(viagemId, diaId, poi);
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.adicionarPoiNoFirestore(viagemId, diaId, poi);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.ehErroDeRede(error)) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.guardarPoiLocalmente(viagemId, diaId, poi);
        // Devolve o resultado deste bloco.
        return;
      }

      // Executa uma instrucao necessaria para este fluxo.
      throw error;
    }
  }

  /**
   * Atualiza um POI existente
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @param poiId ID do POI
   * @param poiAtualizado Dados atualizados do POI
   */
  async atualizarPOI(
    // Define um campo ou opcao de configuracao.
    viagemId: string,
    // Define um campo ou opcao de configuracao.
    diaId: string,
    // Define um campo ou opcao de configuracao.
    poiId: string,
    // Define um campo ou opcao de configuracao.
    poiAtualizado: Partial<POI>
  // Executa uma instrucao necessaria para este fluxo.
  ): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagem || !viagem.dias) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Viagem não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const dia = viagem.dias.find(d => d.id === diaId);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dia) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Dia não encontrado.');
    }

    // Cria uma variavel local para esta operacao.
    const diasAtualizados = viagem.dias.map(d => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (d.id !== diaId) {
        // Devolve o resultado deste bloco.
        return d;
      }

      // Cria uma variavel local para esta operacao.
      const pontosInteresseAtualizados = (d.pontosInteresse || []).map(poi => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (poi.id !== poiId) {
          // Devolve o resultado deste bloco.
          return poi;
        }

        // Devolve o resultado deste bloco.
        return {
          // Executa uma instrucao necessaria para este fluxo.
          ...poi,
          // Executa uma instrucao necessaria para este fluxo.
          ...poiAtualizado,
          // Define um campo ou opcao de configuracao.
          id: poi.id // Garantir que o ID não muda
        };
      });

      // Devolve o resultado deste bloco.
      return {
        // Executa uma instrucao necessaria para este fluxo.
        ...d,
        // Define um campo ou opcao de configuracao.
        pontosInteresse: pontosInteresseAtualizados
      };
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
  }

  /**
   * Elimina um POI
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @param poiId ID do POI a eliminar
   */
  async eliminarPOI(viagemId: string, diaId: string, poiId: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagem || !viagem.dias) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Viagem não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const dia = viagem.dias.find(d => d.id === diaId);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dia) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Dia não encontrado.');
    }

    // Cria uma variavel local para esta operacao.
    const diasAtualizados = viagem.dias.map(d => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (d.id !== diaId) {
        // Devolve o resultado deste bloco.
        return d;
      }

      // Cria uma variavel local para esta operacao.
      const pontosInteresseFiltrados = (d.pontosInteresse || []).filter(
        // Atribui um valor a esta propriedade.
        poi => poi.id !== poiId
      );

      // Devolve o resultado deste bloco.
      return {
        // Executa uma instrucao necessaria para este fluxo.
        ...d,
        // Define um campo ou opcao de configuracao.
        pontosInteresse: pontosInteresseFiltrados
      };
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
  }

  /**
   * Obtém todos os POIs de um dia específico
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @returns Array de POIs
   */
  async obterPOIsPorDia(viagemId: string, diaId: string): Promise<POI[]> {
    // Cria uma variavel local para esta operacao.
    const poisLocais = await this.obterPoisLocaisPorDia(viagemId, diaId);
    // Cria uma variavel local para esta operacao.
    let viagem: Viagem | null = null;

    // Inicia um bloco protegido contra erros.
    try {
      // Atribui um valor a esta propriedade.
      viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (poisLocais.length > 0) {
        // Devolve o resultado deste bloco.
        return poisLocais;
      }

      // Executa uma instrucao necessaria para este fluxo.
      throw error;
    }
    
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagem || !viagem.dias) {
      // Devolve o resultado deste bloco.
      return poisLocais;
    }

    // Cria uma variavel local para esta operacao.
    const dia = viagem.dias.find(d => d.id === diaId);
    // Devolve o resultado deste bloco.
    return this.juntarPoisSemDuplicados(dia?.pontosInteresse || [], poisLocais);
  }

  /**
   * Obtém um POI específico
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @param poiId ID do POI
   * @returns O POI ou undefined se não encontrado
   */
  async obterPOI(viagemId: string, diaId: string, poiId: string): Promise<POI | undefined> {
    // Cria uma variavel local para esta operacao.
    const poiLocal = (await this.obterPoisLocaisPorDia(viagemId, diaId)).find(poi => poi.id === poiId);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temRede() && poiLocal) {
      // Devolve o resultado deste bloco.
      return poiLocal;
    }

    // Cria uma variavel local para esta operacao.
    let viagem: Viagem | null = null;

    // Inicia um bloco protegido contra erros.
    try {
      // Atribui um valor a esta propriedade.
      viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (poiLocal) {
        // Devolve o resultado deste bloco.
        return poiLocal;
      }

      // Executa uma instrucao necessaria para este fluxo.
      throw error;
    }
    
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagem || !viagem.dias) {
      // Devolve o resultado deste bloco.
      return poiLocal;
    }

    // Cria uma variavel local para esta operacao.
    const dia = viagem.dias.find(d => d.id === diaId);
    // Devolve o resultado deste bloco.
    return dia?.pontosInteresse?.find(poi => poi.id === poiId) || poiLocal;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async obterPOIsLocaisPendentesPorDia(viagemId: string, diaId: string): Promise<POI[]> {
    // Devolve o resultado deste bloco.
    return this.obterPoisLocaisPorDia(viagemId, diaId);
  }

  // Define um membro interno desta classe.
  private async guardarPoiLocalmente(viagemId: string, diaId: string, poi: POI): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const pendentes = await this.obterPoisPendentes();
    // Cria uma variavel local para esta operacao.
    const existe = pendentes.some(item =>
      // Executa uma instrucao necessaria para este fluxo.
      item.viagemId === viagemId &&
      // Executa uma instrucao necessaria para este fluxo.
      item.diaId === diaId &&
      // Executa uma instrucao necessaria para este fluxo.
      item.poi.id === poi.id
    );

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!existe) {
      // Executa uma instrucao necessaria para este fluxo.
      pendentes.push({
        // Executa uma instrucao necessaria para este fluxo.
        viagemId,
        // Executa uma instrucao necessaria para este fluxo.
        diaId,
        // Executa uma instrucao necessaria para este fluxo.
        poi,
        // Define um campo ou opcao de configuracao.
        criadoEm: new Date().toISOString()
      });
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.storageService.setItem(this.poisPendentesKey, pendentes);
    // Atualiza ou consulta estado da pagina.
    this.atualizarEstadoSincronizacao({ pendentes: pendentes.length });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async sincronizarPoisPendentes(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.sincronizacaoEmCurso || !this.temRede()) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.sincronizacaoEmCurso = true;
    // Atualiza ou consulta estado da pagina.
    this.atualizarEstadoSincronizacao({
      // Define um campo ou opcao de configuracao.
      online: true,
      // Define um campo ou opcao de configuracao.
      sincronizando: true
    });

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const pendentes = await this.obterPoisPendentes();
      // Cria uma variavel local para esta operacao.
      const aindaPendentes: PoiLocalPendente[] = [];

      // Define um metodo chamado pela pagina ou por outros metodos.
      for (const item of pendentes) {
        // Inicia um bloco protegido contra erros.
        try {
          // Aguarda a conclusao de uma operacao assincrona.
          await this.adicionarPoiNoFirestore(item.viagemId, item.diaId, item.poi);
        // Executa uma instrucao necessaria para este fluxo.
        } catch (error) {
          // Executa uma instrucao necessaria para este fluxo.
          console.warn('Não foi possível sincronizar POI local:', error);
          // Executa uma instrucao necessaria para este fluxo.
          aindaPendentes.push(item);
        }
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.storageService.setItem(this.poisPendentesKey, aindaPendentes);
      // Atualiza ou consulta estado da pagina.
      this.atualizarEstadoSincronizacao({ pendentes: aindaPendentes.length });
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.sincronizacaoEmCurso = false;
      // Atualiza ou consulta estado da pagina.
      this.atualizarEstadoSincronizacao({
        // Define um campo ou opcao de configuracao.
        online: this.temRede(),
        // Define um campo ou opcao de configuracao.
        sincronizando: false
      });
    }
  }

  // Define um membro interno desta classe.
  private async adicionarPoiNoFirestore(viagemId: string, diaId: string, poi: POI): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagem || !viagem.dias) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Viagem não encontrada.');
    }

    // Cria uma variavel local para esta operacao.
    const dia = viagem.dias.find(d => d.id === diaId);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dia) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Dia não encontrado.');
    }

    // Cria uma variavel local para esta operacao.
    const poiJaExiste = (dia.pontosInteresse || []).some(item => item.id === poi.id);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (poiJaExiste) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const diasAtualizados = viagem.dias.map(d => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (d.id !== diaId) {
        // Devolve o resultado deste bloco.
        return d;
      }

      // Devolve o resultado deste bloco.
      return {
        // Executa uma instrucao necessaria para este fluxo.
        ...d,
        // Define um campo ou opcao de configuracao.
        pontosInteresse: [...(d.pontosInteresse || []), poi]
      };
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
  }

  // Define um membro interno desta classe.
  private async obterPoisLocaisPorDia(viagemId: string, diaId: string): Promise<POI[]> {
    // Cria uma variavel local para esta operacao.
    const pendentes = await this.obterPoisPendentes();

    // Devolve o resultado deste bloco.
    return pendentes
      // Executa uma instrucao necessaria para este fluxo.
      .filter(item => item.viagemId === viagemId && item.diaId === diaId)
      // Executa uma instrucao necessaria para este fluxo.
      .map(item => item.poi);
  }

  // Define um membro interno desta classe.
  private async obterPoisPendentes(): Promise<PoiLocalPendente[]> {
    // Cria uma variavel local para esta operacao.
    const pendentes = await this.storageService.getItem(this.poisPendentesKey);
    // Devolve o resultado deste bloco.
    return Array.isArray(pendentes) ? pendentes : [];
  }

  // Define um membro interno desta classe.
  private async atualizarContagemPendentes(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const pendentes = await this.obterPoisPendentes();
    // Atualiza ou consulta estado da pagina.
    this.atualizarEstadoSincronizacao({ pendentes: pendentes.length });
  }

  // Define um membro interno desta classe.
  private atualizarEstadoSincronizacao(estado: Partial<EstadoSincronizacaoPoi>): void {
    // Atualiza ou consulta estado da pagina.
    this.estadoSincronizacaoSubject.next({
      // Executa uma instrucao necessaria para este fluxo.
      ...this.estadoSincronizacaoSubject.value,
      // Executa uma instrucao necessaria para este fluxo.
      ...estado
    });
  }

  // Define um membro interno desta classe.
  private juntarPoisSemDuplicados(poisRemotos: POI[], poisLocais: POI[]): POI[] {
    // Cria uma variavel local para esta operacao.
    const idsRemotos = new Set(poisRemotos.map(poi => poi.id));
    // Cria uma variavel local para esta operacao.
    const locaisNovos = poisLocais.filter(poi => !idsRemotos.has(poi.id));

    // Devolve o resultado deste bloco.
    return [...poisRemotos, ...locaisNovos];
  }

  // Define um membro interno desta classe.
  private temRede(): boolean {
    // Devolve o resultado deste bloco.
    return typeof navigator === 'undefined' || navigator.onLine;
  }

  // Define um membro interno desta classe.
  private ehErroDeRede(error: any): boolean {
    // Cria uma variavel local para esta operacao.
    const codigo = String(error?.code || '').toLowerCase();
    // Cria uma variavel local para esta operacao.
    const mensagem = String(error?.message || '').toLowerCase();

    // Devolve o resultado deste bloco.
    return !this.temRede() ||
      // Executa uma instrucao necessaria para este fluxo.
      codigo.includes('unavailable') ||
      // Executa uma instrucao necessaria para este fluxo.
      mensagem.includes('offline') ||
      // Executa uma instrucao necessaria para este fluxo.
      mensagem.includes('network') ||
      // Executa uma instrucao necessaria para este fluxo.
      mensagem.includes('failed to get document because the client is offline');
  }
}
