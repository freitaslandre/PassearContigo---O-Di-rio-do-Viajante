// app/services/screen-orientation.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ScreenOrientation } from '@capacitor/screen-orientation';

/**
 * ScreenOrientationService
 * Gere a orientação do ecrã da aplicação
 * Responsável por bloquear a orientação em portrait (req. 12)
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ScreenOrientationService {

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor() {}

  /**
   * Bloqueia a orientação em portrait (desativa landscape)
   * Executado ao inicializar a aplicação
   */
  async lockPortraitOrientation(): Promise<void> {
    // Inicia um bloco protegido contra erros.
    try {
      // Bloqueia a orientação em portrait
      await ScreenOrientation.lock({ orientation: 'portrait' });
      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Orientação bloqueada em PORTRAIT');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Não foi possível bloquear orientação:', error);
      // A falha não é crítica - a aplicação continua a funcionar
    }
  }

  /**
   * Desbloqueia a orientação (permite rotação livre)
   * Útil se for necessário permitir landscape numa secção específica
   */
  async unlockOrientation(): Promise<void> {
    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await ScreenOrientation.unlock();
      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Orientação desbloqueada (rotação livre)');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Não foi possível desbloquear orientação:', error);
    }
  }

  /**
   * Obtém a orientação atual do ecrã
   */
  async getCurrentOrientation(): Promise<string> {
    // Inicia um bloco protegido contra erros.
    try {
      // Nota: A versão atual do plugin não possui o método current()
      // Este método está reservado para uso futuro
      console.log('Método getCurrentOrientation não disponível nesta versão do plugin');
      // Devolve o resultado deste bloco.
      return 'portrait';
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Erro ao obter orientação:', error);
      // Devolve o resultado deste bloco.
      return 'unknown';
    }
  }
}
