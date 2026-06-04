// app/services/screen-orientation.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

/**
 * ScreenOrientationService
 * Gere a orientação do ecrã da aplicação
 * Responsável por bloquear a orientação em portrait (req. 12)
 */
@Injectable({
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ScreenOrientationService {

  constructor() {}

  /**
   * Bloqueia a orientação em portrait (desativa landscape)
   * Executado ao inicializar a aplicação
   */
  async lockPortraitOrientation(): Promise<void> {
    try {
      // Bloqueia a orientação em portrait
      await ScreenOrientation.lock({ orientation: 'portrait' });
      console.log('✓ Orientação bloqueada em PORTRAIT');
    } catch (error) {
      console.warn('⚠ Não foi possível bloquear orientação:', error);
      // A falha não é crítica - a aplicação continua a funcionar
    }
  }

  /**
   * Desbloqueia a orientação (permite rotação livre)
   * Útil se for necessário permitir landscape numa secção específica
   */
  async unlockOrientation(): Promise<void> {
    try {
      await ScreenOrientation.unlock();
      console.log('✓ Orientação desbloqueada (rotação livre)');
    } catch (error) {
      console.warn('⚠ Não foi possível desbloquear orientação:', error);
    }
  }

  /**
   * Obtém a orientação atual do ecrã
   */
  async getCurrentOrientation(): Promise<string> {
    try {
      // Nota: A versão atual do plugin não possui o método current()
      // Este método está reservado para uso futuro
      console.log('Método getCurrentOrientation não disponível nesta versão do plugin');
      return 'portrait';
    } catch (error) {
      console.warn('⚠ Erro ao obter orientação:', error);
      return 'unknown';
    }
  }
}
