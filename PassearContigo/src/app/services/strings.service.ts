// app/services/strings.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * StringsService
 * Gere todas as strings da aplicação
 * Suporta múltiplos idiomas e interpolação de variáveis
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class StringsService {
  /** Mapa completo de strings carregado a partir de assets/strings.json. */
  private strings: any = {};
  /** Idioma atualmente activo na aplicação. */
  private currentLanguage = new BehaviorSubject<string>('pt');
  /** Indica se o ficheiro de strings já foi carregado. */
  private stringsLoaded = false;

  /** Inicia o carregamento das strings assim que o serviço é criado. */
  constructor() {
    // Atualiza ou consulta estado da pagina.
    this.loadStrings();
  }

  /**
   * Carrega as strings do ficheiro strings.json
   */
  private async loadStrings(): Promise<void> {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const response = await fetch('/assets/strings.json');
      // Atualiza ou consulta estado da pagina.
      this.strings = await response.json();
      // Atualiza ou consulta estado da pagina.
      this.stringsLoaded = true;
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao carregar strings:', error);
    }
  }

  /**
   * Obtém uma string por chave (suporta notação de ponto: 'app.title')
   * @param key - Chave da string
   * @param params - Parâmetros para interpolação (opcional)
   * @returns String formatada ou chave se não encontrada
   */
  get(key: string, params?: Record<string, any>): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.stringsLoaded) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Strings ainda não carregadas');
      // Devolve o resultado deste bloco.
      return key;
    }

    // Cria uma variavel local para esta operacao.
    const value = this.getNestedValue(key);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!value) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn(`String não encontrada: ${key}`);
      // Devolve o resultado deste bloco.
      return key;
    }

    // Se não há parâmetros, retorna a string como está
    if (!params) {
      // Devolve o resultado deste bloco.
      return value;
    }

    // Interpola variáveis na string
    return this.interpolate(value, params);
  }

  /**
   * Obtém uma string como Observable (para reatividade)
   * @param key - Chave da string
   * @param params - Parâmetros para interpolação (opcional)
   * @returns Observable da string
   */
  get$(key: string, params?: Record<string, any>): Observable<string> {
    // Devolve o resultado deste bloco.
    return new Observable(observer => {
      // Executa uma instrucao necessaria para este fluxo.
      observer.next(this.get(key, params));
      // Executa uma instrucao necessaria para este fluxo.
      observer.complete();
    });
  }

  /**
   * Obtém o valor aninhado de um objecto usando notação de ponto
   * @param key - Chave com notação de ponto (ex: 'app.title')
   * @returns Valor encontrado ou undefined
   */
  private getNestedValue(key: string): string | undefined {
    // Cria uma variavel local para esta operacao.
    const keys = key.split('.');
    // Cria uma variavel local para esta operacao.
    let value: any = this.strings;

    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const k of keys) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (value && typeof value === 'object' && k in value) {
        // Atribui um valor a esta propriedade.
        value = value[k];
      // Executa uma instrucao necessaria para este fluxo.
      } else {
        // Devolve o resultado deste bloco.
        return undefined;
      }
    }

    // Devolve o resultado deste bloco.
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Interpola variáveis em uma string
   * Exemplo: "Olá {name}!" com params {name: 'João'} = "Olá João!"
   * @param template - String com placeholders
   * @param params - Parâmetros para substituição
   * @returns String interpolada
   */
  private interpolate(template: string, params: Record<string, any>): string {
    // Cria uma variavel local para esta operacao.
    let result = template;
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const [key, value] of Object.entries(params)) {
      // Cria uma variavel local para esta operacao.
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      // Atribui um valor a esta propriedade.
      result = result.replace(regex, String(value));
    }
    // Devolve o resultado deste bloco.
    return result;
  }

  /**
   * Define o idioma atual
   * @param language - Código do idioma (ex: 'pt', 'en', 'es')
   */
  setLanguage(language: string): void {
    // Atualiza ou consulta estado da pagina.
    this.currentLanguage.next(language);
  }

  /**
   * Obtém o idioma atual
   * @returns Observable do idioma atual
   */
  getLanguage$(): Observable<string> {
    // Devolve o resultado deste bloco.
    return this.currentLanguage.asObservable();
  }

  /**
   * Obtém o idioma atual (sincronamente)
   * @returns Código do idioma
   */
  getLanguage(): string {
    // Devolve o resultado deste bloco.
    return this.currentLanguage.value;
  }

  /**
   * Obtém todas as strings de uma secção
   * @param section - Nome da secção (ex: 'app', 'tabs', 'auth')
   * @returns Objeto com todas as strings da secção
   */
  getSection(section: string): Record<string, string> {
    // Devolve o resultado deste bloco.
    return this.strings[section] || {};
  }

  /**
   * Obtém todas as strings carregadas
   * @returns Objeto com todas as strings
   */
  getAllStrings(): any {
    // Devolve o resultado deste bloco.
    return this.strings;
  }

  /**
   * Verifica se uma string existe
   * @param key - Chave da string
   * @returns true se existe, false caso contrário
   */
  has(key: string): boolean {
    // Devolve o resultado deste bloco.
    return this.getNestedValue(key) !== undefined;
  }

  /**
   * Recarrega as strings do arquivo
   */
  reload(): void {
    // Atualiza ou consulta estado da pagina.
    this.stringsLoaded = false;
    // Atualiza ou consulta estado da pagina.
    this.loadStrings();
  }
}
