import { Injectable } from '@angular/core';
import { ViagensService } from './viagens.service';
import { POI, Viagem } from '../models/viagem.model';

/**
 * POIService
 * Serviço responsável pelo gerenciamento de Pontos de Interesse (POIs)
 * Associados a dias específicos de uma viagem no Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class POIService {

  constructor(private viagensService: ViagensService) {}

  /**
   * Adiciona um novo POI a um dia específico de uma viagem
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @param poi O POI a adicionar
   */
  async adicionarPOI(viagemId: string, diaId: string, poi: POI): Promise<void> {
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

    await this.viagensService.updateViagem(viagemId, { dias: diasAtualizados });
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
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    
    if (!viagem || !viagem.dias) {
      return [];
    }

    const dia = viagem.dias.find(d => d.id === diaId);
    return dia?.pontosInteresse || [];
  }

  /**
   * Obtém um POI específico
   * @param viagemId ID da viagem
   * @param diaId ID do dia
   * @param poiId ID do POI
   * @returns O POI ou undefined se não encontrado
   */
  async obterPOI(viagemId: string, diaId: string, poiId: string): Promise<POI | undefined> {
    const viagem = await this.viagensService.getViagemByIdOnce(viagemId);
    
    if (!viagem || !viagem.dias) {
      return undefined;
    }

    const dia = viagem.dias.find(d => d.id === diaId);
    return dia?.pontosInteresse?.find(poi => poi.id === poiId);
  }
}
