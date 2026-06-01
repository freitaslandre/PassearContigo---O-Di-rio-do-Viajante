import { Injectable } from '@angular/core';
import { ViagensService } from './viagens.service';
import { POI, Viagem } from '../models/viagem.model';
import { StorageService } from './storage.service';

interface PoiLocalPendente {
  viagemId: string;
  diaId: string;
  poi: POI;
  criadoEm: string;
}

/**
 * POIService
 * Serviço responsável pelo gerenciamento de Pontos de Interesse (POIs)
 * Associados a dias específicos de uma viagem no Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class POIService {
  private readonly poisPendentesKey = 'pois_pendentes_offline';
  private sincronizacaoEmCurso = false;

  constructor(
    private viagensService: ViagensService,
    private storageService: StorageService
  ) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.sincronizarPoisPendentes();
      });
    }

    if (this.temRede()) {
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
    if (!this.temRede()) {
      await this.guardarPoiLocalmente(viagemId, diaId, poi);
      return;
    }

    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    
    if (!viagem || !viagem.dias) {
      throw new Error('Viagem não encontrada.');
    }

    const dia = viagem.dias.find(d => d.id === diaId);
    if (!dia) {
      throw new Error('Dia não encontrado.');
    }

    const diasAtualizados = viagem.dias.map(d => {
      if (d.id !== diaId) {
        return d;
      }

      return {
        ...d,
        pontosInteresse: [...(d.pontosInteresse || []), poi]
      };
    });

    try {
      await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
    } catch (error) {
      if (this.ehErroDeRede(error)) {
        await this.guardarPoiLocalmente(viagemId, diaId, poi);
        return;
      }

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
    viagemId: string,
    diaId: string,
    poiId: string,
    poiAtualizado: Partial<POI>
  ): Promise<void> {
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    
    if (!viagem || !viagem.dias) {
      throw new Error('Viagem não encontrada.');
    }

    const dia = viagem.dias.find(d => d.id === diaId);
    if (!dia) {
      throw new Error('Dia não encontrado.');
    }

    const diasAtualizados = viagem.dias.map(d => {
      if (d.id !== diaId) {
        return d;
      }

      const pontosInteresseAtualizados = (d.pontosInteresse || []).map(poi => {
        if (poi.id !== poiId) {
          return poi;
        }

        return {
          ...poi,
          ...poiAtualizado,
          id: poi.id // Garantir que o ID não muda
        };
      });

      return {
        ...d,
        pontosInteresse: pontosInteresseAtualizados
      };
    });

    await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
  }

  /**
   * Elimina um POI
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @param poiId ID do POI a eliminar
   */
  async eliminarPOI(viagemId: string, diaId: string, poiId: string): Promise<void> {
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    
    if (!viagem || !viagem.dias) {
      throw new Error('Viagem não encontrada.');
    }

    const dia = viagem.dias.find(d => d.id === diaId);
    if (!dia) {
      throw new Error('Dia não encontrado.');
    }

    const diasAtualizados = viagem.dias.map(d => {
      if (d.id !== diaId) {
        return d;
      }

      const pontosInteresseFiltrados = (d.pontosInteresse || []).filter(
        poi => poi.id !== poiId
      );

      return {
        ...d,
        pontosInteresse: pontosInteresseFiltrados
      };
    });

    await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
  }

  /**
   * Obtém todos os POIs de um dia específico
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @returns Array de POIs
   */
  async obterPOIsPorDia(viagemId: string, diaId: string): Promise<POI[]> {
    const poisLocais = await this.obterPoisLocaisPorDia(viagemId, diaId);
    let viagem: Viagem | null = null;

    try {
      viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    } catch (error) {
      if (poisLocais.length > 0) {
        return poisLocais;
      }

      throw error;
    }
    
    if (!viagem || !viagem.dias) {
      return poisLocais;
    }

    const dia = viagem.dias.find(d => d.id === diaId);
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
    const poiLocal = (await this.obterPoisLocaisPorDia(viagemId, diaId)).find(poi => poi.id === poiId);

    if (!this.temRede() && poiLocal) {
      return poiLocal;
    }

    let viagem: Viagem | null = null;

    try {
      viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    } catch (error) {
      if (poiLocal) {
        return poiLocal;
      }

      throw error;
    }
    
    if (!viagem || !viagem.dias) {
      return poiLocal;
    }

    const dia = viagem.dias.find(d => d.id === diaId);
    return dia?.pontosInteresse?.find(poi => poi.id === poiId) || poiLocal;
  }

  private async guardarPoiLocalmente(viagemId: string, diaId: string, poi: POI): Promise<void> {
    const pendentes = await this.obterPoisPendentes();
    const existe = pendentes.some(item =>
      item.viagemId === viagemId &&
      item.diaId === diaId &&
      item.poi.id === poi.id
    );

    if (!existe) {
      pendentes.push({
        viagemId,
        diaId,
        poi,
        criadoEm: new Date().toISOString()
      });
    }

    await this.storageService.setItem(this.poisPendentesKey, pendentes);
  }

  private async sincronizarPoisPendentes(): Promise<void> {
    if (this.sincronizacaoEmCurso || !this.temRede()) {
      return;
    }

    this.sincronizacaoEmCurso = true;

    try {
      const pendentes = await this.obterPoisPendentes();
      const aindaPendentes: PoiLocalPendente[] = [];

      for (const item of pendentes) {
        try {
          await this.adicionarPoiNoFirestore(item.viagemId, item.diaId, item.poi);
        } catch (error) {
          console.warn('Nao foi possivel sincronizar POI local:', error);
          aindaPendentes.push(item);
        }
      }

      await this.storageService.setItem(this.poisPendentesKey, aindaPendentes);
    } finally {
      this.sincronizacaoEmCurso = false;
    }
  }

  private async adicionarPoiNoFirestore(viagemId: string, diaId: string, poi: POI): Promise<void> {
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);

    if (!viagem || !viagem.dias) {
      throw new Error('Viagem nao encontrada.');
    }

    const dia = viagem.dias.find(d => d.id === diaId);
    if (!dia) {
      throw new Error('Dia nao encontrado.');
    }

    const poiJaExiste = (dia.pontosInteresse || []).some(item => item.id === poi.id);
    if (poiJaExiste) {
      return;
    }

    const diasAtualizados = viagem.dias.map(d => {
      if (d.id !== diaId) {
        return d;
      }

      return {
        ...d,
        pontosInteresse: [...(d.pontosInteresse || []), poi]
      };
    });

    await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
  }

  private async obterPoisLocaisPorDia(viagemId: string, diaId: string): Promise<POI[]> {
    const pendentes = await this.obterPoisPendentes();

    return pendentes
      .filter(item => item.viagemId === viagemId && item.diaId === diaId)
      .map(item => item.poi);
  }

  private async obterPoisPendentes(): Promise<PoiLocalPendente[]> {
    const pendentes = await this.storageService.getItem(this.poisPendentesKey);
    return Array.isArray(pendentes) ? pendentes : [];
  }

  private juntarPoisSemDuplicados(poisRemotos: POI[], poisLocais: POI[]): POI[] {
    const idsRemotos = new Set(poisRemotos.map(poi => poi.id));
    const locaisNovos = poisLocais.filter(poi => !idsRemotos.has(poi.id));

    return [...poisRemotos, ...locaisNovos];
  }

  private temRede(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine;
  }

  private ehErroDeRede(error: any): boolean {
    const codigo = String(error?.code || '').toLowerCase();
    const mensagem = String(error?.message || '').toLowerCase();

    return !this.temRede() ||
      codigo.includes('unavailable') ||
      mensagem.includes('offline') ||
      mensagem.includes('network') ||
      mensagem.includes('failed to get document because the client is offline');
  }
}
