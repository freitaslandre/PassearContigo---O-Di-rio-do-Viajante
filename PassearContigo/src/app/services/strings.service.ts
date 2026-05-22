import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * StringsService
 * Gerencia todas as strings da aplicação
 * Suporta múltiplos idiomas e interpolação de variáveis
 */
@Injectable({
  providedIn: 'root'
})
export class StringsService {
  private strings: any = {};
  private currentLanguage = new BehaviorSubject<string>('pt');
  private stringsLoaded = false;

  constructor() {
    this.loadStrings();
  }

  /**
   * Carrega as strings do arquivo strings.json
   */
  private async loadStrings(): Promise<void> {
    try {
      const response = await fetch('/assets/strings.json');
      this.strings = await response.json();
      this.stringsLoaded = true;
    } catch (error) {
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
    if (!this.stringsLoaded) {
      console.warn('Strings ainda não carregadas');
      return key;
    }

    const value = this.getNestedValue(key);

    if (!value) {
      console.warn(`String não encontrada: ${key}`);
      return key;
    }

    // Se não há parâmetros, retorna a string como está
    if (!params) {
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
    return new Observable(observer => {
      observer.next(this.get(key, params));
      observer.complete();
    });
  }

  /**
   * Obtém o valor aninhado de um objeto usando notação de ponto
   * @param key - Chave com notação de ponto (ex: 'app.title')
   * @returns Valor encontrado ou undefined
   */
  private getNestedValue(key: string): string {
    const keys = key.split('.');
    let value: any = this.strings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

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
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * Define o idioma atual
   * @param language - Código do idioma (ex: 'pt', 'en', 'es')
   */
  setLanguage(language: string): void {
    this.currentLanguage.next(language);
  }

  /**
   * Obtém o idioma atual
   * @returns Observable do idioma atual
   */
  getLanguage$(): Observable<string> {
    return this.currentLanguage.asObservable();
  }

  /**
   * Obtém o idioma atual (sincronamente)
   * @returns Código do idioma
   */
  getLanguage(): string {
    return this.currentLanguage.value;
  }

  /**
   * Obtém todas as strings de uma seção
   * @param section - Nome da seção (ex: 'app', 'tabs', 'auth')
   * @returns Objeto com todas as strings da seção
   */
  getSection(section: string): Record<string, string> {
    return this.strings[section] || {};
  }

  /**
   * Obtém todas as strings carregadas
   * @returns Objeto com todas as strings
   */
  getAllStrings(): any {
    return this.strings;
  }

  /**
   * Verifica se uma string existe
   * @param key - Chave da string
   * @returns true se existe, false caso contrário
   */
  has(key: string): boolean {
    return this.getNestedValue(key) !== undefined;
  }

  /**
   * Recarrega as strings do arquivo
   */
  reload(): void {
    this.stringsLoaded = false;
    this.loadStrings();
  }
}
